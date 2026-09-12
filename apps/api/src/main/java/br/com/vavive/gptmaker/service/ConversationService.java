package br.com.vavive.gptmaker.service;

import br.com.vavive.gptmaker.config.AppRuntimeProperties;
import br.com.vavive.gptmaker.domain.entity.ConversationHandoffEvent;
import br.com.vavive.gptmaker.domain.entity.ConversationSession;
import br.com.vavive.gptmaker.domain.entity.Franchise;
import br.com.vavive.gptmaker.domain.entity.FranchiseSetup;
import br.com.vavive.gptmaker.domain.entity.User;
import br.com.vavive.gptmaker.domain.enums.UserRole;
import br.com.vavive.gptmaker.dto.ConversationActionResponse;
import br.com.vavive.gptmaker.dto.ConversationCompleteRequest;
import br.com.vavive.gptmaker.dto.ConversationHandoffEventResponse;
import br.com.vavive.gptmaker.dto.ConversationManualMessageRequest;
import br.com.vavive.gptmaker.dto.ConversationMessageResponse;
import br.com.vavive.gptmaker.dto.ConversationMessagePageResponse;
import br.com.vavive.gptmaker.dto.ConversationPageResponse;
import br.com.vavive.gptmaker.dto.ConversationSummaryResponse;
import br.com.vavive.gptmaker.dto.SendAgentConversationRequest;
import br.com.vavive.gptmaker.dto.SendAgentConversationResponse;
import br.com.vavive.gptmaker.dto.StartHumanTakeoverResponse;
import br.com.vavive.gptmaker.dto.UpdateChatMessageRequest;
import br.com.vavive.gptmaker.integration.gptmaker.GptMakerClient;
import br.com.vavive.gptmaker.integration.gptmaker.GptMakerClient.GptMakerIntegrationException;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerConversationRequest;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerChatResponse;
import br.com.vavive.gptmaker.repository.ConversationHandoffEventRepository;
import br.com.vavive.gptmaker.repository.ConversationSessionRepository;
import br.com.vavive.gptmaker.repository.FranchiseRepository;
import br.com.vavive.gptmaker.repository.FranchiseSetupRepository;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.locks.ReentrantLock;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ConversationService {
    private static final int MAX_CHAT_PAGE_SIZE = 100;
    private static final int MAX_MESSAGE_PAGE_SIZE = 100;
    private static final int CHAT_SYNC_PAGE = 1;
    private static final int CHAT_SYNC_PAGE_SIZE = 50;
    private static final Logger log = LoggerFactory.getLogger(ConversationService.class);
    private final ConversationSessionRepository conversationSessionRepository;
    private final ConversationHandoffEventRepository handoffEventRepository;
    private final FranchiseRepository franchiseRepository;
    private final FranchiseSetupRepository franchiseSetupRepository;
    private final CurrentUserService currentUserService;
    private final GptMakerClient gptMakerClient;
    private final WhatsappHandoffService whatsappHandoffService;
    private final AppRuntimeProperties runtimeProperties;
    private final ReentrantLock[] operationalSessionLocks = new ReentrantLock[64];

    public ConversationService(
        ConversationSessionRepository conversationSessionRepository,
        ConversationHandoffEventRepository handoffEventRepository,
        FranchiseRepository franchiseRepository,
        FranchiseSetupRepository franchiseSetupRepository,
        CurrentUserService currentUserService,
        GptMakerClient gptMakerClient,
        WhatsappHandoffService whatsappHandoffService,
        AppRuntimeProperties runtimeProperties
    ) {
        this.conversationSessionRepository = conversationSessionRepository;
        this.handoffEventRepository = handoffEventRepository;
        this.franchiseRepository = franchiseRepository;
        this.franchiseSetupRepository = franchiseSetupRepository;
        this.currentUserService = currentUserService;
        this.gptMakerClient = gptMakerClient;
        this.whatsappHandoffService = whatsappHandoffService;
        this.runtimeProperties = runtimeProperties;
        for (int index = 0; index < operationalSessionLocks.length; index++) {
            operationalSessionLocks[index] = new ReentrantLock();
        }
    }

    @Transactional(readOnly = true)
    public List<ConversationSummaryResponse> list(UUID franchiseId, String status, String channel, String responsible) {
        User user = currentUserService.requireCurrentUser();
        Franchise franchise = user.getRole() == UserRole.SUPER_ADMIN
            ? (franchiseId == null ? null : requireFranchise(franchiseId))
            : currentUserService.requireFranchise(user);

        List<ConversationSummaryResponse> remoteItems = List.of();
        if (liveInboxEnabled() && franchise != null) {
            remoteItems = syncFranchisePage(franchise, CHAT_SYNC_PAGE, CHAT_SYNC_PAGE_SIZE).items();
        }

        List<ConversationSession> base = user.getRole() == UserRole.SUPER_ADMIN
            ? (franchise == null
                ? conversationSessionRepository.findAll()
                : conversationSessionRepository.findByFranchiseIdOrderByUpdatedAtDesc(franchise.getId()))
            : conversationSessionRepository.findByFranchiseIdOrderByUpdatedAtDesc(franchise.getId());
        List<ConversationSummaryResponse> localItems = deduplicateSessions(base).stream()
            .map(item -> toSummary(item, null))
            .toList();
        return filterSummaries(mergeSummaries(localItems, remoteItems), status, channel, responsible);
    }

    @Transactional(readOnly = true)
    public ConversationPageResponse listPage(
        UUID franchiseId,
        String status,
        String channel,
        String responsible,
        int page,
        int pageSize
    ) {
        validateConversationPagination(page, pageSize);
        User user = currentUserService.requireCurrentUser();
        Franchise franchise = user.getRole() == UserRole.SUPER_ADMIN
            ? (franchiseId == null ? null : requireFranchise(franchiseId))
            : currentUserService.requireFranchise(user);

        if (liveInboxEnabled() && franchise != null) {
            ConversationSyncPage synced = syncFranchisePage(franchise, page, pageSize);
            if (page == 1 && synced.items().isEmpty()) {
                return localConversationPage(
                    conversationSessionRepository.findByFranchiseIdOrderByUpdatedAtDesc(franchise.getId()),
                    status,
                    channel,
                    responsible,
                    page,
                    pageSize
                );
            }
            List<ConversationSummaryResponse> filtered = filterSummaries(synced.items(), status, channel, responsible);
            return new ConversationPageResponse(
                filtered,
                page,
                pageSize,
                synced.hasMore()
            );
        }

        List<ConversationSession> base = user.getRole() == UserRole.SUPER_ADMIN
            ? (franchiseId == null
                ? conversationSessionRepository.findAll()
                : conversationSessionRepository.findByFranchiseIdOrderByUpdatedAtDesc(franchise.getId()))
            : conversationSessionRepository.findByFranchiseIdOrderByUpdatedAtDesc(franchise.getId());
        return localConversationPage(base, status, channel, responsible, page, pageSize);
    }

    @Transactional
    public ConversationSummaryResponse materialize(UUID franchiseId, String chatId) {
        OperationalSession operationalSession = getOrCreateOperationalSession(franchiseId, chatId);
        return toSummary(operationalSession.session(), operationalSession.customerPicture());
    }

    private ConversationPageResponse localConversationPage(
        List<ConversationSession> base,
        String status,
        String channel,
        String responsible,
        int page,
        int pageSize
    ) {
        List<ConversationSession> filtered = filterSessions(base, status, channel, responsible);
        long requestedFromIndex = (long) (page - 1) * pageSize;
        int fromIndex = requestedFromIndex >= filtered.size() ? filtered.size() : (int) requestedFromIndex;
        int toIndex = Math.min(fromIndex + pageSize, filtered.size());
        List<ConversationSummaryResponse> items = filtered.subList(fromIndex, toIndex).stream()
            .map(item -> toSummary(item, null))
            .toList();
        return new ConversationPageResponse(items, page, pageSize, toIndex < filtered.size());
    }

    @Transactional(readOnly = true)
    public ConversationMessagePageResponse listMessages(UUID conversationId, int page, int pageSize) {
        validateMessagePagination(page, pageSize);
        ConversationSession session = requireAccessibleConversation(conversationId);
        if (session.getChatId() != null && !session.getChatId().isBlank()) {
            try {
                List<ConversationMessageResponse> remoteMessages = gptMakerClient.listChatMessages(session.getChatId(), page, pageSize).stream()
                    .map(this::toMessageResponse)
                    .toList();
                if (!remoteMessages.isEmpty()) {
                    return messagePage(session.getChatId(), remoteMessages, page, pageSize);
                }
                logMessagePage(session.getChatId(), page, pageSize, remoteMessages, false);
            } catch (GptMakerIntegrationException ignored) {
                log.warn("GPTMaker messages request failed chatId={} page={} pageSize={} code={}",
                    session.getChatId(), page, pageSize, ignored.getErrorCode());
            }
        }

        if (page == 1 && session.getInteractionId() != null && !session.getInteractionId().isBlank()) {
            try {
                List<ConversationMessageResponse> remoteMessages = gptMakerClient.listInteractionMessages(session.getInteractionId()).stream()
                    .map(this::toMessageResponse)
                    .toList();
                if (!remoteMessages.isEmpty()) {
                    return new ConversationMessagePageResponse(remoteMessages, page, pageSize, false);
                }
            } catch (GptMakerIntegrationException exception) {
                throw new ResponseStatusException(statusFor(exception), exception.getMessage());
            }
        }

        if (page > 1) {
            return new ConversationMessagePageResponse(List.of(), page, pageSize, false);
        }

        List<ConversationMessageResponse> localMessages = new ArrayList<>();
        if (session.getFirstPrompt() != null && !session.getFirstPrompt().isBlank()) {
            localMessages.add(new ConversationMessageResponse(
                session.getId().toString() + "-prompt",
                "USER",
                "TEXT",
                session.getFirstPrompt(),
                displayCustomerName(session),
                null,
                null,
                null,
                null,
                null,
                null,
                session.getCreatedAt().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli(),
                null,
                null
            ));
        }
        if (session.getLastResponse() != null && !session.getLastResponse().isBlank()) {
            localMessages.add(new ConversationMessageResponse(
            session.getId().toString() + "-response",
            session.isHumanTakeoverActive() ? "HUMAN" : "ASSISTANT",
            "TEXT",
            session.getLastResponse(),
            firstNonBlank(session.getResponsibleUserName(), session.getAgentName(), "Atendimento"),
            null,
            null,
            null,
                null,
                null,
                null,
                session.getUpdatedAt().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli(),
                null,
                null
            ));
        }
        return new ConversationMessagePageResponse(localMessages, page, pageSize, false);
    }

    @Transactional(readOnly = true)
    public ConversationMessagePageResponse listRemoteMessages(UUID franchiseId, String chatId, int page, int pageSize) {
        validateMessagePagination(page, pageSize);
        Franchise franchise = resolveConversationFranchise(franchiseId);
        String normalizedChatId = normalizeChatId(chatId);
        requireRemoteChat(franchise, normalizedChatId);

        try {
            List<ConversationMessageResponse> remoteMessages = gptMakerClient.listChatMessages(normalizedChatId, page, pageSize).stream()
                .map(this::toMessageResponse)
                .toList();
            return messagePage(normalizedChatId, remoteMessages, page, pageSize);
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(statusFor(exception), exception.getMessage());
        }
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
            session.setOperationalStatus(response.success() ? "em_atendimento_humano" : session.getOperationalStatus());
            session.setResponsibleUserName(currentUserService.requireCurrentUser().getName());
            session.setSyncStatus("sincronizada");
            session.setLastSyncedAt(LocalDateTime.now());
            conversationSessionRepository.save(session);
            return new StartHumanTakeoverResponse(session.getId(), response.success(), response.success() ? "Atendimento humano iniciado com sucesso." : "Nao foi possivel iniciar o atendimento humano.");
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(statusFor(exception), exception.getMessage());
        }
    }

    @Transactional
    public ConversationActionResponse stopHuman(UUID conversationId) {
        ConversationSession session = requireAccessibleConversation(conversationId);
        if (session.getChatId() == null || session.getChatId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Esta conversa ainda nao possui um chat GPTMaker pronto para encerrar atendimento humano.");
        }

        try {
            var response = gptMakerClient.stopHuman(session.getChatId());
            session.setHumanTakeoverActive(false);
            session.setOperationalStatus(response.success() ? "aguardando_ia" : session.getOperationalStatus());
            session.setLastSyncedAt(LocalDateTime.now());
            conversationSessionRepository.save(session);
            return new ConversationActionResponse(session.getId(), response.success(), session.getOperationalStatus(), response.success() ? "Atendimento devolvido para IA." : "Nao foi possivel devolver o atendimento para IA.", LocalDateTime.now());
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(statusFor(exception), exception.getMessage());
        }
    }

    @Transactional
    public ConversationActionResponse sendManualMessage(UUID conversationId, ConversationManualMessageRequest request) {
        ConversationSession session = requireAccessibleConversation(conversationId);
        if (session.getChatId() == null || session.getChatId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Esta conversa ainda nao possui um chat GPTMaker pronto para envio manual.");
        }
        if (!session.isHumanTakeoverActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Atendimento manual so pode responder conversas assumidas por humano.");
        }

        try {
            var response = gptMakerClient.sendChatMessage(session.getChatId(), request.message(), request.replyMessageId());
            session.setLastResponse(request.message());
            session.setResponsibleUserName(currentUserService.requireCurrentUser().getName());
            session.setLastMessageAt(LocalDateTime.now());
            session.setLastSyncedAt(LocalDateTime.now());
            conversationSessionRepository.save(session);
            return new ConversationActionResponse(session.getId(), response.success(), session.getOperationalStatus(), response.success() ? "Mensagem manual enviada com sucesso." : "Nao foi possivel enviar a mensagem manual.", LocalDateTime.now());
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(statusFor(exception), exception.getMessage());
        }
    }

    @Transactional
    public ConversationActionResponse editMessage(UUID conversationId, String messageId, UpdateChatMessageRequest request) {
        ConversationSession session = requireConversationWithChat(conversationId, "editar mensagem");
        try {
            var response = gptMakerClient.editChatMessage(session.getChatId(), messageId, request == null ? null : request.message());
            session.setLastSyncedAt(LocalDateTime.now());
            conversationSessionRepository.save(session);
            return new ConversationActionResponse(session.getId(), response.success(), session.getOperationalStatus(), response.success() ? "Mensagem editada com sucesso." : "Nao foi possivel editar a mensagem.", LocalDateTime.now());
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(statusFor(exception), exception.getMessage());
        }
    }

    @Transactional
    public ConversationActionResponse deleteMessage(UUID conversationId, String messageId) {
        ConversationSession session = requireConversationWithChat(conversationId, "deletar mensagem");
        try {
            var response = gptMakerClient.deleteChatMessage(session.getChatId(), messageId);
            session.setLastSyncedAt(LocalDateTime.now());
            conversationSessionRepository.save(session);
            return new ConversationActionResponse(session.getId(), response.success(), session.getOperationalStatus(), response.success() ? "Mensagem deletada com sucesso." : "Nao foi possivel deletar a mensagem.", LocalDateTime.now());
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(statusFor(exception), exception.getMessage());
        }
    }

    @Transactional
    public ConversationActionResponse deleteMessages(UUID conversationId) {
        ConversationSession session = requireConversationWithChat(conversationId, "limpar mensagens");
        try {
            var response = gptMakerClient.deleteChatMessages(session.getChatId());
            session.setLastResponse(null);
            session.setLastSyncedAt(LocalDateTime.now());
            conversationSessionRepository.save(session);
            return new ConversationActionResponse(session.getId(), response.success(), session.getOperationalStatus(), response.success() ? "Mensagens removidas com sucesso." : "Nao foi possivel remover as mensagens.", LocalDateTime.now());
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(statusFor(exception), exception.getMessage());
        }
    }

    @Transactional
    public ConversationActionResponse deleteConversation(UUID conversationId) {
        ConversationSession session = requireConversationWithChat(conversationId, "deletar chat");
        try {
            var response = gptMakerClient.deleteChat(session.getChatId());
            UUID id = session.getId();
            String status = session.getOperationalStatus();
            conversationSessionRepository.delete(session);
            return new ConversationActionResponse(id, response.success(), status, response.success() ? "Chat deletado com sucesso." : "Nao foi possivel deletar o chat.", LocalDateTime.now());
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(statusFor(exception), exception.getMessage());
        }
    }

    @Transactional
    public ConversationActionResponse completeConversation(UUID conversationId, ConversationCompleteRequest request) {
        ConversationSession session = requireAccessibleConversation(conversationId);
        if (isClosed(session)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Esta conversa ja foi concluida.");
        }

        boolean wasHumanTakeoverActive = session.isHumanTakeoverActive();
        session.setClosedReason(request.closedReason());
        session.setSaleOutcome(request.outcome());
        session.setSaleSummary(request.saleSummary());
        session.setHumanTakeoverActive(false);
        session.setOperationalStatus("VENDA_CONCLUIDA".equalsIgnoreCase(request.outcome()) ? "venda_concluida" : "concluida");

        if (session.getChatId() != null && !session.getChatId().isBlank() && wasHumanTakeoverActive) {
            try {
                gptMakerClient.stopHuman(session.getChatId());
            } catch (GptMakerIntegrationException ignored) {
            }
        }

        ConversationHandoffEvent event = null;
        if ("VENDA_CONCLUIDA".equalsIgnoreCase(request.outcome())) {
            if (handoffEventRepository.existsByConversationIdAndOutcome(session.getId(), "VENDA_CONCLUIDA")) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Handoff comercial desta conversa ja foi processado.");
            }
            FranchiseSetup setup = franchiseSetupRepository.findByFranchiseId(session.getFranchise().getId())
                .orElse(null);
            var delivery = whatsappHandoffService.sendToFranchise(setup == null ? null : setup.getFranchiseWhatsapp(), request.saleSummary());
            session.setHandoffStatus(delivery.status());
            session.setHandoffSentAt(delivery.sentAt());
            session.setHandoffError(delivery.error());
            event = handoffEventRepository.save(new ConversationHandoffEvent(
                session,
                request.outcome(),
                delivery.status(),
                currentUserService.requireCurrentUser().getName(),
                setup == null ? null : setup.getFranchiseWhatsapp(),
                request.saleSummary(),
                delivery.error(),
                delivery.sentAt()
            ));
        } else {
            session.setHandoffStatus("nao_aplicavel");
        }

        session.setLastSyncedAt(LocalDateTime.now());
        conversationSessionRepository.save(session);
        String message = event == null
            ? "Atendimento concluido."
            : "Venda concluida e handoff comercial processado.";
        return new ConversationActionResponse(session.getId(), true, session.getOperationalStatus(), message, LocalDateTime.now());
    }

    @Transactional(readOnly = true)
    public List<ConversationHandoffEventResponse> listHandoffs(UUID conversationId) {
        ConversationSession session = requireAccessibleConversation(conversationId);
        return handoffEventRepository.findByConversationIdOrderByCreatedAtDesc(session.getId()).stream()
            .map(event -> new ConversationHandoffEventResponse(
                event.getId(),
                event.getOutcome(),
                event.getDeliveryStatus(),
                event.getResponsibleUserName(),
                event.getRecipientPhone(),
                event.getSummary(),
                event.getDeliveryError(),
                event.getSentAt()
            ))
            .toList();
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
            session.setChannelType("WEBCHAT");
            session.setOperationalStatus("aguardando_ia");
            session.setSyncStatus("local");
            session.setLastMessageAt(LocalDateTime.now());
            conversationSessionRepository.save(session);
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

    private Franchise resolveConversationFranchise(UUID franchiseId) {
        User user = currentUserService.requireCurrentUser();
        if (user.getRole() != UserRole.SUPER_ADMIN) {
            return currentUserService.requireFranchise(user);
        }
        if (franchiseId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecione a franquia para acessar esta conversa.");
        }
        return requireFranchise(franchiseId);
    }

    private OperationalSession getOrCreateOperationalSession(UUID franchiseId, String chatId) {
        String normalizedChatId = normalizeChatId(chatId);
        Franchise franchise = resolveConversationFranchise(franchiseId);
        ReentrantLock lock = operationalSessionLocks[lockIndex(franchise.getId(), normalizedChatId)];
        lock.lock();
        boolean releaseAfterTransaction = false;
        try {
            ConversationSession existing = conversationSessionRepository
                .findFirstByFranchiseIdAndChatId(franchise.getId(), normalizedChatId)
                .orElse(null);
            if (existing != null) {
                return new OperationalSession(existing, null);
            }

            if (!liveInboxEnabled() || franchise.getWorkspaceId() == null || franchise.getWorkspaceId().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Esta conversa ainda nao possui uma integracao GPTMaker disponivel.");
            }

            GptMakerChatResponse chat = requireRemoteChat(franchise, normalizedChatId);
            ConversationSession session = updateSessionFromChat(franchise, chat, null);
            ConversationSession saved = conversationSessionRepository.save(session);
            if (TransactionSynchronizationManager.isSynchronizationActive()) {
                TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                    @Override
                    public void afterCompletion(int status) {
                        lock.unlock();
                    }
                });
                releaseAfterTransaction = true;
            }
            return new OperationalSession(saved, safeExternalImageUrl(chat.picture()));
        } finally {
            if (!releaseAfterTransaction) {
                lock.unlock();
            }
        }
    }

    private GptMakerChatResponse requireRemoteChat(Franchise franchise, String chatId) {
        if (chatId == null || chatId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chat GPTMaker nao informado.");
        }
        if (!liveInboxEnabled() || franchise.getWorkspaceId() == null || franchise.getWorkspaceId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Esta conversa ainda nao possui uma integracao GPTMaker disponivel.");
        }
        try {
            GptMakerChatResponse chat = gptMakerClient.findChat(franchise.getWorkspaceId(), chatId);
            if (chat == null || !belongsToFranchiseAgent(franchise, chat)) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversa nao encontrada no workspace GPTMaker informado.");
            }
            return chat;
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(statusFor(exception), exception.getMessage());
        }
    }

    private String normalizeChatId(String chatId) {
        if (chatId == null || chatId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chat GPTMaker nao informado.");
        }
        return chatId.trim();
    }

    private int lockIndex(UUID franchiseId, String chatId) {
        return (Objects.hash(franchiseId, chatId) & Integer.MAX_VALUE) % operationalSessionLocks.length;
    }

    private boolean belongsToFranchiseAgent(Franchise franchise, GptMakerChatResponse chat) {
        String allowedAgentId = franchise.getAgentId();
        if (allowedAgentId == null || allowedAgentId.isBlank()) {
            return true;
        }
        return chat.agentId() != null && allowedAgentId.equals(chat.agentId());
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

    private ConversationSession requireConversationWithChat(UUID conversationId, String action) {
        ConversationSession session = requireAccessibleConversation(conversationId);
        if (session.getChatId() == null || session.getChatId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Esta conversa ainda nao possui um chat GPTMaker pronto para " + action + ".");
        }
        return session;
    }

    private ConversationSummaryResponse toSummary(ConversationSession session, String customerPicture) {
        return new ConversationSummaryResponse(
            session.getId(),
            session.getChatId(),
            session.getFranchise().getId(),
            session.getFranchise().getName(),
            session.getAgentName(),
            displayCustomerName(session),
            session.getCustomerPhone(),
            customerPicture,
            session.getFirstPrompt(),
            session.getLastResponse(),
            session.getChannelType(),
            session.getOperationalStatus(),
            session.getResponsibleUserName(),
            session.getSyncStatus(),
            session.getClosedReason(),
            session.getSaleOutcome(),
            session.getHandoffStatus(),
            session.isHumanTakeoverActive(),
            session.getLastMessageAt(),
            session.getLastSyncedAt(),
            session.getCreatedAt(),
            session.getUpdatedAt()
        );
    }

    private ConversationSyncPage syncFranchisePage(Franchise franchise, int page, int pageSize) {
        if (!liveInboxEnabled()) {
            return new ConversationSyncPage(List.of(), false);
        }
        if (franchise.getWorkspaceId() == null || franchise.getWorkspaceId().isBlank()) {
            return new ConversationSyncPage(List.of(), false);
        }
        try {
            List<GptMakerChatResponse> chats = gptMakerClient.listChats(franchise.getWorkspaceId(), page, pageSize);
            List<String> chatIds = chats.stream()
                .map(GptMakerChatResponse::id)
                .filter(id -> id != null && !id.isBlank())
                .toList();
            Map<String, ConversationSession> sessionsByChatId = new LinkedHashMap<>();
            if (!chatIds.isEmpty()) {
                conversationSessionRepository.findByFranchiseIdAndChatIdIn(franchise.getId(), chatIds).stream()
                    .sorted(Comparator.comparing(ConversationService::sessionSortTimestamp, Comparator.nullsLast(Comparator.reverseOrder())))
                    .forEach(session -> sessionsByChatId.putIfAbsent(session.getChatId(), session));
            }
            List<ConversationSummaryResponse> summaries = new ArrayList<>();
            for (var chat : chats) {
                summaries.add(toRemoteSummary(franchise, chat, sessionsByChatId.get(chat.id())));
            }
            boolean hasMore = !chats.isEmpty();
            log.debug("GPTMaker chat list page={} pageSize={} count={} hasMore={} franchiseId={}",
                page, pageSize, chats.size(), hasMore, franchise.getId());
            return new ConversationSyncPage(
                List.copyOf(summaries),
                hasMore
            );
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, exception.getMessage());
        }
    }

    private ConversationSession updateSessionFromChat(
        Franchise franchise,
        GptMakerChatResponse chat,
        ConversationSession existing
    ) {
        ConversationSession session = existing;
        if (session == null) {
            session = new ConversationSession(
                franchise,
                chat.agentId() != null ? chat.agentId() : franchise.getAgentId(),
                chat.agentName() != null ? chat.agentName() : franchise.getAgentName(),
                "chat-" + chat.id(),
                "desconhecido",
                chat.whatsappPhone(),
                chat.conversation(),
                chat.conversation(),
                chat.id(),
                null
            );
        }
        session.setAgentName(firstNonBlank(chat.agentName(), franchise.getAgentName()));
        boolean hasHumanOperator = chat.humanTalk()
            || (chat.userId() != null && !chat.userId().isBlank());
        session.setResponsibleUserName(firstNonBlank(
            chat.messageUserName(),
            hasHumanOperator ? chat.userName() : null,
            session.getResponsibleUserName()
        ));
        session.setCustomerName(resolveCustomerName(chat, session, franchise, hasHumanOperator));
        session.setCustomerPhone(firstNonBlank(chat.whatsappPhone(), session.getCustomerPhone()));
        session.setLastResponse(firstNonBlank(chat.conversation(), session.getLastResponse()));
        session.setChannelType(normalizeChannel(chat.type(), chat.conversationType()));
        session.setHumanTakeoverActive(chat.humanTalk());
        session.setOperationalStatus(mapOperationalStatus(chat.humanTalk(), chat.finished()));
        session.setSyncStatus("sincronizada");
        session.setLastMessageAt(toLocalDateTime(chat.time()));
        session.setLastSyncedAt(LocalDateTime.now());
        return session;
    }

    private ConversationSummaryResponse toRemoteSummary(
        Franchise franchise,
        GptMakerChatResponse chat,
        ConversationSession existing
    ) {
        boolean hasHumanOperator = chat.humanTalk()
            || (chat.userId() != null && !chat.userId().isBlank());
        String agentName = firstNonBlank(chat.agentName(), franchise.getAgentName());
        String responsibleUserName = firstNonBlank(
            chat.messageUserName(),
            hasHumanOperator ? chat.userName() : null,
            existing == null ? null : existing.getResponsibleUserName()
        );
        String customerName = resolveCustomerName(chat, existing, franchise, hasHumanOperator);
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime remoteTime = firstNonNull(toLocalDateTime(chat.time()), toLocalDateTime(chat.createdAt()));
        LocalDateTime createdAt = existing == null
            ? firstNonNull(firstNonNull(toLocalDateTime(chat.createdAt()), remoteTime), now)
            : existing.getCreatedAt();
        LocalDateTime updatedAt = existing == null
            ? firstNonNull(remoteTime, firstNonNull(createdAt, now))
            : existing.getUpdatedAt();

        return new ConversationSummaryResponse(
            existing == null ? null : existing.getId(),
            chat.id(),
            franchise.getId(),
            franchise.getName(),
            agentName,
            customerName,
            firstNonBlank(chat.whatsappPhone(), existing == null ? null : existing.getCustomerPhone()),
            safeExternalImageUrl(chat.picture()),
            existing == null ? chat.conversation() : existing.getFirstPrompt(),
            firstNonBlank(chat.conversation(), existing == null ? null : existing.getLastResponse()),
            normalizeChannel(chat.type(), chat.conversationType()),
            mapOperationalStatus(chat.humanTalk(), chat.finished()),
            responsibleUserName,
            "sincronizada",
            existing == null ? null : existing.getClosedReason(),
            existing == null ? null : existing.getSaleOutcome(),
            existing == null ? null : existing.getHandoffStatus(),
            chat.humanTalk(),
            remoteTime,
            now,
            createdAt,
            updatedAt
        );
    }

    private LocalDateTime firstNonNull(LocalDateTime first, LocalDateTime second) {
        return first != null ? first : second;
    }

    private List<ConversationSummaryResponse> filterSummaries(
        List<ConversationSummaryResponse> summaries,
        String status,
        String channel,
        String responsible
    ) {
        return summaries.stream()
            .filter(item -> status == null || status.isBlank() || status.equalsIgnoreCase(item.operationalStatus()))
            .filter(item -> channel == null || channel.isBlank() || channel.equalsIgnoreCase(item.channelType()))
            .filter(item -> responsible == null || responsible.isBlank() || responsible.equalsIgnoreCase(item.responsibleUserName()))
            .sorted(Comparator.comparing(this::summarySortTimestamp, Comparator.nullsLast(Comparator.reverseOrder())))
            .toList();
    }

    private List<ConversationSummaryResponse> mergeSummaries(
        List<ConversationSummaryResponse> localItems,
        List<ConversationSummaryResponse> remoteItems
    ) {
        Map<String, ConversationSummaryResponse> merged = new LinkedHashMap<>();
        localItems.forEach(item -> merged.put(summaryIdentity(item), item));
        remoteItems.forEach(item -> merged.put(summaryIdentity(item), item));
        return List.copyOf(merged.values());
    }

    private String summaryIdentity(ConversationSummaryResponse summary) {
        if (summary.chatId() != null && !summary.chatId().isBlank()) {
            return "chat:" + summary.franchiseId() + ":" + summary.chatId();
        }
        return "session:" + summary.id();
    }

    private LocalDateTime summarySortTimestamp(ConversationSummaryResponse summary) {
        return firstNonNull(summary.lastMessageAt(), firstNonNull(summary.updatedAt(), summary.createdAt()));
    }

    private List<ConversationSession> filterSessions(
        List<ConversationSession> sessions,
        String status,
        String channel,
        String responsible
    ) {
        return deduplicateSessions(sessions).stream()
            .filter(item -> status == null || status.isBlank() || status.equalsIgnoreCase(item.getOperationalStatus()))
            .filter(item -> channel == null || channel.isBlank() || channel.equalsIgnoreCase(item.getChannelType()))
            .filter(item -> responsible == null || responsible.isBlank() || responsible.equalsIgnoreCase(item.getResponsibleUserName()))
            .sorted(Comparator.comparing(ConversationService::sessionSortTimestamp, Comparator.nullsLast(Comparator.reverseOrder())))
            .toList();
    }

    private List<ConversationSession> deduplicateSessions(List<ConversationSession> sessions) {
        Map<String, ConversationSession> uniqueSessions = new LinkedHashMap<>();
        sessions.stream()
            .sorted(Comparator.comparing(ConversationService::sessionSortTimestamp).reversed())
            .forEach(session -> uniqueSessions.putIfAbsent(conversationIdentity(session), session));
        return List.copyOf(uniqueSessions.values());
    }

    private void validateMessagePagination(int page, int pageSize) {
        if (page < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A pagina deve ser maior ou igual a 1.");
        }
        if (pageSize < 1 || pageSize > MAX_MESSAGE_PAGE_SIZE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O tamanho da pagina deve estar entre 1 e " + MAX_MESSAGE_PAGE_SIZE + ".");
        }
    }

    private void validateConversationPagination(int page, int pageSize) {
        if (page < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A pagina deve ser maior ou igual a 1.");
        }
        if (pageSize < 1 || pageSize > MAX_CHAT_PAGE_SIZE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O tamanho da pagina deve estar entre 1 e " + MAX_CHAT_PAGE_SIZE + ".");
        }
    }

    private record ConversationSyncPage(
        List<ConversationSummaryResponse> items,
        boolean hasMore
    ) {
    }

    private record OperationalSession(
        ConversationSession session,
        String customerPicture
    ) {
    }

    private ConversationMessagePageResponse messagePage(
        String chatId,
        List<ConversationMessageResponse> items,
        int page,
        int pageSize
    ) {
        // GPTMaker may return a short non-terminal page (for example 28 items for
        // pageSize=30 while page 2 still contains older messages). The first empty
        // page is the only safe terminal signal available because the API exposes
        // neither totalPages nor totalElements.
        boolean hasMore = !items.isEmpty();
        logMessagePage(chatId, page, pageSize, items, hasMore);
        return new ConversationMessagePageResponse(items, page, pageSize, hasMore);
    }

    private void logMessagePage(
        String chatId,
        int page,
        int pageSize,
        List<ConversationMessageResponse> items,
        boolean hasMore
    ) {
        if (!log.isDebugEnabled()) {
            return;
        }
        Long oldest = items.stream()
            .map(ConversationMessageResponse::time)
            .filter(java.util.Objects::nonNull)
            .min(Long::compareTo)
            .orElse(null);
        Long newest = items.stream()
            .map(ConversationMessageResponse::time)
            .filter(java.util.Objects::nonNull)
            .max(Long::compareTo)
            .orElse(null);
        log.debug("GPTMaker chat messages chatId={} page={} pageSize={} count={} oldest={} newest={} hasMore={}",
            chatId, page, pageSize, items.size(), oldest, newest, hasMore);
    }

    private ConversationMessageResponse toMessageResponse(
        br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerConversationMessageResponse item
    ) {
        return new ConversationMessageResponse(
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
        );
    }

    private String conversationIdentity(ConversationSession session) {
        String identity = remoteConversationIdentity(session.getChatId(), session.getInteractionId(), session.getContextId());
        return identity != null ? identity : "session:" + session.getId();
    }

    private String remoteConversationIdentity(String chatId, String interactionId, String contextId) {
        String identity = firstNonBlank(chatId, interactionId, contextId);
        return identity == null ? null : identity.trim();
    }

    private static LocalDateTime sessionSortTimestamp(ConversationSession session) {
        if (session.getLastMessageAt() != null) {
            return session.getLastMessageAt();
        }
        if (session.getUpdatedAt() != null) {
            return session.getUpdatedAt();
        }
        return session.getCreatedAt();
    }

    private String normalizeChannel(String type, String conversationType) {
        String source = firstNonBlank(type, conversationType);
        if (source == null) {
            return "WEBCHAT";
        }
        return source.toUpperCase();
    }

    private String mapOperationalStatus(boolean humanTalk, boolean finished) {
        if (finished) {
            return "concluida";
        }
        if (humanTalk) {
            return "em_atendimento_humano";
        }
        return "aguardando_ia";
    }

    private LocalDateTime toLocalDateTime(Long time) {
        if (time == null) {
            return null;
        }
        return LocalDateTime.ofInstant(Instant.ofEpochMilli(time), ZoneId.systemDefault());
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private String displayCustomerName(ConversationSession session) {
        String customerName = session.getCustomerName();
        if (customerName == null || customerName.isBlank()) {
            return "desconhecido";
        }
        if (matchesAnyName(customerName.trim(), session.getAgentName(), session.getResponsibleUserName())) {
            return "desconhecido";
        }
        return customerName;
    }

    private String resolveCustomerName(
        GptMakerChatResponse chat,
        ConversationSession session,
        Franchise franchise,
        boolean hasHumanOperator
    ) {
        String resolved = firstUsableCustomerName(
            session == null ? null : session.getCustomerName(),
            chat.title(),
            chat.name(),
            hasHumanOperator ? null : chat.userName(),
            chat.agentName(),
            franchise.getAgentName(),
            chat.messageUserName(),
            firstNonBlank(chat.userName(), session == null ? null : session.getResponsibleUserName())
        );
        return resolved != null ? resolved : "desconhecido";
    }

    private String firstUsableCustomerName(
        String existingName,
        String title,
        String name,
        String userName,
        String agentName,
        String franchiseAgentName,
        String messageUserName,
        String responsibleUserName
    ) {
        for (String candidate : new String[] { existingName, title, name, userName }) {
            if (isUsableCustomerName(candidate, agentName, franchiseAgentName, messageUserName, responsibleUserName)) {
                return candidate.trim();
            }
        }
        return null;
    }

    private boolean isUsableCustomerName(
        String candidate,
        String agentName,
        String franchiseAgentName,
        String messageUserName,
        String responsibleUserName
    ) {
        if (candidate == null || candidate.isBlank()) {
            return false;
        }
        String normalizedCandidate = candidate.trim();
        if (normalizedCandidate.equalsIgnoreCase("desconhecido")) {
            return false;
        }
        return !matchesAnyName(normalizedCandidate, agentName, franchiseAgentName, messageUserName, responsibleUserName);
    }

    private boolean matchesAnyName(String value, String... references) {
        for (String reference : references) {
            if (reference != null && !reference.isBlank() && value.equalsIgnoreCase(reference.trim())) {
                return true;
            }
        }
        return false;
    }

    private String safeExternalImageUrl(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.startsWith("https://") || trimmed.startsWith("http://") ? trimmed : null;
    }

    private boolean isClosed(ConversationSession session) {
        return "concluida".equalsIgnoreCase(session.getOperationalStatus())
            || "venda_concluida".equalsIgnoreCase(session.getOperationalStatus());
    }

    private HttpStatus statusFor(GptMakerIntegrationException exception) {
        if ("INVALID_AGENT".equals(exception.getErrorCode())
            || "INVALID_CONVERSATION".equals(exception.getErrorCode())
            || "INVALID_CHAT".equals(exception.getErrorCode())
            || "INVALID_INTERACTION".equals(exception.getErrorCode())
            || "INVALID_MESSAGE".equals(exception.getErrorCode())
            || "MOCK_DISABLED_FOR_CONVERSATIONS".equals(exception.getErrorCode())
            || "MISSING_TOKEN".equals(exception.getErrorCode())) {
            return HttpStatus.BAD_REQUEST;
        }
        return HttpStatus.BAD_GATEWAY;
    }

    private boolean liveInboxEnabled() {
        return runtimeProperties.features() == null || runtimeProperties.features().liveInboxEnabled();
    }
}
