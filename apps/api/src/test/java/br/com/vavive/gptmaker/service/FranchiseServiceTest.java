package br.com.vavive.gptmaker.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import br.com.vavive.gptmaker.domain.entity.Franchise;
import br.com.vavive.gptmaker.domain.entity.FranchiseAssistantBlockConfig;
import br.com.vavive.gptmaker.domain.entity.GptMakerAgent;
import br.com.vavive.gptmaker.domain.entity.User;
import br.com.vavive.gptmaker.domain.enums.AssistantBlockType;
import br.com.vavive.gptmaker.domain.enums.UserRole;
import br.com.vavive.gptmaker.dto.UpdateFranchiseGptMakerWorkspaceRequest;
import br.com.vavive.gptmaker.integration.gptmaker.GptMakerClient;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerAgentResponse;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerWorkspaceResponse;
import br.com.vavive.gptmaker.repository.AgentConversationExampleRepository;
import br.com.vavive.gptmaker.repository.AgentIntentRepository;
import br.com.vavive.gptmaker.repository.AgentRuleRepository;
import br.com.vavive.gptmaker.repository.AgentTrainingRepository;
import br.com.vavive.gptmaker.repository.FranchiseAssistantBlockConfigRepository;
import br.com.vavive.gptmaker.repository.FranchiseRepository;
import br.com.vavive.gptmaker.repository.FranchiseSetupRepository;
import br.com.vavive.gptmaker.repository.GptMakerAgentRepository;
import br.com.vavive.gptmaker.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class FranchiseServiceTest {
    @Mock
    private FranchiseRepository franchiseRepository;
    @Mock
    private FranchiseSetupRepository franchiseSetupRepository;
    @Mock
    private GptMakerAgentRepository agentRepository;
    @Mock
    private AgentTrainingRepository trainingRepository;
    @Mock
    private AgentIntentRepository intentRepository;
    @Mock
    private AgentRuleRepository ruleRepository;
    @Mock
    private AgentConversationExampleRepository exampleRepository;
    @Mock
    private FranchiseAssistantBlockConfigRepository assistantBlockConfigRepository;
    @Mock
    private TrainingGeneratorService trainingGeneratorService;
    @Mock
    private SetupProgressService setupProgressService;
    @Mock
    private GptMakerClient gptMakerClient;
    @Mock
    private CurrentUserService currentUserService;
    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private VaviveDefaultContextService vaviveDefaultContextService;
    @Mock
    private WorkspaceCreditsService workspaceCreditsService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void linkGptMakerWorkspaceImportsSingleWorkspaceAgentWithConfiguration() {
        UUID franchiseId = UUID.randomUUID();
        Franchise franchise = new Franchise("Franquia", "1", "Sao Paulo", "SP", "PENDENTE_CONFIGURACAO");
        ReflectionTestUtils.setField(franchise, "id", franchiseId);

        User user = new User("Admin", "admin@vavive.com", "hash", UserRole.SUPER_ADMIN, null);

        when(currentUserService.requireCurrentUser()).thenReturn(user);
        when(franchiseRepository.findById(franchiseId)).thenReturn(Optional.of(franchise));
        when(franchiseRepository.findFirstByWorkspaceId("workspace-1")).thenReturn(Optional.empty());
        when(franchiseRepository.save(any(Franchise.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(gptMakerClient.listWorkspaces()).thenReturn(List.of(new GptMakerWorkspaceResponse("workspace-1", "Workspace 1")));
        when(gptMakerClient.listAgents("workspace-1")).thenReturn(List.of(
            new GptMakerAgentResponse(
                "agent-1",
                "Agente existente",
                "Consultivo",
                "https://example.com/avatar.png",
                "NORMAL",
                "SALE",
                "Comercial",
                "https://example.com",
                "Descricao"
            )
        ));
        when(gptMakerClient.getAgentSettings("agent-1")).thenReturn(objectMapper.createObjectNode()
            .put("prefferModel", "GPT_5")
            .put("enabledHumanTransfer", true)
            .put("messageGroupingTime", "TEN_SEC"));
        when(gptMakerClient.listTrainings("agent-1")).thenReturn(objectMapper.createArrayNode()
            .add(objectMapper.createObjectNode()
                .put("title", "Treinamento remoto")
                .put("content", "Conteudo remoto")));
        when(gptMakerClient.listIntentions("agent-1")).thenReturn(objectMapper.createArrayNode()
            .add(objectMapper.createObjectNode()
                .put("name", "duvida-comercial")
                .put("description", "Perguntas comerciais")
                .put("instructions", "Responder e converter")));
        when(gptMakerClient.listIdleActions("agent-1")).thenReturn(objectMapper.createObjectNode()
            .set("actions", objectMapper.createArrayNode()
                .add(objectMapper.createObjectNode()
                    .put("id", "idle-1")
                    .put("name", "Lembrete")
                    .put("delay", 300))));
        when(gptMakerClient.listTransferRules("agent-1")).thenReturn(objectMapper.createObjectNode()
            .put("id", "rule-1")
            .put("name", "Transferir humano")
            .put("enabled", true));
        when(agentRepository.findFirstByFranchiseIdAndExternalId(franchiseId, "agent-1")).thenReturn(Optional.empty());
        when(agentRepository.findFirstByFranchiseIdAndName(franchiseId, "Agente existente")).thenReturn(Optional.empty());
        when(agentRepository.findFirstByFranchiseIdOrderByCreatedAtAsc(franchiseId)).thenReturn(Optional.empty());
        when(agentRepository.save(any(GptMakerAgent.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(assistantBlockConfigRepository.findByFranchiseAndBlockType(any(Franchise.class), any(AssistantBlockType.class)))
            .thenReturn(Optional.empty());
        when(assistantBlockConfigRepository.save(any(FranchiseAssistantBlockConfig.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        FranchiseService service = new FranchiseService(
            franchiseRepository,
            franchiseSetupRepository,
            agentRepository,
            trainingRepository,
            intentRepository,
            ruleRepository,
            exampleRepository,
            assistantBlockConfigRepository,
            trainingGeneratorService,
            setupProgressService,
            gptMakerClient,
            currentUserService,
            userRepository,
            passwordEncoder,
            vaviveDefaultContextService,
            workspaceCreditsService,
            objectMapper
        );

        var response = service.linkGptMakerWorkspace(
            franchiseId,
            new UpdateFranchiseGptMakerWorkspaceRequest("workspace-1", "Workspace 1", true)
        );

        assertThat(response.workspaceId()).isEqualTo("workspace-1");
        assertThat(response.agentId()).isEqualTo("agent-1");
        assertThat(franchise.getAgentId()).isEqualTo("agent-1");
        assertThat(franchise.getAgentName()).isEqualTo("Agente existente");
        verify(gptMakerClient).listAgents("workspace-1");
        verify(gptMakerClient).getAgentSettings("agent-1");
        verify(gptMakerClient).listTrainings("agent-1");
        verify(gptMakerClient).listIntentions("agent-1");
        verify(gptMakerClient).listIdleActions("agent-1");
        verify(gptMakerClient).listTransferRules("agent-1");
        verify(agentRepository, org.mockito.Mockito.atLeastOnce()).save(any(GptMakerAgent.class));

        ArgumentCaptor<FranchiseAssistantBlockConfig> configCaptor = ArgumentCaptor.forClass(FranchiseAssistantBlockConfig.class);
        verify(assistantBlockConfigRepository, org.mockito.Mockito.atLeast(7)).save(configCaptor.capture());
        assertThat(configCaptor.getAllValues())
            .extracting(FranchiseAssistantBlockConfig::getBlockType)
            .contains(
                AssistantBlockType.ROLE,
                AssistantBlockType.BEHAVIOR,
                AssistantBlockType.AGENT_SETTINGS,
                AssistantBlockType.TRAININGS,
                AssistantBlockType.INTENTIONS,
                AssistantBlockType.IDLE_ACTIONS,
                AssistantBlockType.TRANSFER_RULES
            );
        assertThat(configCaptor.getAllValues().stream()
            .filter(config -> config.getBlockType() == AssistantBlockType.AGENT_SETTINGS)
            .findFirst()
            .map(FranchiseAssistantBlockConfig::getCustomPayloadJson)
            .orElseThrow())
            .contains("GPT_5")
            .contains("TEN_SEC");
        assertThat(configCaptor.getAllValues().stream()
            .filter(config -> config.getBlockType() == AssistantBlockType.TRAININGS)
            .findFirst()
            .map(FranchiseAssistantBlockConfig::getCustomPayloadJson)
            .orElseThrow())
            .contains("Treinamento remoto")
            .contains("Conteudo remoto");
        assertThat(configCaptor.getAllValues().stream()
            .filter(config -> config.getBlockType() == AssistantBlockType.INTENTIONS)
            .findFirst()
            .map(FranchiseAssistantBlockConfig::getCustomPayloadJson)
            .orElseThrow())
            .contains("duvida-comercial")
            .contains("Responder e converter");
        assertThat(configCaptor.getAllValues().stream()
            .filter(config -> config.getBlockType() == AssistantBlockType.IDLE_ACTIONS)
            .findFirst()
            .map(FranchiseAssistantBlockConfig::getCustomPayloadJson)
            .orElseThrow())
            .contains("idle-1")
            .contains("Lembrete");
        assertThat(configCaptor.getAllValues().stream()
            .filter(config -> config.getBlockType() == AssistantBlockType.TRANSFER_RULES)
            .findFirst()
            .map(FranchiseAssistantBlockConfig::getCustomPayloadJson)
            .orElseThrow())
            .contains("rule-1")
            .contains("Transferir humano");
    }

    @Test
    void linkGptMakerWorkspaceBindsFirstImportedAgentWhenWorkspaceAlreadyHasAgents() {
        UUID franchiseId = UUID.randomUUID();
        Franchise franchise = new Franchise("Franquia", "1", "Sao Paulo", "SP", "PENDENTE_CONFIGURACAO");
        ReflectionTestUtils.setField(franchise, "id", franchiseId);

        User user = new User("Admin", "admin@vavive.com", "hash", UserRole.SUPER_ADMIN, null);

        when(currentUserService.requireCurrentUser()).thenReturn(user);
        when(franchiseRepository.findById(franchiseId)).thenReturn(Optional.of(franchise));
        when(franchiseRepository.findFirstByWorkspaceId("workspace-1")).thenReturn(Optional.empty());
        when(franchiseRepository.save(any(Franchise.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(gptMakerClient.listWorkspaces()).thenReturn(List.of(new GptMakerWorkspaceResponse("workspace-1", "Workspace 1")));
        when(gptMakerClient.listAgents("workspace-1")).thenReturn(List.of(
            new GptMakerAgentResponse("agent-1", "Primeiro agente", "Consultivo", null, "NORMAL", "SALE", "Comercial", null, "Descricao 1"),
            new GptMakerAgentResponse("agent-2", "Segundo agente", "Suporte", null, "FORMAL", "SUPPORT", "Suporte", null, "Descricao 2")
        ));
        when(gptMakerClient.getAgentSettings("agent-1")).thenReturn(objectMapper.createObjectNode().put("prefferModel", "GPT_5"));
        when(gptMakerClient.listTrainings("agent-1")).thenReturn(objectMapper.createArrayNode());
        when(gptMakerClient.listIntentions("agent-1")).thenReturn(objectMapper.createArrayNode());
        when(gptMakerClient.listIdleActions("agent-1")).thenReturn(objectMapper.createArrayNode());
        when(gptMakerClient.listTransferRules("agent-1")).thenReturn(objectMapper.createArrayNode());
        when(agentRepository.findFirstByFranchiseIdAndExternalId(franchiseId, "agent-1")).thenReturn(Optional.empty());
        when(agentRepository.findFirstByFranchiseIdAndExternalId(franchiseId, "agent-2")).thenReturn(Optional.empty());
        when(agentRepository.findFirstByFranchiseIdAndName(franchiseId, "Primeiro agente")).thenReturn(Optional.empty());
        when(agentRepository.findFirstByFranchiseIdAndName(franchiseId, "Segundo agente")).thenReturn(Optional.empty());
        when(agentRepository.findFirstByFranchiseIdOrderByCreatedAtAsc(franchiseId)).thenReturn(Optional.empty());
        when(agentRepository.save(any(GptMakerAgent.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(assistantBlockConfigRepository.findByFranchiseAndBlockType(any(Franchise.class), any(AssistantBlockType.class)))
            .thenReturn(Optional.empty());
        when(assistantBlockConfigRepository.save(any(FranchiseAssistantBlockConfig.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        FranchiseService service = new FranchiseService(
            franchiseRepository,
            franchiseSetupRepository,
            agentRepository,
            trainingRepository,
            intentRepository,
            ruleRepository,
            exampleRepository,
            assistantBlockConfigRepository,
            trainingGeneratorService,
            setupProgressService,
            gptMakerClient,
            currentUserService,
            userRepository,
            passwordEncoder,
            vaviveDefaultContextService,
            workspaceCreditsService,
            objectMapper
        );

        var response = service.linkGptMakerWorkspace(
            franchiseId,
            new UpdateFranchiseGptMakerWorkspaceRequest("workspace-1", "Workspace 1", true)
        );

        assertThat(response.agentId()).isEqualTo("agent-1");
        assertThat(franchise.getAgentId()).isEqualTo("agent-1");
        assertThat(franchise.getAgentName()).isEqualTo("Primeiro agente");
        verify(gptMakerClient).getAgentSettings("agent-1");
    }
}
