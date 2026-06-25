package br.com.vavive.gptmaker;

import br.com.vavive.gptmaker.domain.entity.Franchise;
import br.com.vavive.gptmaker.domain.entity.User;
import br.com.vavive.gptmaker.domain.enums.UserRole;
import br.com.vavive.gptmaker.repository.FranchiseRepository;
import br.com.vavive.gptmaker.repository.ScheduledServiceRequestRepository;
import br.com.vavive.gptmaker.repository.UserRepository;
import br.com.vavive.gptmaker.repository.WhatsAppNotificationContactRepository;
import br.com.vavive.gptmaker.repository.WhatsAppNotificationEventRepository;
import br.com.vavive.gptmaker.security.JwtService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class WhatsAppNotificationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private FranchiseRepository franchiseRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private WhatsAppNotificationContactRepository contactRepository;

    @Autowired
    private ScheduledServiceRequestRepository scheduledServiceRequestRepository;

    @Autowired
    private WhatsAppNotificationEventRepository eventRepository;

    private Franchise franchise;
    private User superAdmin;
    private User franchiseAdmin;

    @BeforeEach
    void setUp() {
        franchise = franchiseRepository.findAll().stream().findFirst().orElseGet(() -> {
            Franchise created = new Franchise("Vavive Moema", "12.345.678/0001-00", "Sao Paulo", "SP", "ATIVA");
            created.setWorkspaceId("mock-workspace-vavive");
            created.setWorkspaceName("Workspace Vavive");
            created.setAgentId("agent-external-123");
            created.setAgentName("Assistente Vavive");
            created.setStatus("ATIVA");
            return franchiseRepository.save(created);
        });
        franchise.setAgentId("agent-external-123");
        franchiseRepository.save(franchise);

        superAdmin = userRepository.findByEmailIgnoreCase("admin@vavive.com").orElseGet(() -> userRepository.save(new User(
            "Admin Vavive",
            "admin@vavive.com",
            passwordEncoder.encode("admin123"),
            UserRole.SUPER_ADMIN,
            null
        )));

        franchiseAdmin = userRepository.findByEmailIgnoreCase("franquia@vavive.com").orElseGet(() -> userRepository.save(new User(
            "Gestora da Franquia",
            "franquia@vavive.com",
            passwordEncoder.encode("admin123"),
            UserRole.ADMIN_FRANQUIA,
            franchise
        )));
    }

    @Test
    void superAdminCanManageWhatsAppNotificationContacts() throws Exception {
        String token = bearer(superAdmin);

        String body = objectMapper.writeValueAsString(Map.of(
            "name", "Operacao",
            "phone", "+55 (11) 99999-1234",
            "active", true
        ));

        String response = mockMvc.perform(post("/api/admin/franchises/{franchiseId}/whatsapp-notification-contacts", franchise.getId())
                .header("Authorization", token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Operacao"))
            .andExpect(jsonPath("$.phone").value("5511999991234"))
            .andReturn()
            .getResponse()
            .getContentAsString();

        String contactId = objectMapper.readTree(response).path("id").asText();

        mockMvc.perform(put("/api/admin/franchises/{franchiseId}/whatsapp-notification-contacts/{contactId}", franchise.getId(), contactId)
                .header("Authorization", token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "name", "Plantao",
                    "phone", "11988887777",
                    "active", false
                ))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Plantao"))
            .andExpect(jsonPath("$.active").value(false));

        mockMvc.perform(get("/api/admin/franchises/{franchiseId}/whatsapp-notification-contacts", franchise.getId())
                .header("Authorization", token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].franchiseId").value(franchise.getId().toString()));

        mockMvc.perform(delete("/api/admin/franchises/{franchiseId}/whatsapp-notification-contacts/{contactId}", franchise.getId(), contactId)
                .header("Authorization", token))
            .andExpect(status().isNoContent());

        assertThat(contactRepository.findByFranchiseIdOrderByNameAsc(franchise.getId())).hasSize(1);
        assertThat(contactRepository.findByFranchiseIdOrderByNameAsc(franchise.getId()).getFirst().isActive()).isFalse();
    }

    @Test
    void franchiseAdminCannotAccessGlobalWhatsAppNotificationConfig() throws Exception {
        mockMvc.perform(get("/api/admin/franchises/{franchiseId}/whatsapp-notification-contacts", franchise.getId())
                .header("Authorization", bearer(franchiseAdmin)))
            .andExpect(status().isForbidden());
    }

    @Test
    void webhookRegistersScheduledServiceAndCreatesDryRunEvents() throws Exception {
        contactRepository.save(new br.com.vavive.gptmaker.domain.entity.WhatsAppNotificationContact(franchise, "Operacao", "5511999991234", true));
        contactRepository.save(new br.com.vavive.gptmaker.domain.entity.WhatsAppNotificationContact(franchise, "Comercial", "551188887777", true));

        mockMvc.perform(post("/api/webhooks/vavive-agent/scheduled-service")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "customerName", "Maria Silva",
                    "customerPhone", "+55 11 97777-1111",
                    "requestedDateTime", "2026-06-24 14:00",
                    "serviceType", "Manutencao",
                    "plan", "Premium",
                    "duration", "2h",
                    "franchiseId", franchise.getId().toString(),
                    "agentExternalId", "agent-external-123"
                ))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.notifications.total").value(2))
            .andExpect(jsonPath("$.notifications.dryRun").value(2))
            .andExpect(jsonPath("$.scheduledRequestId").isNotEmpty());

        assertThat(scheduledServiceRequestRepository.findAll()).hasSize(1);
        assertThat(eventRepository.findAll()).hasSize(2);
        assertThat(scheduledServiceRequestRepository.findAll().getFirst().getStatus().name()).isEqualTo("NOTIFIED");
    }

    @Test
    void superAdminCanSendTestMessage() throws Exception {
        contactRepository.save(new br.com.vavive.gptmaker.domain.entity.WhatsAppNotificationContact(franchise, "Operacao", "5511999991234", true));

        mockMvc.perform(post("/api/admin/franchises/{franchiseId}/whatsapp-notification-contacts/test", franchise.getId())
                .header("Authorization", bearer(superAdmin))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("message", "Teste manual"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.total").value(1))
            .andExpect(jsonPath("$.dryRun").value(1))
            .andExpect(jsonPath("$.provider").value("dry-run"));
    }

    private String bearer(User user) {
        return "Bearer " + jwtService.generateToken(user);
    }
}
