package br.com.vavive.gptmaker;

import br.com.vavive.gptmaker.domain.entity.AssistantStandardBlock;
import br.com.vavive.gptmaker.domain.entity.FranchiseAssistantBlockConfig;
import br.com.vavive.gptmaker.domain.entity.Franchise;
import br.com.vavive.gptmaker.domain.entity.User;
import br.com.vavive.gptmaker.domain.enums.AssistantBlockMode;
import br.com.vavive.gptmaker.domain.enums.AssistantBlockType;
import br.com.vavive.gptmaker.domain.enums.UserRole;
import br.com.vavive.gptmaker.repository.AssistantStandardBlockRepository;
import br.com.vavive.gptmaker.repository.AssistantStandardProfileRepository;
import br.com.vavive.gptmaker.repository.FranchiseAssistantBlockConfigRepository;
import br.com.vavive.gptmaker.repository.FranchiseRepository;
import br.com.vavive.gptmaker.repository.UserRepository;
import br.com.vavive.gptmaker.security.JwtService;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AssistantStandardProfilePersistenceIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private AssistantStandardProfileRepository profileRepository;

    @Autowired
    private AssistantStandardBlockRepository blockRepository;

    @Autowired
    private FranchiseAssistantBlockConfigRepository blockConfigRepository;

    @Autowired
    private FranchiseRepository franchiseRepository;

    @BeforeEach
    void setUpAdmin() {
        if (userRepository.findByEmailIgnoreCase("admin@vavive.com").isEmpty()) {
            userRepository.save(new User(
                "Admin Vavive",
                "admin@vavive.com",
                passwordEncoder.encode("admin123"),
                UserRole.SUPER_ADMIN,
                null
            ));
        }
    }

    @Test
    void savesAssistantStandardBlockInDatabaseAndLoadsItBack() throws Exception {
        mockMvc.perform(get("/assistant-standards/profile")
                .header("Authorization", bearerToken("admin@vavive.com")))
            .andExpect(status().isOk());

        String payload = """
            {
              "payload": {
                "text": "Descricao persistida da matriz para recarregar a pagina sem voltar ao padrao antigo."
              }
            }
            """;

        mockMvc.perform(post("/assistant-standards/profile/blocks/BASE_DESCRIPTION")
                .header("Authorization", bearerToken("admin@vavive.com"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.blocks[?(@.blockType=='BASE_DESCRIPTION')].payload.text")
                .value("Descricao persistida da matriz para recarregar a pagina sem voltar ao padrao antigo."));

        AssistantStandardBlock persistedBlock = blockRepository.findByProfileAndBlockType(
                profileRepository.findFirstByActiveTrueOrderByUpdatedAtDesc().orElseThrow(),
                AssistantBlockType.BASE_DESCRIPTION
            )
            .orElseThrow();

        JsonNode persistedPayload = objectMapper.readTree(persistedBlock.getPayloadJson());
        assertThat(persistedPayload.path("text").asText())
            .isEqualTo("Descricao persistida da matriz para recarregar a pagina sem voltar ao padrao antigo.");

        mockMvc.perform(get("/assistant-standards/profile")
                .header("Authorization", bearerToken("admin@vavive.com")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.blocks[?(@.blockType=='BASE_DESCRIPTION')].payload.text")
                .value("Descricao persistida da matriz para recarregar a pagina sem voltar ao padrao antigo."));
    }

    @Test
    void franchiseAssistantConfigurationInheritsAllStandardBlocksForNewAgentFlow() throws Exception {
        Franchise franchise = franchiseRepository.save(new Franchise("Vavive Moema", "11.111.111/0001-11", "Sao Paulo", "SP", "ATIVA"));
        if (userRepository.findByEmailIgnoreCase("franquia@vavive.com").isEmpty()) {
            userRepository.save(new User(
                "Gestora Moema",
                "franquia@vavive.com",
                passwordEncoder.encode("admin123"),
                UserRole.ADMIN_FRANQUIA,
                franchise
            ));
        }

        mockMvc.perform(post("/assistant-standards/profile/blocks/ROLE")
                .header("Authorization", bearerToken("admin@vavive.com"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "payload": {
                        "assistantName": "Assistente Padrao Matriz",
                        "jobName": "Consultor Vavive Matriz",
                        "communicationType": "FORMAL",
                        "type": "SUPPORT",
                        "jobSite": "https://matriz.example.com",
                        "description": "Descricao de perfil definida pela matriz"
                      }
                    }
                    """))
            .andExpect(status().isOk());

        mockMvc.perform(post("/assistant-standards/profile/blocks/BEHAVIOR")
                .header("Authorization", bearerToken("admin@vavive.com"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "payload": {
                        "instruction": "Comportamento padrao completo da matriz",
                        "summary": "Resumo matriz"
                      }
                    }
                    """))
            .andExpect(status().isOk());

        mockMvc.perform(post("/assistant-standards/profile/blocks/BASE_DESCRIPTION")
                .header("Authorization", bearerToken("admin@vavive.com"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "payload": {
                        "text": "Descricao base completa da matriz"
                      }
                    }
                    """))
            .andExpect(status().isOk());

        mockMvc.perform(post("/assistant-standards/profile/blocks/TRAININGS")
                .header("Authorization", bearerToken("admin@vavive.com"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "payload": {
                        "items": [
                          {
                            "type": "TEXT",
                            "title": "Treinamento comercial",
                            "content": "Script padrao da matriz",
                            "text": "Script padrao da matriz"
                          }
                        ]
                      }
                    }
                    """))
            .andExpect(status().isOk());

        mockMvc.perform(post("/assistant-standards/profile/blocks/INTENTIONS")
                .header("Authorization", bearerToken("admin@vavive.com"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "payload": {
                        "items": [
                          {
                            "name": "agendar-visita",
                            "description": "Agendar visita",
                            "instructions": "Coletar dados e levar para fechamento."
                          }
                        ]
                      }
                    }
                    """))
            .andExpect(status().isOk());

        mockMvc.perform(post("/assistant-standards/profile/blocks/AGENT_SETTINGS")
                .header("Authorization", bearerToken("admin@vavive.com"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "payload": {
                        "prefferModel": "GPT_5",
                        "timezone": "America/Sao_Paulo",
                        "enabledHumanTransfer": true,
                        "enabledReminder": true,
                        "splitMessages": true,
                        "enabledEmoji": true,
                        "signMessages": true,
                        "limitSubjects": true,
                        "messageGroupingTime": "TEN_SEC",
                        "maxDailyMessages": 50,
                        "maxDailyMessagesLimitAction": "TRANSFER",
                        "webhooks": {
                          "onNewMessage": "https://example.com/webhook"
                        }
                      }
                    }
                    """))
            .andExpect(status().isOk());

        mockMvc.perform(post("/assistant-standards/profile/blocks/IDLE_ACTIONS")
                .header("Authorization", bearerToken("admin@vavive.com"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "payload": {
                        "items": [
                          {
                            "type": "FINISH_INTERACTION",
                            "seconds": 900,
                            "instructions": "Encerrar com mensagem padrao da matriz"
                          }
                        ]
                      }
                    }
                    """))
            .andExpect(status().isOk());

        mockMvc.perform(post("/assistant-standards/profile/blocks/TRANSFER_RULES")
                .header("Authorization", bearerToken("admin@vavive.com"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "payload": {
                        "items": [
                          {
                            "type": "HUMAN",
                            "instructions": "Transferir para humano conforme regra da matriz",
                            "returnOnFinish": true
                          }
                        ]
                      }
                    }
                    """))
            .andExpect(status().isOk());

        FranchiseAssistantBlockConfig staleCustomTraining = new FranchiseAssistantBlockConfig(franchise, AssistantBlockType.TRAININGS, AssistantBlockMode.CUSTOM);
        staleCustomTraining.setCustomPayloadJson("{\"items\":[]}");
        staleCustomTraining.setStandardVersionApplied(1);
        blockConfigRepository.save(staleCustomTraining);

        FranchiseAssistantBlockConfig staleCustomIntention = new FranchiseAssistantBlockConfig(franchise, AssistantBlockType.INTENTIONS, AssistantBlockMode.CUSTOM);
        staleCustomIntention.setCustomPayloadJson("{\"items\":[]}");
        staleCustomIntention.setStandardVersionApplied(1);
        blockConfigRepository.save(staleCustomIntention);

        mockMvc.perform(get("/franchises/{id}/assistant-configuration", franchise.getId())
                .header("Authorization", bearerToken("admin@vavive.com")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.blocks[?(@.blockType=='ROLE')].payload.assistantName").value("Assistente Padrao Matriz"))
            .andExpect(jsonPath("$.blocks[?(@.blockType=='ROLE')].payload.jobName").value("Consultor Vavive Matriz"))
            .andExpect(jsonPath("$.blocks[?(@.blockType=='ROLE')].payload.communicationType").value("FORMAL"))
            .andExpect(jsonPath("$.blocks[?(@.blockType=='ROLE')].payload.type").value("SUPPORT"))
            .andExpect(jsonPath("$.blocks[?(@.blockType=='BEHAVIOR')].payload.instruction").value("Comportamento padrao completo da matriz"))
            .andExpect(jsonPath("$.blocks[?(@.blockType=='BASE_DESCRIPTION')].payload.text").value("Descricao base completa da matriz"))
            .andExpect(jsonPath("$.blocks[?(@.blockType=='TRAININGS')].payload.items[0].text").value("Script padrao da matriz"))
            .andExpect(jsonPath("$.blocks[?(@.blockType=='INTENTIONS')].payload.items[0].description").value("Agendar visita"))
            .andExpect(jsonPath("$.blocks[?(@.blockType=='AGENT_SETTINGS')].payload.prefferModel").value("GPT_5"))
            .andExpect(jsonPath("$.blocks[?(@.blockType=='AGENT_SETTINGS')].payload.enabledEmoji").value(true))
            .andExpect(jsonPath("$.blocks[?(@.blockType=='AGENT_SETTINGS')].payload.webhooks.onNewMessage").value("https://example.com/webhook"))
            .andExpect(jsonPath("$.blocks[?(@.blockType=='IDLE_ACTIONS')].payload.items[0].instructions").value("Encerrar com mensagem padrao da matriz"))
            .andExpect(jsonPath("$.blocks[?(@.blockType=='TRANSFER_RULES')].payload.items[0].instructions").value("Transferir para humano conforme regra da matriz"));

        mockMvc.perform(get("/franchises/{id}/assistant-configuration", franchise.getId())
                .header("Authorization", bearerToken("franquia@vavive.com")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.blocks[?(@.blockType=='ROLE')].payload.assistantName").value("Assistente Padrao Matriz"))
            .andExpect(jsonPath("$.blocks[?(@.blockType=='TRAININGS')].payload.items[0].text").value("Script padrao da matriz"))
            .andExpect(jsonPath("$.blocks[?(@.blockType=='INTENTIONS')].payload.items[0].description").value("Agendar visita"))
            .andExpect(jsonPath("$.blocks[?(@.blockType=='AGENT_SETTINGS')].payload.prefferModel").value("GPT_5"))
            .andExpect(jsonPath("$.blocks[?(@.blockType=='IDLE_ACTIONS')].payload.items[0].instructions").value("Encerrar com mensagem padrao da matriz"))
            .andExpect(jsonPath("$.blocks[?(@.blockType=='TRANSFER_RULES')].payload.items[0].instructions").value("Transferir para humano conforme regra da matriz"));
    }

    private String bearerToken(String email) {
        User user = userRepository.findByEmailIgnoreCase(email).orElseThrow();
        return "Bearer " + jwtService.generateToken(user);
    }
}
