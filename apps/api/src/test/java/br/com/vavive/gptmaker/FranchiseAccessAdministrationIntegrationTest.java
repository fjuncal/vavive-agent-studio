package br.com.vavive.gptmaker;

import br.com.vavive.gptmaker.domain.entity.Franchise;
import br.com.vavive.gptmaker.domain.entity.GptMakerAgent;
import br.com.vavive.gptmaker.domain.entity.User;
import br.com.vavive.gptmaker.domain.enums.FranchiseAccessStatus;
import br.com.vavive.gptmaker.domain.enums.UserRole;
import br.com.vavive.gptmaker.repository.GptMakerAgentRepository;
import br.com.vavive.gptmaker.repository.FranchiseRepository;
import br.com.vavive.gptmaker.repository.UserRepository;
import br.com.vavive.gptmaker.security.JwtService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
    "gptmaker.mock-enabled=true",
    "spring.flyway.enabled=false"
})
@AutoConfigureMockMvc
@Transactional
class FranchiseAccessAdministrationIntegrationTest {
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
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Test
    void superAdminChangesAdminEmailAndResponseContainsNoPassword() throws Exception {
        Franchise franchise = createFranchise();
        User admin = createAdmin(franchise, uniqueEmail("email"));

        mockMvc.perform(patch("/franchises/{franchiseId}/users/{userId}/email", franchise.getId(), admin.getId())
                .header("Authorization", superAdminToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"  NEW-EMAIL@EXAMPLE.COM  \"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("new-email@example.com"))
            .andExpect(jsonPath("$.role").value("ADMIN_FRANQUIA"))
            .andExpect(jsonPath("$.password").doesNotExist())
            .andExpect(jsonPath("$.passwordHash").doesNotExist());

        User updated = userRepository.findById(admin.getId()).orElseThrow();
        assertThat(updated.getEmail()).isEqualTo("new-email@example.com");
        assertThat(updated.getName()).isEqualTo(admin.getName());
        assertThat(updated.getRole()).isEqualTo(UserRole.ADMIN_FRANQUIA);
        assertThat(updated.getFranchise().getId()).isEqualTo(franchise.getId());
    }

    @Test
    void adminFranquiaCannotChangeAdminEmail() throws Exception {
        Franchise franchise = createFranchise();
        User admin = createAdmin(franchise, uniqueEmail("own"));

        mockMvc.perform(patch("/franchises/{franchiseId}/users/{userId}/email", franchise.getId(), admin.getId())
                .header("Authorization", bearer(admin))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"blocked@example.com\"}"))
            .andExpect(status().isForbidden());
    }

    @Test
    void invalidAdminEmailIsRejected() throws Exception {
        Franchise franchise = createFranchise();
        User admin = createAdmin(franchise, uniqueEmail("invalid"));

        mockMvc.perform(patch("/franchises/{franchiseId}/users/{userId}/email", franchise.getId(), admin.getId())
                .header("Authorization", superAdminToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"not-an-email\"}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void duplicateAdminEmailIsRejected() throws Exception {
        Franchise franchise = createFranchise();
        User target = createAdmin(franchise, uniqueEmail("target"));
        User other = createAdmin(createFranchise(), uniqueEmail("other"));

        mockMvc.perform(patch("/franchises/{franchiseId}/users/{userId}/email", franchise.getId(), target.getId())
                .header("Authorization", superAdminToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + other.getEmail() + "\"}"))
            .andExpect(status().isConflict());
    }

    @Test
    void adminUserFromAnotherFranchiseIsRejected() throws Exception {
        Franchise franchise = createFranchise();
        User foreignAdmin = createAdmin(createFranchise(), uniqueEmail("foreign"));

        mockMvc.perform(patch("/franchises/{franchiseId}/users/{userId}/email", franchise.getId(), foreignAdmin.getId())
                .header("Authorization", superAdminToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"new@example.com\"}"))
            .andExpect(status().isNotFound());
    }

    @Test
    void superAdminResetsPasswordUsingEncoderAndNeverReturnsIt() throws Exception {
        Franchise franchise = createFranchise();
        User admin = createAdmin(franchise, uniqueEmail("reset"));
        String oldHash = admin.getPasswordHash();

        mockMvc.perform(put("/franchises/{franchiseId}/users/{userId}/password", franchise.getId(), admin.getId())
                .header("Authorization", superAdminToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"newPassword\":\"NovaSenha123\",\"confirmPassword\":\"NovaSenha123\"}"))
            .andExpect(status().isNoContent())
            .andExpect(content().string(""));

        User updated = userRepository.findById(admin.getId()).orElseThrow();
        assertThat(updated.getPasswordHash()).isNotEqualTo(oldHash);
        assertThat(passwordEncoder.matches("NovaSenha123", updated.getPasswordHash())).isTrue();
        assertThat(updated.getPasswordHash()).doesNotContain("NovaSenha123");
    }

    @Test
    void passwordPolicyRejectsWeakResetPassword() throws Exception {
        Franchise franchise = createFranchise();
        User admin = createAdmin(franchise, uniqueEmail("weak"));

        mockMvc.perform(put("/franchises/{franchiseId}/users/{userId}/password", franchise.getId(), admin.getId())
                .header("Authorization", superAdminToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"newPassword\":\"weakpass\",\"confirmPassword\":\"weakpass\"}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void passwordConfirmationIsRequired() throws Exception {
        Franchise franchise = createFranchise();
        User admin = createAdmin(franchise, uniqueEmail("confirm"));

        mockMvc.perform(put("/franchises/{franchiseId}/users/{userId}/password", franchise.getId(), admin.getId())
                .header("Authorization", superAdminToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"newPassword\":\"NovaSenha123\",\"confirmPassword\":\"OutraSenha123\"}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void adminFranquiaCannotResetPassword() throws Exception {
        Franchise franchise = createFranchise();
        User admin = createAdmin(franchise, uniqueEmail("blocked-reset"));

        mockMvc.perform(put("/franchises/{franchiseId}/users/{userId}/password", franchise.getId(), admin.getId())
                .header("Authorization", bearer(admin))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"newPassword\":\"NovaSenha123\",\"confirmPassword\":\"NovaSenha123\"}"))
            .andExpect(status().isForbidden());
    }

    @Test
    void superAdminInactivatesFranchiseWithoutTouchingOperationalLinks() throws Exception {
        Franchise franchise = createFranchise();
        User admin = createAdmin(franchise, uniqueEmail("inactive"));
        GptMakerAgent agent = createAgent(franchise);
        String workspaceId = franchise.getWorkspaceId();
        String agentId = franchise.getAgentId();
        String legacyStatus = franchise.getStatus();

        mockMvc.perform(patch("/franchises/{id}/access-status", franchise.getId())
                .header("Authorization", superAdminToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"INACTIVE\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessStatus").value("INACTIVE"));

        Franchise persisted = franchiseRepository.findById(franchise.getId()).orElseThrow();
        assertThat(persisted.getAccessStatus()).isEqualTo(FranchiseAccessStatus.INACTIVE);
        assertThat(persisted.getWorkspaceId()).isEqualTo(workspaceId);
        assertThat(persisted.getAgentId()).isEqualTo(agentId);
        assertThat(persisted.getStatus()).isEqualTo(legacyStatus);
        assertThat(userRepository.findById(admin.getId())).isPresent();
        assertThat(agentRepository.findById(agent.getId())).isPresent();
    }

    @Test
    void adminFranquiaCannotInactivateFranchise() throws Exception {
        Franchise franchise = createFranchise();
        User admin = createAdmin(franchise, uniqueEmail("blocked-status"));

        mockMvc.perform(patch("/franchises/{id}/access-status", franchise.getId())
                .header("Authorization", bearer(admin))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"INACTIVE\"}"))
            .andExpect(status().isForbidden());

        assertThat(franchiseRepository.findById(franchise.getId()).orElseThrow().getAccessStatus())
            .isEqualTo(FranchiseAccessStatus.ACTIVE);
    }

    @Test
    void inactiveFranchiseAndItsUsersRemainInDatabase() throws Exception {
        Franchise franchise = createFranchise();
        User firstAdmin = createAdmin(franchise, uniqueEmail("keep-one"));
        User secondAdmin = createAdmin(franchise, uniqueEmail("keep-two"));
        GptMakerAgent agent = createAgent(franchise);

        inactivate(franchise);

        assertThat(franchiseRepository.findById(franchise.getId())).isPresent();
        assertThat(userRepository.findById(firstAdmin.getId())).isPresent();
        assertThat(userRepository.findById(secondAdmin.getId())).isPresent();
        assertThat(agentRepository.findById(agent.getId())).isPresent();
    }

    @Test
    void inactiveFranchiseBlocksAdminLoginWithSafeMessage() throws Exception {
        Franchise franchise = createFranchise();
        User admin = createAdmin(franchise, uniqueEmail("login-blocked"));
        inactivate(franchise);

        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + admin.getEmail() + "\",\"password\":\"Franqueado123\"}"))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.code").value("FRANCHISE_INACTIVE"))
            .andExpect(jsonPath("$.message").value("Esta franquia está inativa."));
    }

    @Test
    void alreadyIssuedAdminJwtIsBlockedAfterInactivation() throws Exception {
        Franchise franchise = createFranchise();
        User admin = createAdmin(franchise, uniqueEmail("jwt-blocked"));
        String token = bearer(admin);
        inactivate(franchise);

        mockMvc.perform(get("/me").header("Authorization", token))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.code").value("FRANCHISE_INACTIVE"))
            .andExpect(jsonPath("$.message").value("Esta franquia está inativa."));
    }

    @Test
    void superAdminCanAccessInactiveFranchise() throws Exception {
        Franchise franchise = createFranchise();
        inactivate(franchise);

        mockMvc.perform(get("/franchises/{id}", franchise.getId())
                .header("Authorization", superAdminToken()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(franchise.getId().toString()))
            .andExpect(jsonPath("$.accessStatus").value("INACTIVE"));
    }

    @Test
    void superAdminReactivatesFranchise() throws Exception {
        Franchise franchise = createFranchise();
        inactivate(franchise);

        mockMvc.perform(patch("/franchises/{id}/access-status", franchise.getId())
                .header("Authorization", superAdminToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"ACTIVE\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessStatus").value("ACTIVE"));

        assertThat(franchiseRepository.findById(franchise.getId()).orElseThrow().isAccessActive()).isTrue();
    }

    @Test
    void adminCanLoginAgainAfterReactivation() throws Exception {
        Franchise franchise = createFranchise();
        User admin = createAdmin(franchise, uniqueEmail("login-again"));
        inactivate(franchise);

        mockMvc.perform(patch("/franchises/{id}/access-status", franchise.getId())
                .header("Authorization", superAdminToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"ACTIVE\"}"))
            .andExpect(status().isOk());

        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + admin.getEmail() + "\",\"password\":\"Franqueado123\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.user.role").value("ADMIN_FRANQUIA"))
            .andExpect(jsonPath("$.user.franchise.accessStatus").value("ACTIVE"));
    }

    @Test
    void multipleAdminUsersCanBeListedForOneFranchise() throws Exception {
        Franchise franchise = createFranchise();
        User first = createAdmin(franchise, uniqueEmail("multiple-one"));
        User second = createAdmin(franchise, uniqueEmail("multiple-two"));

        mockMvc.perform(get("/franchises/{id}/admin-users", franchise.getId())
                .header("Authorization", superAdminToken()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(first.getId().toString()))
            .andExpect(jsonPath("$[1].id").value(second.getId().toString()))
            .andExpect(jsonPath("$[0].passwordHash").doesNotExist())
            .andExpect(jsonPath("$[1].password").doesNotExist());
    }

    @Test
    void adminFranquiaCannotListAdministrativeUsers() throws Exception {
        Franchise franchise = createFranchise();
        User admin = createAdmin(franchise, uniqueEmail("list-blocked"));

        mockMvc.perform(get("/franchises/{id}/admin-users", franchise.getId())
                .header("Authorization", bearer(admin)))
            .andExpect(status().isForbidden());
    }

    @Test
    void repeatedAccessStatusTransitionReturnsConflict() throws Exception {
        Franchise franchise = createFranchise();

        mockMvc.perform(patch("/franchises/{id}/access-status", franchise.getId())
                .header("Authorization", superAdminToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"ACTIVE\"}"))
            .andExpect(status().isConflict());
    }

    @Test
    void newFranchisesDefaultToActiveAccessStatus() {
        Franchise franchise = new Franchise("Franquia nova", "1", "Sao Paulo", "SP", "PENDENTE_CONFIGURACAO");

        assertThat(franchise.getAccessStatus()).isEqualTo(FranchiseAccessStatus.ACTIVE);
    }

    private Franchise createFranchise() {
        String suffix = UUID.randomUUID().toString();
        Franchise franchise = new Franchise("Franquia de teste " + suffix, "DOC-" + suffix, "Sao Paulo", "SP", "ATIVA");
        franchise.setWorkspaceId("workspace-" + suffix);
        franchise.setWorkspaceName("Workspace de teste");
        franchise.setAgentId("agent-" + suffix);
        franchise.setAgentName("Assistente de teste");
        return franchiseRepository.save(franchise);
    }

    private User createAdmin(Franchise franchise, String email) {
        return userRepository.save(new User(
            "Administrador de teste",
            email,
            passwordEncoder.encode("Franqueado123"),
            UserRole.ADMIN_FRANQUIA,
            franchise
        ));
    }

    private GptMakerAgent createAgent(Franchise franchise) {
        return agentRepository.save(new GptMakerAgent(
            franchise.getAgentId(),
            franchise.getAgentName(),
            "ATIVO",
            "Consultivo",
            franchise
        ));
    }

    private void inactivate(Franchise franchise) {
        franchise.setAccessStatus(FranchiseAccessStatus.INACTIVE);
        franchiseRepository.save(franchise);
    }

    private String superAdminToken() {
        User superAdmin = userRepository.findByEmailIgnoreCase("admin@vavive.com")
            .orElseGet(() -> userRepository.save(new User(
                "Admin Vavive",
                "admin@vavive.com",
                passwordEncoder.encode("admin123"),
                UserRole.SUPER_ADMIN,
                null
            )));
        return bearer(superAdmin);
    }

    private String bearer(User user) {
        return "Bearer " + jwtService.generateToken(user);
    }

    private String uniqueEmail(String prefix) {
        return prefix + "-" + UUID.randomUUID() + "@example.com";
    }
}
