package br.com.vavive.gptmaker;

import br.com.vavive.gptmaker.domain.entity.DefaultAgentText;
import br.com.vavive.gptmaker.domain.entity.Franchise;
import br.com.vavive.gptmaker.domain.entity.GptMakerAgent;
import br.com.vavive.gptmaker.domain.entity.Lead;
import br.com.vavive.gptmaker.domain.entity.User;
import br.com.vavive.gptmaker.domain.enums.DefaultAgentTextCategory;
import br.com.vavive.gptmaker.domain.enums.LeadStatus;
import br.com.vavive.gptmaker.domain.enums.UserRole;
import br.com.vavive.gptmaker.repository.AgentTrainingRepository;
import br.com.vavive.gptmaker.repository.DefaultAgentTextRepository;
import br.com.vavive.gptmaker.repository.FranchiseRepository;
import br.com.vavive.gptmaker.repository.GptMakerAgentRepository;
import br.com.vavive.gptmaker.repository.LeadRepository;
import br.com.vavive.gptmaker.repository.UserRepository;
import br.com.vavive.gptmaker.security.JwtService;
import br.com.vavive.gptmaker.service.VaviveDefaultContextService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class FranchiseSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private FranchiseRepository franchiseRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GptMakerAgentRepository agentRepository;

    @Autowired
    private AgentTrainingRepository trainingRepository;

    @Autowired
    private LeadRepository leadRepository;

    @Autowired
    private DefaultAgentTextRepository defaultAgentTextRepository;

    @Autowired
    private VaviveDefaultContextService defaultContextService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @BeforeEach
    void setUpBaseData() {
        if (userRepository.findByEmailIgnoreCase("admin@vavive.com").isEmpty()) {
            userRepository.save(new User(
                "Admin Vavive",
                "admin@vavive.com",
                passwordEncoder.encode("admin123"),
                UserRole.SUPER_ADMIN,
                null
            ));
        }

        Franchise franchise = franchiseRepository.findAll().stream().findFirst().orElseGet(() -> {
            Franchise created = new Franchise("Vavive Vila Mariana", "12.345.678/0001-90", "Sao Paulo", "SP", "ATIVA");
            created.setWorkspaceId("mock-workspace-vavive");
            created.setWorkspaceName("Workspace Vavive Demo");
            created.setAgentId("mock-agent-mock-workspace-vavive-01");
            created.setAgentName("Assistente Comercial");
            created.setStatus("ATIVA");
            return franchiseRepository.save(created);
        });

        if (userRepository.findByEmailIgnoreCase("franquia@vavive.com").isEmpty()) {
            userRepository.save(new User(
                "Gestora Vila Mariana",
                "franquia@vavive.com",
                passwordEncoder.encode("admin123"),
                UserRole.ADMIN_FRANQUIA,
                franchise
            ));
        }

        GptMakerAgent agent = agentRepository.findFirstByFranchiseIdAndExternalId(franchise.getId(), "mock-agent-mock-workspace-vavive-01")
            .orElseGet(() -> agentRepository.save(new GptMakerAgent(
                "mock-agent-mock-workspace-vavive-01",
                "Assistente Comercial",
                "ATIVO",
                "Acolhedor, objetivo e consultivo",
                franchise
            )));

        if (leadRepository.count() == 0) {
            leadRepository.save(new Lead("Mariana Alves", "+55 11 90000-1001", "Acompanhante hospitalar", "WhatsApp", LeadStatus.NOVO, franchise, agent));
            leadRepository.save(new Lead("Ricardo Lima", "+55 11 90000-1002", "Cuidador por hora", "Instagram", LeadStatus.EM_ATENDIMENTO, franchise, agent));
            leadRepository.save(new Lead("Beatriz Souza", "+55 11 90000-1003", "Cuidador noturno", "WhatsApp", LeadStatus.CONVERTIDO, franchise, agent));
            leadRepository.save(new Lead("Carlos Mendes", "+55 11 90000-1004", "Pos-cirurgico", "Site", LeadStatus.FINALIZADO, franchise, agent));
        }
    }

    @Test
    void superAdminCreatesFranchiseAdminUser() throws Exception {
        Franchise franchise = franchiseRepository.save(new Franchise("Vavive Moema", "11.111.111/0001-11", "Sao Paulo", "SP", "ATIVA"));
        long agentCount = agentRepository.count();
        long trainingCount = trainingRepository.count();

        mockMvc.perform(post("/franchises/{id}/admin-user", franchise.getId())
                .header("Authorization", bearerToken("admin@vavive.com", "admin123"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "name": "Franqueado Moema",
                      "email": "moema@vavive.com",
                      "password": "admin123"
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Franqueado Moema"))
            .andExpect(jsonPath("$.email").value("moema@vavive.com"))
            .andExpect(jsonPath("$.role").value("ADMIN_FRANQUIA"))
            .andExpect(jsonPath("$.password").doesNotExist());

        var createdUser = userRepository.findByEmailIgnoreCase("moema@vavive.com").orElseThrow();
        assertThat(createdUser.getFranchise().getId()).isEqualTo(franchise.getId());
        assertThat(createdUser.getPasswordHash()).isNotEqualTo("admin123");

        Franchise unchangedFranchise = franchiseRepository.findById(franchise.getId()).orElseThrow();
        assertThat(unchangedFranchise.getWorkspaceId()).isNull();
        assertThat(unchangedFranchise.getAgentId()).isNull();
        assertThat(agentRepository.count()).isEqualTo(agentCount);
        assertThat(trainingRepository.count()).isEqualTo(trainingCount);

        mockMvc.perform(get("/me")
                .header("Authorization", bearerToken("moema@vavive.com", "admin123")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.role").value("ADMIN_FRANQUIA"))
            .andExpect(jsonPath("$.franchise.id").value(franchise.getId().toString()));
    }

    @Test
    void adminFranquiaCannotCreateFranchiseAdminUser() throws Exception {
        Franchise franchise = franchiseRepository.save(new Franchise("Vavive Pinheiros", "22.222.222/0001-22", "Sao Paulo", "SP", "ATIVA"));

        mockMvc.perform(post("/franchises/{id}/admin-user", franchise.getId())
                .header("Authorization", bearerToken("franquia@vavive.com", "admin123"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "name": "Outro Admin",
                      "email": "outro@vavive.com",
                      "password": "admin123"
                    }
                    """))
            .andExpect(status().isForbidden());
    }

    @Test
    void adminFranquiaCannotListGlobalWorkspaces() throws Exception {
        mockMvc.perform(get("/gptmaker/workspaces")
                .header("Authorization", bearerToken("franquia@vavive.com", "admin123")))
            .andExpect(status().isForbidden());

        mockMvc.perform(get("/franchises/gptmaker/workspaces")
                .header("Authorization", bearerToken("franquia@vavive.com", "admin123")))
            .andExpect(status().isForbidden());

        mockMvc.perform(get("/franchises/gptmaker/workspaces/{workspaceId}/agents", "mock-workspace-vavive")
                .header("Authorization", bearerToken("franquia@vavive.com", "admin123")))
            .andExpect(status().isForbidden());

        mockMvc.perform(get("/franchises/gptmaker/available-workspaces")
                .header("Authorization", bearerToken("franquia@vavive.com", "admin123")))
            .andExpect(status().isForbidden());
    }

    @Test
    void adminFranquiaCannotAccessDiagnostics() throws Exception {
        mockMvc.perform(get("/gptmaker/diagnostics")
                .header("Authorization", bearerToken("franquia@vavive.com", "admin123")))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.message").value("Apenas SUPER_ADMIN pode acessar esta configuracao GPTMaker."));
    }

    @Test
    void adminFranquiaCannotAccessAnotherFranchise() throws Exception {
        Franchise otherFranchise = franchiseRepository.save(new Franchise("Vavive Morumbi", "33.333.333/0001-33", "Sao Paulo", "SP", "ATIVA"));

        mockMvc.perform(get("/franchises/{id}", otherFranchise.getId())
                .header("Authorization", bearerToken("franquia@vavive.com", "admin123")))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.message").value("ADMIN_FRANQUIA so pode acessar dados da propria franquia."));
    }

    @Test
    void adminFranquiaCannotProvisionGptMakerAgent() throws Exception {
        Franchise franchise = franchiseRepository.findAll().stream().findFirst().orElseThrow();

        mockMvc.perform(post("/franchises/{id}/gptmaker/agent", franchise.getId())
                .header("Authorization", bearerToken("franquia@vavive.com", "admin123"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "workspaceId": "ws-1",
                      "workspaceName": "Workspace Teste",
                      "agentName": "Assistente Vavive - Teste",
                      "communicationType": "NORMAL",
                      "type": "SALE",
                      "jobName": "Vavive",
                      "jobSite": "https://vavive.com.br",
                      "jobDescription": "Contexto Vavive"
                    }
                    """))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.message").value("Apenas SUPER_ADMIN pode acessar esta configuracao GPTMaker."));
    }

    @Test
    void adminFranquiaWithoutFranchiseCannotLogin() throws Exception {
        userRepository.save(new User(
            "Admin sem franquia",
            "sem-franquia@vavive.com",
            passwordEncoder.encode("admin123"),
            UserRole.ADMIN_FRANQUIA,
            null
        ));

        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "email": "sem-franquia@vavive.com",
                      "password": "admin123"
                    }
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Usuario ADMIN_FRANQUIA nao possui franquia associada."));
    }

    @Test
    void meReturnsFranchiseForAdminFranquia() throws Exception {
        mockMvc.perform(get("/me")
                .header("Authorization", bearerToken("franquia@vavive.com", "admin123")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.role").value("ADMIN_FRANQUIA"))
            .andExpect(jsonPath("$.franchise.id").isNotEmpty())
            .andExpect(jsonPath("$.franchise.name").value("Vavive Vila Mariana"))
            .andExpect(jsonPath("$.franchise.status").value("ATIVA"));
    }

    @Test
    void dashboardSummaryWorksForSuperAdmin() throws Exception {
        mockMvc.perform(get("/dashboard/summary")
                .header("Authorization", bearerToken("admin@vavive.com", "admin123")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalLeads").value(4))
            .andExpect(jsonPath("$.setupStatus").value("VISAO_GERAL"));
    }

    @Test
    void dashboardSummaryWorksForAdminFranquia() throws Exception {
        mockMvc.perform(get("/dashboard/summary")
                .header("Authorization", bearerToken("franquia@vavive.com", "admin123")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalLeads").value(4))
            .andExpect(jsonPath("$.setupStatus").isNotEmpty());
    }

    @Test
    void leadsReturnsFriendlyErrorWhenAdminFranquiaHasNoFranchise() throws Exception {
        User user = userRepository.save(new User(
            "Admin sem franquia leads",
            "sem-franquia-leads@vavive.com",
            passwordEncoder.encode("admin123"),
            UserRole.ADMIN_FRANQUIA,
            null
        ));

        mockMvc.perform(get("/leads")
                .header("Authorization", "Bearer " + jwtService.generateToken(user)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Usuario ADMIN_FRANQUIA nao possui franquia associada."));
    }

    @Test
    void provisioningCreatesOrUpdatesLocalAgentWithoutDuplication() throws Exception {
        Franchise franchise = franchiseRepository.save(new Franchise("Vavive Campo Belo", "44.444.444/0001-44", "Sao Paulo", "SP", "ATIVA"));

        String requestBody = """
            {
              "workspaceId": "ws-real-1",
              "workspaceName": "Workspace Real",
              "agentName": "Assistente Vavive - Campo Belo",
              "communicationType": "NORMAL",
              "type": "SALE",
              "avatar": "https://assets.vavive.com/avatar-neutro-vavive.png",
              "jobName": "Vavive",
              "jobSite": "https://vavive.com.br",
              "jobDescription": "Contexto base da Vavive + descricao da franquia"
            }
            """;

        mockMvc.perform(post("/franchises/{id}/gptmaker/agent", franchise.getId())
                .header("Authorization", bearerToken("admin@vavive.com", "admin123"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.workspaceId").value("ws-real-1"))
            .andExpect(jsonPath("$.workspaceName").value("Workspace Real"))
            .andExpect(jsonPath("$.agentId").value("mock-agent-created-ws-real-1"))
            .andExpect(jsonPath("$.agentName").value("Assistente Vavive - Campo Belo"));

        mockMvc.perform(post("/franchises/{id}/gptmaker/agent", franchise.getId())
                .header("Authorization", bearerToken("admin@vavive.com", "admin123"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
            .andExpect(status().isOk());

        Franchise updated = franchiseRepository.findById(franchise.getId()).orElseThrow();
        assertThat(updated.getWorkspaceId()).isEqualTo("ws-real-1");
        assertThat(updated.getWorkspaceName()).isEqualTo("Workspace Real");
        assertThat(updated.getAgentId()).isEqualTo("mock-agent-created-ws-real-1");
        assertThat(updated.getAgentName()).isEqualTo("Assistente Vavive - Campo Belo");

        var localAgents = agentRepository.findByFranchiseId(franchise.getId());
        assertThat(localAgents).hasSize(1);
        assertThat(localAgents.getFirst().getAvatar()).isEqualTo("https://assets.vavive.com/avatar-neutro-vavive.png");
        var trainings = trainingRepository.findAll().stream()
            .filter(training -> training.getAgent().getFranchise().getId().equals(franchise.getId()))
            .toList();
        assertThat(trainings).isNotEmpty();
        assertThat(trainings.getFirst().getStatus()).isEqualTo("SALVO_LOCALMENTE");
        assertThat(trainings.getFirst().getContent()).contains("A Vavive e uma empresa de servicos de limpeza e cuidados.");
    }

    @Test
    void superAdminCanLinkExistingGptMakerAgent() throws Exception {
        Franchise franchise = franchiseRepository.save(new Franchise("Vavive Jardins", "55.555.555/0001-55", "Sao Paulo", "SP", "ATIVA"));
        long trainingCount = trainingRepository.count();

        mockMvc.perform(post("/franchises/{id}/gptmaker-connection", franchise.getId())
                .header("Authorization", bearerToken("admin@vavive.com", "admin123"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "workspaceId": "mock-workspace-sp",
                      "agentId": "mock-agent-mock-workspace-sp-01"
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.workspaceId").value("mock-workspace-sp"))
            .andExpect(jsonPath("$.workspaceName").value("Workspace Sao Paulo"))
            .andExpect(jsonPath("$.agentId").value("mock-agent-mock-workspace-sp-01"))
            .andExpect(jsonPath("$.agentName").value("Assistente Comercial"))
            .andExpect(jsonPath("$.status").value("ATIVA"));

        Franchise updated = franchiseRepository.findById(franchise.getId()).orElseThrow();
        assertThat(updated.getWorkspaceId()).isEqualTo("mock-workspace-sp");
        assertThat(updated.getAgentId()).isEqualTo("mock-agent-mock-workspace-sp-01");
        assertThat(agentRepository.findByFranchiseId(franchise.getId())).hasSize(1);
        assertThat(trainingRepository.count()).isEqualTo(trainingCount);
    }

    @Test
    void superAdminCreatesFranchiseWithValidWorkspace() throws Exception {
        mockMvc.perform(post("/franchises")
                .header("Authorization", bearerToken("admin@vavive.com", "admin123"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "name": "Vavive Workspace",
                      "document": "66.666.666/0001-66",
                      "city": "Sao Paulo",
                      "state": "SP",
                      "workspaceId": "mock-workspace-sp"
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.workspaceId").value("mock-workspace-sp"))
            .andExpect(jsonPath("$.workspaceName").value("Workspace Sao Paulo"))
            .andExpect(jsonPath("$.agentId").doesNotExist())
            .andExpect(jsonPath("$.status").value("SEM_AGENTE"));
    }

    @Test
    void superAdminCreatesFranchiseWithoutWorkspace() throws Exception {
        mockMvc.perform(post("/franchises")
                .header("Authorization", bearerToken("admin@vavive.com", "admin123"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "name": "Vavive Pendente",
                      "document": "77.777.777/0001-77",
                      "city": "Sao Paulo",
                      "state": "SP"
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.workspaceId").doesNotExist())
            .andExpect(jsonPath("$.agentId").doesNotExist())
            .andExpect(jsonPath("$.status").value("PENDENTE_CONFIGURACAO"));
    }

    @Test
    void superAdminLinksWorkspaceAfterFranchiseCreation() throws Exception {
        Franchise franchise = franchiseRepository.save(new Franchise("Vavive Perdizes", "88.888.888/0001-88", "Sao Paulo", "SP", "ATIVA"));

        mockMvc.perform(post("/franchises/{id}/gptmaker/workspace", franchise.getId())
                .header("Authorization", bearerToken("admin@vavive.com", "admin123"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "workspaceId": "mock-workspace-sp"
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.workspaceId").value("mock-workspace-sp"))
            .andExpect(jsonPath("$.workspaceName").value("Workspace Sao Paulo"))
            .andExpect(jsonPath("$.agentId").doesNotExist())
            .andExpect(jsonPath("$.status").value("SEM_AGENTE"));
    }

    @Test
    void changingWorkspaceClearsConnectedAgent() throws Exception {
        Franchise franchise = franchiseRepository.save(new Franchise("Vavive Tatuape", "99.999.999/0001-99", "Sao Paulo", "SP", "ATIVA"));
        franchise.setWorkspaceId("mock-workspace-vavive");
        franchise.setWorkspaceName("Workspace Vavive Demo");
        franchise.setAgentId("agent-old");
        franchise.setAgentName("Agente Antigo");
        franchise.setGptMakerLastSyncAt(java.time.LocalDateTime.now());
        franchiseRepository.save(franchise);
        agentRepository.save(new GptMakerAgent("agent-old", "Agente Antigo", "ATIVO", "NORMAL", franchise));

        mockMvc.perform(post("/franchises/{id}/gptmaker/workspace", franchise.getId())
                .header("Authorization", bearerToken("admin@vavive.com", "admin123"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "workspaceId": "mock-workspace-sp",
                      "confirmCriticalChange": true
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.workspaceId").value("mock-workspace-sp"))
            .andExpect(jsonPath("$.agentId").doesNotExist())
            .andExpect(jsonPath("$.agentName").doesNotExist())
            .andExpect(jsonPath("$.status").value("SEM_AGENTE"));

        Franchise updated = franchiseRepository.findById(franchise.getId()).orElseThrow();
        assertThat(updated.getAgentId()).isNull();
        assertThat(updated.getAgentName()).isNull();
        assertThat(updated.getGptMakerLastSyncAt()).isNull();
    }

    @Test
    void workspaceMappingReturnsLinkedUnlinkedAndPendingFranchises() throws Exception {
        Franchise linked = franchiseRepository.save(new Franchise("Vavive Linkada", "12.121.121/0001-12", "Sao Paulo", "SP", "ATIVA"));
        linked.setWorkspaceId("mock-workspace-vavive");
        linked.setWorkspaceName("Workspace Vavive Demo");
        linked.setAgentId("agent-linked");
        linked.setAgentName("Agente Linkado");
        franchiseRepository.save(linked);
        Franchise pending = franchiseRepository.save(new Franchise("Vavive Sem Workspace", "13.131.131/0001-13", "Campinas", "SP", "ATIVA"));

        mockMvc.perform(get("/franchises/gptmaker/workspace-mapping")
                .header("Authorization", bearerToken("admin@vavive.com", "admin123")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.linked[?(@.franchiseId == '%s')]".formatted(linked.getId())).exists())
            .andExpect(jsonPath("$.unlinkedWorkspaces[?(@.workspaceId == 'mock-workspace-sp')]").exists())
            .andExpect(jsonPath("$.franchisesWithoutWorkspace[?(@.franchiseId == '%s')]".formatted(pending.getId())).exists());
    }

    @Test
    void adminFranquiaCannotAccessWorkspaceMapping() throws Exception {
        mockMvc.perform(get("/franchises/gptmaker/workspace-mapping")
                .header("Authorization", bearerToken("franquia@vavive.com", "admin123")))
            .andExpect(status().isForbidden());
    }

    @Test
    void availableWorkspacesDoNotReturnLinkedWorkspace() throws Exception {
        mockMvc.perform(get("/franchises/gptmaker/available-workspaces")
                .header("Authorization", bearerToken("admin@vavive.com", "admin123")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[?(@.id == 'mock-workspace-vavive')]").doesNotExist())
            .andExpect(jsonPath("$[?(@.id == 'mock-workspace-sp')]").exists());
    }

    @Test
    void cannotLinkWorkspaceAlreadyUsedByAnotherFranchise() throws Exception {
        Franchise franchise = franchiseRepository.save(new Franchise("Vavive Nova", "15.151.151/0001-15", "Sao Paulo", "SP", "PENDENTE_CONFIGURACAO"));

        mockMvc.perform(post("/franchises/{id}/gptmaker/workspace", franchise.getId())
                .header("Authorization", bearerToken("admin@vavive.com", "admin123"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "workspaceId": "mock-workspace-vavive"
                    }
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Esta workspace GPTMaker ja esta vinculada a outra franquia."));
    }

    @Test
    void changingWorkspaceRequiresConfirmation() throws Exception {
        Franchise franchise = franchiseRepository.findAll().stream().findFirst().orElseThrow();

        mockMvc.perform(post("/franchises/{id}/gptmaker/workspace", franchise.getId())
                .header("Authorization", bearerToken("admin@vavive.com", "admin123"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "workspaceId": "mock-workspace-sp"
                    }
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Trocar workspace e uma acao critica. Confirme para continuar."));
    }

    @Test
    void unlinkWorkspaceRequiresConfirmation() throws Exception {
        Franchise franchise = franchiseRepository.findAll().stream().findFirst().orElseThrow();

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete("/franchises/{id}/gptmaker/workspace", franchise.getId())
                .header("Authorization", bearerToken("admin@vavive.com", "admin123"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Desvincular workspace e uma acao critica. Confirme para continuar."));
    }

    @Test
    void clearAgentRequiresConfirmation() throws Exception {
        Franchise franchise = franchiseRepository.findAll().stream().findFirst().orElseThrow();

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete("/franchises/{id}/gptmaker/agent", franchise.getId())
                .header("Authorization", bearerToken("admin@vavive.com", "admin123"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Limpar agente e uma acao critica. Confirme para continuar."));
    }

    @Test
    void adminFranquiaWithoutWorkspaceSeesFranchiseAsNotActive() throws Exception {
        Franchise franchise = new Franchise("Vavive Pendente", "16.161.161/0001-16", "Sao Paulo", "SP", "PENDENTE_CONFIGURACAO");
        franchise = franchiseRepository.save(franchise);
        userRepository.save(new User(
            "Franquia Pendente",
            "pendente@vavive.com",
            passwordEncoder.encode("admin123"),
            UserRole.ADMIN_FRANQUIA,
            franchise
        ));

        mockMvc.perform(get("/me")
                .header("Authorization", bearerToken("pendente@vavive.com", "admin123")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.franchise.status").value("PENDENTE_CONFIGURACAO"));
    }

    @Test
    void defaultAgentTextCrudIsRestrictedToSuperAdmin() throws Exception {
        String created = mockMvc.perform(post("/default-agent-texts")
                .header("Authorization", bearerToken("admin@vavive.com", "admin123"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "title": "Tom consultivo",
                      "category": "TOM_DE_VOZ",
                      "content": "Atender com clareza e proximidade.",
                      "active": true
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.title").value("Tom consultivo"))
            .andExpect(jsonPath("$.active").value(true))
            .andReturn()
            .getResponse()
            .getContentAsString();

        String id = objectMapper.readTree(created).get("id").asText();

        mockMvc.perform(get("/default-agent-texts")
                .header("Authorization", bearerToken("admin@vavive.com", "admin123")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[?(@.id == '%s')]".formatted(id)).exists());

        mockMvc.perform(put("/default-agent-texts/{id}", id)
                .header("Authorization", bearerToken("admin@vavive.com", "admin123"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "title": "FAQ inicial",
                      "category": "FAQ",
                      "content": "Responder perguntas frequentes com base nos dados da franquia.",
                      "active": true
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.category").value("FAQ"));

        mockMvc.perform(patch("/default-agent-texts/{id}/toggle", id)
                .header("Authorization", bearerToken("admin@vavive.com", "admin123")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.active").value(false));

        mockMvc.perform(get("/default-agent-texts")
                .header("Authorization", bearerToken("franquia@vavive.com", "admin123")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[?(@.id == '%s')]".formatted(id)).doesNotExist());

        mockMvc.perform(post("/default-agent-texts")
                .header("Authorization", bearerToken("franquia@vavive.com", "admin123"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "title": "Nao permitido",
                      "category": "FAQ",
                      "content": "ADMIN_FRANQUIA nao gerencia textos globais.",
                      "active": true
                    }
                    """))
            .andExpect(status().isForbidden());
    }

    @Test
    void getAgentReturnsAvatarForAccessibleAgent() throws Exception {
        GptMakerAgent agent = agentRepository.findAll().stream()
            .filter(item -> "mock-agent-mock-workspace-vavive-01".equals(item.getExternalId()))
            .findFirst()
            .orElseThrow();
        agent.setAvatar("https://assets.vavive.com/avatar-profissional-feminino.png");
        agentRepository.save(agent);

        mockMvc.perform(get("/agents/{id}", agent.getId())
                .header("Authorization", bearerToken("admin@vavive.com", "admin123")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(agent.getId().toString()))
            .andExpect(jsonPath("$.avatar").value("https://assets.vavive.com/avatar-profissional-feminino.png"));
    }

    @Test
    void superAdminCanTestAgentAndListConversation() throws Exception {
        Franchise franchise = franchiseRepository.findAll().stream().findFirst().orElseThrow();

        String created = mockMvc.perform(post("/conversations/test-agent")
                .header("Authorization", bearerToken("admin@vavive.com", "admin123"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "franchiseId": "%s",
                      "prompt": "Preciso de um cuidador para hoje a noite.",
                      "contextId": "cliente-001",
                      "customerName": "Maria Teste",
                      "phone": "5511999999999"
                    }
                    """.formatted(franchise.getId())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.franchiseId").value(franchise.getId().toString()))
            .andExpect(jsonPath("$.contextId").value("cliente-001"))
            .andReturn()
            .getResponse()
            .getContentAsString();

        String conversationId = objectMapper.readTree(created).get("conversationId").asText();

        mockMvc.perform(get("/conversations")
                .header("Authorization", bearerToken("admin@vavive.com", "admin123")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[?(@.id == '%s')]".formatted(conversationId)).exists());
    }

    @Test
    void adminFranquiaOnlyTestsOwnFranchiseAgent() throws Exception {
        Franchise ownFranchise = franchiseRepository.findAll().stream().findFirst().orElseThrow();
        Franchise otherFranchise = franchiseRepository.save(new Franchise("Vavive Santana", "18.181.181/0001-18", "Sao Paulo", "SP", "ATIVA"));
        otherFranchise.setWorkspaceId("mock-workspace-sp");
        otherFranchise.setWorkspaceName("Workspace Sao Paulo");
        otherFranchise.setAgentId("mock-agent-mock-workspace-sp-01");
        otherFranchise.setAgentName("Assistente Santana");
        franchiseRepository.save(otherFranchise);

        mockMvc.perform(post("/conversations/test-agent")
                .header("Authorization", bearerToken("franquia@vavive.com", "admin123"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "franchiseId": "%s",
                      "prompt": "Teste de franquia cruzada",
                      "contextId": "cliente-admin",
                      "customerName": "Cliente Admin"
                    }
                    """.formatted(otherFranchise.getId())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.franchiseId").value(ownFranchise.getId().toString()));
    }

    @Test
    void conversationMessagesAndStartHumanRespectFranchiseOwnership() throws Exception {
        Franchise ownFranchise = franchiseRepository.findAll().stream().findFirst().orElseThrow();
        Franchise otherFranchise = franchiseRepository.save(new Franchise("Vavive Osasco", "19.191.191/0001-19", "Osasco", "SP", "ATIVA"));
        otherFranchise.setWorkspaceId("mock-workspace-sp");
        otherFranchise.setWorkspaceName("Workspace Sao Paulo");
        otherFranchise.setAgentId("mock-agent-mock-workspace-sp-01");
        otherFranchise.setAgentName("Assistente Osasco");
        otherFranchise.setStatus("ATIVA");
        franchiseRepository.save(otherFranchise);
        userRepository.save(new User(
            "Gestora Osasco",
            "osasco@vavive.com",
            passwordEncoder.encode("admin123"),
            UserRole.ADMIN_FRANQUIA,
            otherFranchise
        ));

        String created = mockMvc.perform(post("/conversations/test-agent")
                .header("Authorization", bearerToken("franquia@vavive.com", "admin123"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "prompt": "Quero saber mais sobre atendimento.",
                      "contextId": "cliente-ownership",
                      "customerName": "Cliente Ownership"
                    }
                    """))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();

        String conversationId = objectMapper.readTree(created).get("conversationId").asText();

        mockMvc.perform(get("/conversations/{id}/messages", conversationId)
                .header("Authorization", bearerToken("franquia@vavive.com", "admin123")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].text").value("Quero saber mais sobre atendimento."));

        mockMvc.perform(get("/conversations/{id}/messages", conversationId)
                .header("Authorization", bearerToken("osasco@vavive.com", "admin123")))
            .andExpect(status().isForbidden());

        mockMvc.perform(put("/conversations/{id}/start-human", conversationId)
                .header("Authorization", bearerToken("osasco@vavive.com", "admin123")))
            .andExpect(status().isForbidden());
    }

    @Test
    void vaviveDefaultContextUsesOnlyActiveDefaultTexts() {
        Franchise franchise = franchiseRepository.save(new Franchise("Vavive Contexto", "14.141.141/0001-14", "Sao Paulo", "SP", "ATIVA"));
        defaultAgentTextRepository.save(new DefaultAgentText(
            "Atendimento ativo",
            DefaultAgentTextCategory.REGRAS_ATENDIMENTO,
            "Texto ativo da matriz.",
            true
        ));
        defaultAgentTextRepository.save(new DefaultAgentText(
            "Atendimento inativo",
            DefaultAgentTextCategory.REGRAS_ATENDIMENTO,
            "Texto inativo da matriz.",
            false
        ));

        String context = defaultContextService.buildForFranchise(franchise);

        assertThat(context).contains("Franquia: Vavive Contexto - Sao Paulo/SP.");
        assertThat(context).contains("Texto ativo da matriz.");
        assertThat(context).doesNotContain("Texto inativo da matriz.");
    }

    private String bearerToken(String email, String password) throws Exception {
        String body = mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "email": "%s",
                      "password": "%s"
                    }
                    """.formatted(email, password)))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();

        JsonNode payload = objectMapper.readTree(body);
        return "Bearer " + payload.get("token").asText();
    }
}
