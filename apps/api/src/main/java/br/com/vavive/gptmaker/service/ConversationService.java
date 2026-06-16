package br.com.vavive.gptmaker.service;

import br.com.vavive.gptmaker.domain.entity.ConversationSession;
import br.com.vavive.gptmaker.domain.entity.Franchise;
import br.com.vavive.gptmaker.domain.entity.User;
import br.com.vavive.gptmaker.domain.enums.UserRole;
import br.com.vavive.gptmaker.dto.ConversationMessageResponse;
import br.com.vavive.gptmaker.dto.ConversationSummaryResponse;
import br.com.vavive.gptmaker.dto.SendAgentConversationRequest;
import br.com.vavive.gptmaker.dto.SendAgentConversationResponse;
import br.com.vavive.gptmaker.dto.StartHumanTakeoverResponse;
import br.com.vavive.gptmaker.integration.gptmaker.GptMakerClient;
import br.com.vavive.gptmaker.integration.gptmaker.GptMakerClient.GptMakerIntegrationException;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerConversationRequest;
import br.com.vavive.gptmaker.repository.ConversationSessionRepository;
import br.com.vavive.gptmaker.repository.FranchiseRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ConversationService {
    private final ConversationSessionRepository conversationSessionRepository;
    private final FranchiseRepository franchiseRepository;
    private final CurrentUserService currentUserService;
    private final GptMakerClient gptMakerClient;

    public ConversationService(
        ConversationSessionRepository conversationSessionRepository,
        FranchiseRepository franchiseRepository,
        CurrentUserService currentUserService,
        GptMakerClient gptMakerClient
    ) {
        this.conversationSessionRepository = conversationSessionRepository;
        this.franchiseRepository = franchiseRepository;
        this.currentUserService = currentUserService;
        this.gptMakerClient = gptMakerClient;
    }

    @Transactional(readOnly = true)
    public List<ConversationSummaryResponse> list(UUID franchiseId) {
        User user = currentUserService.requireCurrentUser();
        if (user.getRole() == UserRole.SUPER_ADMIN) {
            if (franchiseId != null) {
                Franchise franchise = requireFranchise(franchiseId);
                return conversationSessionRepository.findByFranchiseIdOrderByUpdatedAtDesc(franchise.getId()).stream()
                    .map(this::toSummary)
                    .toList();
            }
            return conversationSessionRepository.findAll().stream()
                .sorted((left, right) -> right.getUpdatedAt().compareTo(left.getUpdatedAt()))
                .map(this::toSummary)
                .toList();
        }
        Franchise franchise = currentUserService.requireFranchise(user);
        return conversationSessionRepository.findByFranchiseIdOrderByUpdatedAtDesc(franchise.getId()).stream()
            .map(this::toSummary)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<ConversationMessageResponse> listMessages(UUID conversationId) {
        ConversationSession session = requireAccessibleConversation(conversationId);
        if (session.getInteractionId() != null && !session.getInteractionId().isBlank()) {
            try {
                List<ConversationMessageResponse> remoteMessages = gptMakerClient.listInteractionMessages(session.getInteractionId()).stream()
                    .map(item -> new ConversationMessageResponse(
                        item.id(),
                        item.role(),
                        item.type(),
                        item.text(),
                        item.userName(),
                        item.userPicture(),
                        item.imageUrl(),
                        item.audioUrl(),
                        item.documentUrl(),
                        item.fileName(),
                        item.mediaContent(),
                        item.time(),
                        item.width(),
                        item.height()
                    ))
                    .toList();
                if (!remoteMessages.isEmpty()) {
                    return remoteMessages;
                }
            } catch (GptMakerIntegrationException exception) {
                throw new ResponseStatusException(statusFor(exception), exception.getMessage());
            }
        }

        ConversationMessageResponse prompt = new ConversationMessageResponse(
            session.getId().toString() + "-prompt",
            "USER",
            "TEXT",
            session.getFirstPrompt(),
            session.getCustomerName(),
            null,
            null,
            null,
            null,
            null,
            null,
            session.getCreatedAt().atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli(),
            null,
            null
        );
        if (session.getLastResponse() == null || session.getLastResponse().isBlank()) {
            return List.of(prompt);
        }
        ConversationMessageResponse answer = new ConversationMessageResponse(
            session.getId().toString() + "-response",
            "ASSISTANT",
            "TEXT",
            session.getLastResponse(),
            session.getAgentName(),
            null,
            null,
            null,
            null,
            null,
            null,
            session.getUpdatedAt().atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli(),
            null,
            null
        );
        return List.of(prompt, answer);
    }

    @Transactional
    public StartHumanTakeoverResponse startHuman(UUID conversationId) {
        ConversationSession session = requireAccessibleConversation(conversationId);
        if (session.getChatId() == null || session.getChatId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Esta conversa ainda nao possui um chat GPTMaker pronto para assumir atendimento humano.");
        }

        try {
            var response = gptMakerClient.startHuman(session.getChatId());
            session.setHumanTakeoverActive(response.success());
            conversationSessionRepository.save(session);
            return new StartHumanTakeoverResponse(session.getId(), response.success(), response.success() ? "Atendimento humano iniciado com sucesso." : "Nao foi possivel iniciar o atendimento humano.");
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(statusFor(exception), exception.getMessage());
        }
    }

    @Transactional
    public SendAgentConversationResponse testAgent(SendAgentConversationRequest request) {
        Franchise franchise = requireConversationFranchise(request.franchiseId());
        if (franchise.getAgentId() == null || franchise.getAgentId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Esta franquia ainda nao possui um agente GPTMaker configurado.");
        }

        try {
            var response = gptMakerClient.sendConversation(
                franchise.getAgentId(),
                new GptMakerConversationRequest(
                    request.contextId(),
                    request.prompt(),
                    null,
                    null,
                    request.customerName(),
                    request.chatPicture(),
                    request.phone()
                )
            );
            ConversationSession session = conversationSessionRepository.save(new ConversationSession(
                franchise,
                franchise.getAgentId(),
                franchise.getAgentName(),
                request.contextId(),
                request.customerName(),
                request.phone(),
                request.prompt(),
                response.message(),
                response.chatId(),
                response.interactionId()
            ));
            return new SendAgentConversationResponse(
                session.getId(),
                franchise.getId(),
                franchise.getName(),
                franchise.getAgentName(),
                request.contextId(),
                response.chatId(),
                response.interactionId(),
                response.message(),
                response.images(),
                response.audios(),
                response.documents()
            );
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(statusFor(exception), exception.getMessage());
        }
    }

    private Franchise requireConversationFranchise(UUID franchiseId) {
        User user = currentUserService.requireCurrentUser();
        if (user.getRole() == UserRole.ADMIN_FRANQUIA) {
            return currentUserService.requireFranchise(user);
        }
        if (franchiseId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecione a franquia para testar o agente.");
        }
        return requireFranchise(franchiseId);
    }

    private Franchise requireFranchise(UUID franchiseId) {
        return franchiseRepository.findById(franchiseId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Franquia nao encontrada"));
    }

    private ConversationSession requireAccessibleConversation(UUID conversationId) {
        User user = currentUserService.requireCurrentUser();
        if (user.getRole() == UserRole.SUPER_ADMIN) {
            return conversationSessionRepository.findById(conversationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversa nao encontrada"));
        }
        Franchise franchise = currentUserService.requireFranchise(user);
        return conversationSessionRepository.findByIdAndFranchiseId(conversationId, franchise.getId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "ADMIN_FRANQUIA so pode acessar conversas da propria franquia."));
    }

    private ConversationSummaryResponse toSummary(ConversationSession session) {
        return new ConversationSummaryResponse(
            session.getId(),
            session.getFranchise().getId(),
            session.getFranchise().getName(),
            session.getAgentName(),
            session.getCustomerName(),
            session.getCustomerPhone(),
            session.getContextId(),
            session.getFirstPrompt(),
            session.getLastResponse(),
            session.getChatId(),
            session.getInteractionId(),
            session.isHumanTakeoverActive(),
            session.getCreatedAt(),
            session.getUpdatedAt()
        );
    }

    private HttpStatus statusFor(GptMakerIntegrationException exception) {
        if ("INVALID_AGENT".equals(exception.getErrorCode())
            || "INVALID_CONVERSATION".equals(exception.getErrorCode())
            || "INVALID_CHAT".equals(exception.getErrorCode())
            || "INVALID_INTERACTION".equals(exception.getErrorCode())
            || "MOCK_DISABLED_FOR_CONVERSATIONS".equals(exception.getErrorCode())
            || "MISSING_TOKEN".equals(exception.getErrorCode())) {
            return HttpStatus.BAD_REQUEST;
        }
        return HttpStatus.BAD_GATEWAY;
    }
}
