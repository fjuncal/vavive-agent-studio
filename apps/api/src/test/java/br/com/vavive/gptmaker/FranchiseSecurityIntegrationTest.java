package br.com.vavive.gptmaker;

import br.com.vavive.gptmaker.domain.entity.Franchise;
import br.com.vavive.gptmaker.domain.entity.User;
import br.com.vavive.gptmaker.domain.enums.UserRole;
import br.com.vavive.gptmaker.repository.AgentTrainingRepository;
import br.com.vavive.gptmaker.repository.FranchiseRepository;
import br.com.vavive.gptmaker.repository.GptMakerAgentRepository;
import br.com.vavive.gptmaker.repository.UserRepository;
import br.com.vavive.gptmaker.security.JwtService;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Test
    void superAdminCreatesFranchiseAdminUser() throws Exception {
        Franchise franchise = franchiseRepository.save(new Franchise("Vavive Moema", "11.111.111/0001-11", "Sao Paulo", "SP", "ATIVA"));

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
