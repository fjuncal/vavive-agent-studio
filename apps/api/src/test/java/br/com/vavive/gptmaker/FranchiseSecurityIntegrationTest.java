package br.com.vavive.gptmaker;

import br.com.vavive.gptmaker.domain.entity.DefaultAgentText;
import br.com.vavive.gptmaker.domain.entity.Franchise;
import br.com.vavive.gptmaker.domain.entity.GptMakerAgent;
import br.com.vavive.gptmaker.domain.entity.User;
import br.com.vavive.gptmaker.domain.enums.DefaultAgentTextCategory;
import br.com.vavive.gptmaker.domain.enums.UserRole;
import br.com.vavive.gptmaker.repository.AgentTrainingRepository;
import br.com.vavive.gptmaker.repository.DefaultAgentTextRepository;
import br.com.vavive.gptmaker.repository.FranchiseRepository;
import br.com.vavive.gptmaker.repository.GptMakerAgentRepository;
import br.com.vavive.gptmaker.repository.UserRepository;
import br.com.vavive.gptmaker.security.JwtService;
import br.com.vavive.gptmaker.service.VaviveDefaultContextService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
    private DefaultAgentTextRepository defaultAgentTextRepository;

    @Autowired
    private VaviveDefaultContextService defaultContextService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

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
            .andExpect(jsonPath("$.franchise.name").value("Vavive Vila Mariana"));
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

        assertThat(agentRepository.findByFranchiseId(franchise.getId())).hasSize(1);
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
                      "workspaceId": "mock-workspace-vavive",
                      "agentId": "mock-agent-mock-workspace-vavive-01"
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.workspaceId").value("mock-workspace-vavive"))
            .andExpect(jsonPath("$.workspaceName").value("Workspace Vavive Demo"))
            .andExpect(jsonPath("$.agentId").value("mock-agent-mock-workspace-vavive-01"))
            .andExpect(jsonPath("$.agentName").value("Assistente Comercial"))
            .andExpect(jsonPath("$.status").value("CONECTADO"));

        Franchise updated = franchiseRepository.findById(franchise.getId()).orElseThrow();
        assertThat(updated.getWorkspaceId()).isEqualTo("mock-workspace-vavive");
        assertThat(updated.getAgentId()).isEqualTo("mock-agent-mock-workspace-vavive-01");
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
                      "workspaceId": "mock-workspace-vavive"
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.workspaceId").value("mock-workspace-vavive"))
            .andExpect(jsonPath("$.workspaceName").value("Workspace Vavive Demo"))
            .andExpect(jsonPath("$.agentId").doesNotExist());
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
            .andExpect(jsonPath("$.agentId").doesNotExist());
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
            .andExpect(jsonPath("$.agentId").doesNotExist());
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
                      "workspaceId": "mock-workspace-sp"
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.workspaceId").value("mock-workspace-sp"))
            .andExpect(jsonPath("$.agentId").doesNotExist())
            .andExpect(jsonPath("$.agentName").doesNotExist());

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
