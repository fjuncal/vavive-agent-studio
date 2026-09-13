package br.com.vavive.gptmaker.service;

import br.com.vavive.gptmaker.config.AppRuntimeProperties;
import br.com.vavive.gptmaker.domain.entity.ConversationSession;
import br.com.vavive.gptmaker.domain.entity.Franchise;
import br.com.vavive.gptmaker.domain.entity.User;
import br.com.vavive.gptmaker.domain.enums.UserRole;
import br.com.vavive.gptmaker.dto.ConversationManualMessageRequest;
import br.com.vavive.gptmaker.integration.gptmaker.GptMakerClient;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerChatResponse;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerConversationMessageResponse;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerSimpleSuccessResponse;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerStartHumanResponse;
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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
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
        when(sessionRepository.findByFranchiseIdAndChatIdIn(franchise.getId(), List.of("chat-1"))).thenReturn(List.of(session));
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
        assertThat(result.getFirst().chatId()).isEqualTo("chat-1");
        assertThat(result.getFirst().read()).isTrue();
        assertThat(result.getFirst().unReadCount()).isZero();
        assertThat(session.getCustomerName()).isEqualTo("Frederico");
        verify(sessionRepository, never()).save(any(ConversationSession.class));
    }

    @Test
    void listPageRequestsRequestedGptMakerChatPage() {
        Franchise franchise = mock(Franchise.class);
        UUID franchiseId = UUID.randomUUID();
        when(franchise.getId()).thenReturn(franchiseId);
        when(franchise.getName()).thenReturn("Vavive Centro");
        when(franchise.getWorkspaceId()).thenReturn("workspace-1");
        when(franchise.getAgentName()).thenReturn("Assistente Vavive");

        ConversationSession session = new ConversationSession(
            franchise,
            "agent-1",
            "Assistente Vavive",
            "chat-chat-2",
            "Joao da Silva",
            "5521999999999",
            "Ola",
            "Tudo bem",
            "chat-2",
            null
        );
        ReflectionTestUtils.setField(session, "updatedAt", LocalDateTime.now());
        ReflectionTestUtils.setField(session, "createdAt", LocalDateTime.now());

        ConversationSessionRepository sessionRepository = mock(ConversationSessionRepository.class);
        when(sessionRepository.findByFranchiseIdAndChatIdIn(franchiseId, List.of("chat-2"))).thenReturn(List.of(session));
        when(sessionRepository.save(any(ConversationSession.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User admin = new User("Admin", "admin@vavive.com", "hash", UserRole.ADMIN_FRANQUIA, franchise);
        CurrentUserService currentUserService = mock(CurrentUserService.class);
        when(currentUserService.requireCurrentUser()).thenReturn(admin);
        when(currentUserService.requireFranchise(admin)).thenReturn(franchise);

        GptMakerClient gptMakerClient = mock(GptMakerClient.class);
        when(gptMakerClient.listChats("workspace-1", 2, 50)).thenReturn(List.of(new GptMakerChatResponse(
            "chat-2",
            false,
            true,
            false,
            "ASSISTANT",
            "Assistente Vavive",
            "agent-1",
            "5521999999999",
            "Joao da Silva",
            "WHATSAPP",
            null,
            null,
            "WHATSAPP",
            "Tudo bem",
            null,
            "https://cdn.gptmaker.ai/contacts/joao.jpg",
            null,
            null,
            "5521999999999",
            "Joao da Silva",
            1_700_000_000_000L,
            1_700_000_001_000L,
            50
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

        var result = service.listPage(franchiseId, null, null, null, 2, 50);

        assertThat(result.page()).isEqualTo(2);
        assertThat(result.pageSize()).isEqualTo(50);
        assertThat(result.items()).hasSize(1);
        assertThat(result.hasMore()).isTrue();
        verify(gptMakerClient).listChats("workspace-1", 2, 50);
    }

    @Test
    void listPageForwardsQueryToGptMakerAndMatchesPhoneLocally() {
        Franchise franchise = mock(Franchise.class);
        UUID franchiseId = UUID.randomUUID();
        when(franchise.getId()).thenReturn(franchiseId);
        when(franchise.getName()).thenReturn("Vavive Centro");
        when(franchise.getWorkspaceId()).thenReturn("workspace-1");
        when(franchise.getAgentName()).thenReturn("Assistente Vavive");

        ConversationSessionRepository sessionRepository = mock(ConversationSessionRepository.class);
        when(sessionRepository.findByFranchiseIdAndChatIdIn(franchiseId, List.of("chat-search"))).thenReturn(List.of());

        User admin = new User("Admin", "admin@vavive.com", "hash", UserRole.ADMIN_FRANQUIA, franchise);
        CurrentUserService currentUserService = mock(CurrentUserService.class);
        when(currentUserService.requireCurrentUser()).thenReturn(admin);
        when(currentUserService.requireFranchise(admin)).thenReturn(franchise);

        GptMakerClient gptMakerClient = mock(GptMakerClient.class);
        when(gptMakerClient.listChats("workspace-1", 1, 50, "21999999999")).thenReturn(List.of(chat("chat-search")));
        when(gptMakerClient.listChats("workspace-1", 2, 50, "21999999999")).thenReturn(List.of(chat("chat-search-page-2")));

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

        var result = service.listPage(franchiseId, null, null, null, "(21) 99999-9999", 1, 50);

        assertThat(result.items()).hasSize(1);
        assertThat(result.items().getFirst().customerPhone()).isEqualTo("5521999999999");
        verify(gptMakerClient).listChats("workspace-1", 1, 50, "21999999999");
        assertThat(service.listPage(franchiseId, null, null, null, "21999999999", 2, 50).items()).hasSize(1);
        verify(gptMakerClient).listChats("workspace-1", 2, 50, "21999999999");
        verify(sessionRepository, never()).save(any(ConversationSession.class));
    }

    @Test
    void listingRemotePagesNeverCreatesConversationSessions() {
        Franchise franchise = mock(Franchise.class);
        UUID franchiseId = UUID.randomUUID();
        when(franchise.getId()).thenReturn(franchiseId);
        when(franchise.getName()).thenReturn("Vavive Centro");
        when(franchise.getWorkspaceId()).thenReturn("workspace-1");
        when(franchise.getAgentName()).thenReturn("Assistente Vavive");

        ConversationSessionRepository sessionRepository = mock(ConversationSessionRepository.class);
        when(sessionRepository.findByFranchiseIdAndChatIdIn(franchiseId, List.of("chat-1")))
            .thenReturn(List.of());

        User admin = new User("Admin", "admin@vavive.com", "hash", UserRole.ADMIN_FRANQUIA, franchise);
        CurrentUserService currentUserService = mock(CurrentUserService.class);
        when(currentUserService.requireCurrentUser()).thenReturn(admin);
        when(currentUserService.requireFranchise(admin)).thenReturn(franchise);

        GptMakerClient gptMakerClient = mock(GptMakerClient.class);
        when(gptMakerClient.listChats("workspace-1", 1, 50)).thenReturn(List.of(chat("chat-1")));
        when(gptMakerClient.listChats("workspace-1", 2, 50)).thenReturn(List.of(chat("chat-1")));
        when(gptMakerClient.listChats("workspace-1", 3, 50)).thenReturn(List.of(chat("chat-1")));

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

        assertThat(service.listPage(franchiseId, null, null, null, 1, 50).items()).hasSize(1);
        assertThat(service.listPage(franchiseId, null, null, null, 2, 50).items()).hasSize(1);
        assertThat(service.listPage(franchiseId, null, null, null, 3, 50).items()).hasSize(1);

        verify(sessionRepository, never()).save(any(ConversationSession.class));
        verify(sessionRepository, times(3)).findByFranchiseIdAndChatIdIn(franchiseId, List.of("chat-1"));
    }

    @Test
    void remoteMessagePagesDoNotCreateSessionAndKeepShortPageHasMore() {
        Franchise franchise = mock(Franchise.class);
        UUID franchiseId = UUID.randomUUID();
        when(franchise.getId()).thenReturn(franchiseId);
        when(franchise.getName()).thenReturn("Vavive Centro");
        when(franchise.getWorkspaceId()).thenReturn("workspace-1");

        ConversationSessionRepository sessionRepository = mock(ConversationSessionRepository.class);
        User admin = new User("Admin", "admin@vavive.com", "hash", UserRole.ADMIN_FRANQUIA, franchise);
        CurrentUserService currentUserService = mock(CurrentUserService.class);
        when(currentUserService.requireCurrentUser()).thenReturn(admin);
        when(currentUserService.requireFranchise(admin)).thenReturn(franchise);

        GptMakerClient gptMakerClient = mock(GptMakerClient.class);
        when(gptMakerClient.findChat("workspace-1", "remote-chat")).thenReturn(chat("remote-chat"));
        when(gptMakerClient.listChatMessages("remote-chat", 1, 30)).thenReturn(List.of(message("message-1", 1_700_000_000_000L)));
        when(gptMakerClient.listChatMessages("remote-chat", 2, 30)).thenReturn(List.of(message("message-2", 1_600_000_000_000L)));
        when(gptMakerClient.listChatMessages("remote-chat", 3, 30)).thenReturn(List.of());

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

        var firstPage = service.listRemoteMessages(UUID.randomUUID(), "remote-chat", 1, 30);
        var secondPage = service.listRemoteMessages(UUID.randomUUID(), "remote-chat", 2, 30);
        var thirdPage = service.listRemoteMessages(UUID.randomUUID(), "remote-chat", 3, 30);

        assertThat(firstPage.items()).hasSize(1);
        assertThat(firstPage.hasMore()).isTrue();
        assertThat(secondPage.items()).hasSize(1);
        assertThat(secondPage.hasMore()).isTrue();
        assertThat(thirdPage.items()).isEmpty();
        assertThat(thirdPage.hasMore()).isFalse();
        verify(sessionRepository, never()).save(any(ConversationSession.class));
        verify(sessionRepository, never()).findFirstByFranchiseIdAndChatId(any(), any());
    }

    @Test
    void materializePersistsOnlyWhenConversationIsOpened() {
        Franchise franchise = mock(Franchise.class);
        UUID franchiseId = UUID.randomUUID();
        when(franchise.getId()).thenReturn(franchiseId);
        when(franchise.getName()).thenReturn("Vavive Centro");
        when(franchise.getWorkspaceId()).thenReturn("workspace-1");
        when(franchise.getAgentId()).thenReturn("agent-1");
        when(franchise.getAgentName()).thenReturn("Assistente Vavive");

        ConversationSessionRepository sessionRepository = mock(ConversationSessionRepository.class);
        when(sessionRepository.findFirstByFranchiseIdAndChatId(franchiseId, "chat-3")).thenReturn(Optional.empty());
        when(sessionRepository.save(any(ConversationSession.class))).thenAnswer(invocation -> {
            ConversationSession saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", UUID.randomUUID());
            ReflectionTestUtils.setField(saved, "createdAt", LocalDateTime.now());
            ReflectionTestUtils.setField(saved, "updatedAt", LocalDateTime.now());
            return saved;
        });

        User admin = new User("Admin", "admin@vavive.com", "hash", UserRole.ADMIN_FRANQUIA, franchise);
        CurrentUserService currentUserService = mock(CurrentUserService.class);
        when(currentUserService.requireCurrentUser()).thenReturn(admin);
        when(currentUserService.requireFranchise(admin)).thenReturn(franchise);

        GptMakerClient gptMakerClient = mock(GptMakerClient.class);
        when(gptMakerClient.findChat("workspace-1", "chat-3")).thenReturn(new GptMakerChatResponse(
            "chat-3",
            false,
            true,
            false,
            "USER",
            "Assistente Vavive",
            "agent-1",
            "5521999999999",
            "Joao da Silva",
            "WHATSAPP",
            null,
            null,
            "WHATSAPP",
            "Ola",
            null,
            "https://cdn.gptmaker.ai/contacts/joao.jpg",
            null,
            null,
            "5521999999999",
            "Joao da Silva",
            1_700_000_000_000L,
            1_700_000_001_000L,
            0
        ));

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

        var result = service.materialize(null, "chat-3");

        assertThat(result.id()).isNotNull();
        assertThat(result.chatId()).isEqualTo("chat-3");
        assertThat(result.customerName()).isEqualTo("Joao da Silva");
        verify(sessionRepository).save(any(ConversationSession.class));
    }

    @Test
    void materializationIsIdempotentForSameFranchiseAndChat() {
        Franchise franchise = mock(Franchise.class);
        UUID franchiseId = UUID.randomUUID();
        when(franchise.getId()).thenReturn(franchiseId);
        when(franchise.getName()).thenReturn("Vavive Centro");
        when(franchise.getWorkspaceId()).thenReturn("workspace-1");
        when(franchise.getAgentId()).thenReturn("agent-1");
        when(franchise.getAgentName()).thenReturn("Assistente Vavive");

        ConversationSessionRepository sessionRepository = mock(ConversationSessionRepository.class);
        ConversationSession savedSession = new ConversationSession(
            franchise,
            "agent-1",
            "Assistente Vavive",
            "chat-chat-idempotent",
            "Joao da Silva",
            "5521999999999",
            "Ola",
            "Ola",
            "chat-idempotent",
            null
        );
        ReflectionTestUtils.setField(savedSession, "id", UUID.randomUUID());
        ReflectionTestUtils.setField(savedSession, "createdAt", LocalDateTime.now());
        ReflectionTestUtils.setField(savedSession, "updatedAt", LocalDateTime.now());
        when(sessionRepository.findFirstByFranchiseIdAndChatId(franchiseId, "chat-idempotent"))
            .thenReturn(Optional.empty(), Optional.of(savedSession));
        when(sessionRepository.save(any(ConversationSession.class))).thenReturn(savedSession);

        User admin = new User("Admin", "admin@vavive.com", "hash", UserRole.ADMIN_FRANQUIA, franchise);
        CurrentUserService currentUserService = mock(CurrentUserService.class);
        when(currentUserService.requireCurrentUser()).thenReturn(admin);
        when(currentUserService.requireFranchise(admin)).thenReturn(franchise);

        GptMakerClient gptMakerClient = mock(GptMakerClient.class);
        when(gptMakerClient.findChat("workspace-1", "chat-idempotent")).thenReturn(chat("chat-idempotent"));

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

        assertThat(service.materialize(null, "chat-idempotent").id()).isNotNull();
        assertThat(service.materialize(null, "chat-idempotent").id()).isEqualTo(savedSession.getId());
        verify(sessionRepository, times(1)).save(any(ConversationSession.class));
        verify(gptMakerClient, times(1)).findChat("workspace-1", "chat-idempotent");
    }

    @Test
    void takeoverAfterRemoteMaterializationUpdatesSameSession() {
        Franchise franchise = mock(Franchise.class);
        UUID franchiseId = UUID.randomUUID();
        when(franchise.getId()).thenReturn(franchiseId);
        when(franchise.getName()).thenReturn("Vavive Centro");
        when(franchise.getWorkspaceId()).thenReturn("workspace-1");
        when(franchise.getAgentId()).thenReturn("agent-1");
        when(franchise.getAgentName()).thenReturn("Assistente Vavive");

        ConversationSessionRepository sessionRepository = mock(ConversationSessionRepository.class);
        ConversationSession savedSession = new ConversationSession(
            franchise,
            "agent-1",
            "Assistente Vavive",
            "chat-chat-takeover",
            "Joao da Silva",
            "5521999999999",
            "Ola",
            "Ola",
            "chat-takeover",
            null
        );
        ReflectionTestUtils.setField(savedSession, "id", UUID.randomUUID());
        ReflectionTestUtils.setField(savedSession, "createdAt", LocalDateTime.now());
        ReflectionTestUtils.setField(savedSession, "updatedAt", LocalDateTime.now());
        when(sessionRepository.findFirstByFranchiseIdAndChatId(franchiseId, "chat-takeover"))
            .thenReturn(Optional.empty(), Optional.of(savedSession));
        when(sessionRepository.save(any(ConversationSession.class))).thenReturn(savedSession);
        when(sessionRepository.findByIdAndFranchiseId(savedSession.getId(), franchiseId)).thenReturn(Optional.of(savedSession));

        User admin = new User("Frederico", "frederico@vavive.com", "hash", UserRole.ADMIN_FRANQUIA, franchise);
        CurrentUserService currentUserService = mock(CurrentUserService.class);
        when(currentUserService.requireCurrentUser()).thenReturn(admin);
        when(currentUserService.requireFranchise(admin)).thenReturn(franchise);

        GptMakerClient gptMakerClient = mock(GptMakerClient.class);
        when(gptMakerClient.findChat("workspace-1", "chat-takeover")).thenReturn(chat("chat-takeover"));
        when(gptMakerClient.startHuman("chat-takeover")).thenReturn(new GptMakerStartHumanResponse(true));

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

        service.materialize(null, "chat-takeover");
        service.startHuman(savedSession.getId());

        verify(sessionRepository, times(2)).save(any(ConversationSession.class));
        verify(gptMakerClient, times(1)).findChat("workspace-1", "chat-takeover");
        assertThat(savedSession.isHumanTakeoverActive()).isTrue();
    }

    @Test
    void manualSendAfterRemoteMaterializationUsesSameSession() {
        Franchise franchise = mock(Franchise.class);
        UUID franchiseId = UUID.randomUUID();
        when(franchise.getId()).thenReturn(franchiseId);
        when(franchise.getName()).thenReturn("Vavive Centro");
        when(franchise.getWorkspaceId()).thenReturn("workspace-1");
        when(franchise.getAgentId()).thenReturn("agent-1");
        when(franchise.getAgentName()).thenReturn("Assistente Vavive");

        ConversationSessionRepository sessionRepository = mock(ConversationSessionRepository.class);
        ConversationSession savedSession = new ConversationSession(
            franchise,
            "agent-1",
            "Assistente Vavive",
            "chat-chat-send",
            "Joao da Silva",
            "5521999999999",
            "Ola",
            "Ola",
            "chat-send",
            null
        );
        ReflectionTestUtils.setField(savedSession, "id", UUID.randomUUID());
        ReflectionTestUtils.setField(savedSession, "createdAt", LocalDateTime.now());
        ReflectionTestUtils.setField(savedSession, "updatedAt", LocalDateTime.now());
        when(sessionRepository.findFirstByFranchiseIdAndChatId(franchiseId, "chat-send"))
            .thenReturn(Optional.empty());
        when(sessionRepository.save(any(ConversationSession.class))).thenReturn(savedSession);
        when(sessionRepository.findByIdAndFranchiseId(savedSession.getId(), franchiseId)).thenReturn(Optional.of(savedSession));

        User admin = new User("Frederico", "frederico@vavive.com", "hash", UserRole.ADMIN_FRANQUIA, franchise);
        CurrentUserService currentUserService = mock(CurrentUserService.class);
        when(currentUserService.requireCurrentUser()).thenReturn(admin);
        when(currentUserService.requireFranchise(admin)).thenReturn(franchise);

        GptMakerClient gptMakerClient = mock(GptMakerClient.class);
        when(gptMakerClient.findChat("workspace-1", "chat-send")).thenReturn(chat("chat-send"));
        when(gptMakerClient.sendChatMessage("chat-send", "Resposta manual", null))
            .thenReturn(new GptMakerSimpleSuccessResponse(true));

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

        service.materialize(null, "chat-send");
        savedSession.setHumanTakeoverActive(true);
        service.sendManualMessage(savedSession.getId(), new ConversationManualMessageRequest("Resposta manual", null));

        verify(sessionRepository, times(2)).save(any(ConversationSession.class));
        verify(gptMakerClient).sendChatMessage("chat-send", "Resposta manual", null);
    }

    @Test
    void remoteMessageValidationUsesAuthenticatedAdminFranchise() {
        Franchise ownFranchise = mock(Franchise.class);
        UUID ownFranchiseId = UUID.randomUUID();
        when(ownFranchise.getId()).thenReturn(ownFranchiseId);
        when(ownFranchise.getName()).thenReturn("Vavive Centro");
        when(ownFranchise.getWorkspaceId()).thenReturn("workspace-own");

        ConversationSessionRepository sessionRepository = mock(ConversationSessionRepository.class);
        User admin = new User("Admin", "admin@vavive.com", "hash", UserRole.ADMIN_FRANQUIA, ownFranchise);
        CurrentUserService currentUserService = mock(CurrentUserService.class);
        when(currentUserService.requireCurrentUser()).thenReturn(admin);
        when(currentUserService.requireFranchise(admin)).thenReturn(ownFranchise);

        GptMakerClient gptMakerClient = mock(GptMakerClient.class);
        when(gptMakerClient.findChat("workspace-own", "chat-scope")).thenReturn(chat("chat-scope"));
        when(gptMakerClient.listChatMessages("chat-scope", 1, 30)).thenReturn(List.of(message("scope-message", 1_700_000_000_000L)));

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

        service.listRemoteMessages(UUID.randomUUID(), "chat-scope", 1, 30);

        verify(gptMakerClient).findChat("workspace-own", "chat-scope");
    }

    @Test
    void superAdminRemoteMessagesUseSelectedFranchiseWorkspace() {
        Franchise selectedFranchise = mock(Franchise.class);
        UUID selectedFranchiseId = UUID.randomUUID();
        when(selectedFranchise.getId()).thenReturn(selectedFranchiseId);
        when(selectedFranchise.getName()).thenReturn("Vavive Moema");
        when(selectedFranchise.getWorkspaceId()).thenReturn("workspace-selected");

        FranchiseRepository franchiseRepository = mock(FranchiseRepository.class);
        when(franchiseRepository.findById(selectedFranchiseId)).thenReturn(Optional.of(selectedFranchise));
        ConversationSessionRepository sessionRepository = mock(ConversationSessionRepository.class);
        User superAdmin = new User("Admin", "admin@vavive.com", "hash", UserRole.SUPER_ADMIN, null);
        CurrentUserService currentUserService = mock(CurrentUserService.class);
        when(currentUserService.requireCurrentUser()).thenReturn(superAdmin);

        GptMakerClient gptMakerClient = mock(GptMakerClient.class);
        when(gptMakerClient.findChat("workspace-selected", "chat-selected")).thenReturn(chat("chat-selected"));
        when(gptMakerClient.listChatMessages("chat-selected", 1, 30)).thenReturn(List.of(message("selected-message", 1_700_000_000_000L)));

        ConversationService service = new ConversationService(
            sessionRepository,
            mock(ConversationHandoffEventRepository.class),
            franchiseRepository,
            mock(FranchiseSetupRepository.class),
            currentUserService,
            gptMakerClient,
            mock(WhatsappHandoffService.class),
            new AppRuntimeProperties(null, new AppRuntimeProperties.Features(false, true, false))
        );

        service.listRemoteMessages(selectedFranchiseId, "chat-selected", 1, 30);

        verify(franchiseRepository).findById(selectedFranchiseId);
        verify(gptMakerClient).findChat("workspace-selected", "chat-selected");
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

    private GptMakerChatResponse chat(String id) {
        return new GptMakerChatResponse(
            id,
            false,
            true,
            false,
            "USER",
            "Assistente Vavive",
            "agent-1",
            "5521999999999",
            "Joao da Silva",
            "WHATSAPP",
            null,
            null,
            "WHATSAPP",
            "Ola",
            null,
            "https://cdn.gptmaker.ai/contacts/joao.jpg",
            null,
            null,
            "5521999999999",
            "Joao da Silva",
            1_700_000_000_000L,
            1_700_000_001_000L,
            0
        );
    }
}
