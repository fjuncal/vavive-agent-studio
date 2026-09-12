package br.com.vavive.gptmaker.service;

import br.com.vavive.gptmaker.config.AppRuntimeProperties;
import br.com.vavive.gptmaker.domain.entity.ConversationSession;
import br.com.vavive.gptmaker.domain.entity.Franchise;
import br.com.vavive.gptmaker.domain.entity.User;
import br.com.vavive.gptmaker.domain.enums.UserRole;
import br.com.vavive.gptmaker.integration.gptmaker.GptMakerClient;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerChatResponse;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerConversationMessageResponse;
import br.com.vavive.gptmaker.repository.ConversationHandoffEventRepository;
import br.com.vavive.gptmaker.repository.ConversationSessionRepository;
import br.com.vavive.gptmaker.repository.FranchiseRepository;
import br.com.vavive.gptmaker.repository.FranchiseSetupRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ConversationServiceTest {

    @Test
    void syncKeepsCustomerSeparateFromHumanOperatorAndExposesChatPicture() {
        Franchise franchise = mock(Franchise.class);
        when(franchise.getId()).thenReturn(java.util.UUID.randomUUID());
        when(franchise.getName()).thenReturn("Vavive Centro");
        when(franchise.getWorkspaceId()).thenReturn("workspace-1");
        when(franchise.getAgentName()).thenReturn("Assistente Vavive");

        ConversationSession session = new ConversationSession(
            franchise,
            "agent-1",
            "Assistente Vavive",
            "chat-chat-1",
            "Frederico",
            "5521999999999",
            "Ola",
            "Ola",
            "chat-1",
            null
        );
        ReflectionTestUtils.setField(session, "updatedAt", LocalDateTime.now());
        ReflectionTestUtils.setField(session, "createdAt", LocalDateTime.now());

        ConversationSessionRepository sessionRepository = mock(ConversationSessionRepository.class);
        when(sessionRepository.findByFranchiseId(franchise.getId())).thenReturn(List.of(session));
        when(sessionRepository.findByFranchiseIdOrderByUpdatedAtDesc(franchise.getId())).thenReturn(List.of(session));
        when(sessionRepository.save(any(ConversationSession.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CurrentUserService currentUserService = mock(CurrentUserService.class);
        User user = new User("Frederico", "frederico@vavive.com", "hash", UserRole.ADMIN_FRANQUIA, franchise);
        when(currentUserService.requireCurrentUser()).thenReturn(user);
        when(currentUserService.requireFranchise(user)).thenReturn(franchise);

        GptMakerClient gptMakerClient = mock(GptMakerClient.class);
        when(gptMakerClient.listChats("workspace-1", 1, 50)).thenReturn(List.of(new GptMakerChatResponse(
            "chat-1",
            true,
            true,
            false,
            "HUMAN",
            "Assistente Vavive",
            "agent-1",
            "5521999999999",
            "Frederico",
            "WHATSAPP",
            "Frederico",
            "operator-1",
            "WHATSAPP",
            "Mensagem do atendimento",
            null,
            "https://cdn.gptmaker.ai/contacts/joao.jpg",
            "https://cdn.gptmaker.ai/users/frederico.jpg",
            "https://cdn.gptmaker.ai/agents/vavive.jpg",
            "5521999999999",
            "Joao da Silva",
            1_700_000_000_000L,
            1_700_000_001_000L,
            0
        )));

        ConversationService service = new ConversationService(
            sessionRepository,
            mock(ConversationHandoffEventRepository.class),
            mock(FranchiseRepository.class),
            mock(FranchiseSetupRepository.class),
            currentUserService,
            gptMakerClient,
            mock(WhatsappHandoffService.class),
            new AppRuntimeProperties(null, new AppRuntimeProperties.Features(false, true, false))
        );

        var result = service.list(null, null, null, null);

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().customerName()).isEqualTo("Joao da Silva");
        assertThat(result.getFirst().responsibleUserName()).isEqualTo("Frederico");
        assertThat(result.getFirst().customerPicture()).isEqualTo("https://cdn.gptmaker.ai/contacts/joao.jpg");
        assertThat(session.getCustomerName()).isEqualTo("Joao da Silva");
    }

    @Test
    void keepsPagingWhenGptMakerReturnsShortNonEmptyPage() {
        Franchise franchise = mock(Franchise.class);
        ConversationSession session = new ConversationSession(
            franchise,
            "agent-1",
            "Assistente Vavive",
            "chat-chat-1",
            "Joao da Silva",
            "5521999999999",
            null,
            null,
            "chat-1",
            null
        );
        UUID conversationId = UUID.randomUUID();
        ReflectionTestUtils.setField(session, "id", conversationId);

        ConversationSessionRepository sessionRepository = mock(ConversationSessionRepository.class);
        when(sessionRepository.findById(conversationId)).thenReturn(Optional.of(session));

        User admin = new User("Admin", "admin@vavive.com", "hash", UserRole.SUPER_ADMIN, null);
        CurrentUserService currentUserService = mock(CurrentUserService.class);
        when(currentUserService.requireCurrentUser()).thenReturn(admin);

        GptMakerClient gptMakerClient = mock(GptMakerClient.class);
        when(gptMakerClient.listChatMessages("chat-1", 1, 30)).thenReturn(List.of(message("message-1", 1_700_000_000_000L)));
        when(gptMakerClient.listChatMessages("chat-1", 2, 30)).thenReturn(List.of(message("message-2", 1_600_000_000_000L)));
        when(gptMakerClient.listChatMessages("chat-1", 3, 30)).thenReturn(List.of());

        ConversationService service = new ConversationService(
            sessionRepository,
            mock(ConversationHandoffEventRepository.class),
            mock(FranchiseRepository.class),
            mock(FranchiseSetupRepository.class),
            currentUserService,
            gptMakerClient,
            mock(WhatsappHandoffService.class),
            new AppRuntimeProperties(null, new AppRuntimeProperties.Features(false, true, false))
        );

        assertThat(service.listMessages(conversationId, 1, 30).hasMore()).isTrue();
        assertThat(service.listMessages(conversationId, 2, 30).hasMore()).isTrue();
        assertThat(service.listMessages(conversationId, 3, 30).hasMore()).isFalse();
    }

    private GptMakerConversationMessageResponse message(String id, long time) {
        return new GptMakerConversationMessageResponse(
            id,
            "USER",
            "TEXT",
            "Mensagem",
            "Joao da Silva",
            null,
            null,
            null,
            null,
            null,
            null,
            time,
            null,
            null
        );
    }
}
