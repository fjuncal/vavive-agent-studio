package br.com.vavive.gptmaker.integration.gptmaker;

import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerCreateIntentRequest;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerCreateIntentResponse;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerCreateAgentRequest;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerCreateTrainingRequest;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerCreateTrainingResponse;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerAgentResponse;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerWorkspaceResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.*;

class GptMakerClientTest {

    @Test
    void sendTrainingReturnsMockSuccessWhenMockEnabled() {
        TrackingFeignClient feignClient = new TrackingFeignClient();
        GptMakerClient client = new GptMakerClient(
            new GptMakerProperties("https://api.gptmaker.ai", "", true),
            feignClient,
            new ObjectMapper()
        );

        GptMakerSyncResult result = client.sendTraining("agent-123", "Treinamento", "Conteudo");

        assertTrue(result.success());
        assertEquals("PUBLICADO_GPTMAKER_MOCK", result.status());
        assertTrue(result.mockEnabled());
        assertFalse(feignClient.trainingCalled);
    }

    @Test
    void sendIntentReturnsMockSuccessWhenMockEnabled() {
        TrackingFeignClient feignClient = new TrackingFeignClient();
        GptMakerClient client = new GptMakerClient(
            new GptMakerProperties("https://api.gptmaker.ai", "", true),
            feignClient,
            new ObjectMapper()
        );

        GptMakerSyncResult result = client.sendIntent("agent-123", "Preco", "Perguntas de preco", "Explique a politica de preco");

        assertTrue(result.success());
        assertEquals("ENVIADO_GPTMAKER_MOCK", result.status());
        assertTrue(result.mockEnabled());
        assertFalse(feignClient.intentCalled);
    }

    @Test
    void sendTrainingReturnsFriendlyErrorWhenTokenMissingInRealMode() {
        TrackingFeignClient feignClient = new TrackingFeignClient();
        GptMakerClient client = new GptMakerClient(
            new GptMakerProperties("https://api.gptmaker.ai", "", false),
            feignClient,
            new ObjectMapper()
        );

        GptMakerSyncResult result = client.sendTraining("agent-123", "Treinamento", "Conteudo");

        assertFalse(result.success());
        assertEquals("PUBLICACAO_FALHOU", result.status());
        assertEquals("MISSING_TOKEN", result.errorCode());
        assertEquals("Token da API GPTMaker nao configurado no backend.", result.message());
        assertFalse(feignClient.trainingCalled);
    }

    @Test
    void healthReturnsMockWhenMockEnabled() {
        GptMakerClient client = new GptMakerClient(
            new GptMakerProperties("https://api.gptmaker.ai", "", true),
            new TrackingFeignClient(),
            new ObjectMapper()
        );

        var health = client.health();

        assertEquals("MOCK", health.status());
        assertTrue(health.mockEnabled());
        assertFalse(health.tokenConfigured());
    }

    @Test
    void healthReturnsMissingTokenWhenRealModeWithoutToken() {
        GptMakerClient client = new GptMakerClient(
            new GptMakerProperties("https://api.gptmaker.ai", "", false),
            new TrackingFeignClient(),
            new ObjectMapper()
        );

        var health = client.health();

        assertEquals("MISSING_TOKEN", health.status());
        assertFalse(health.mockEnabled());
        assertFalse(health.tokenConfigured());
    }

    @Test
    void healthReturnsReadyWhenRealModeWithToken() {
        GptMakerClient client = new GptMakerClient(
            new GptMakerProperties("https://api.gptmaker.ai", "token-123", false),
            new TrackingFeignClient(),
            new ObjectMapper()
        );

        var health = client.health();

        assertEquals("READY", health.status());
        assertFalse(health.mockEnabled());
        assertTrue(health.tokenConfigured());
    }

    @Test
    void healthDoesNotExposeConfiguredToken() {
        GptMakerClient client = new GptMakerClient(
            new GptMakerProperties("https://api.gptmaker.ai", "token-123", false),
            new TrackingFeignClient(),
            new ObjectMapper()
        );

        var health = client.health();

        assertFalse(health.message().contains("token-123"));
        assertFalse(health.baseUrl().contains("token-123"));
    }

    @Test
    void diagnosticsReturnsConnectedWhenRealModeListsWorkspaces() {
        TrackingFeignClient feignClient = new TrackingFeignClient();
        ObjectMapper objectMapper = new ObjectMapper();
        feignClient.workspacePayload = """
            [
              {
                "id": "ws-1",
                "name": "Workspace 1"
              }
            ]
            """;

        GptMakerClient client = new GptMakerClient(
            new GptMakerProperties("https://api.gptmaker.ai", "token-123", false),
            feignClient,
            objectMapper
        );

        var diagnostics = client.diagnostics();

        assertEquals("CONNECTED", diagnostics.status());
        assertEquals(1, diagnostics.workspaceCount());
        assertEquals("Workspaces retornados: Workspace 1", diagnostics.details());
    }

    @Test
    void createAgentReturnsMockAgentWhenMockEnabled() {
        TrackingFeignClient feignClient = new TrackingFeignClient();
        GptMakerClient client = new GptMakerClient(
            new GptMakerProperties("https://api.gptmaker.ai", "", true),
            feignClient,
            new ObjectMapper()
        );

        var response = client.createAgent(
            "ws-1",
            new GptMakerCreateAgentRequest("Assistente Vavive", null, "Contexto", "NORMAL", "SALE", "Vavive", "https://vavive.com.br", "Descricao")
        );

        assertEquals("mock-agent-created-ws-1", response.id());
        assertEquals("Assistente Vavive", response.name());
        assertFalse(feignClient.createAgentCalled);
    }

    @Test
    void createAgentParsesWrappedPayloadAndCapturesRequest() {
        TrackingFeignClient feignClient = new TrackingFeignClient();
        ObjectMapper objectMapper = new ObjectMapper();
        feignClient.createAgentPayload = """
            {
              "data": {
                "id": "agent-created-1",
                "name": "Assistente Vavive - Moema",
                "behavior": "Contexto base",
                "communicationType": "NORMAL",
                "type": "SALE",
                "jobName": "Vavive",
                "jobSite": "https://vavive.com.br",
                "jobDescription": "Descricao"
              }
            }
            """;

        GptMakerClient client = new GptMakerClient(
            new GptMakerProperties("https://api.gptmaker.ai", "token-123", false),
            feignClient,
            objectMapper
        );

        var response = client.createAgent(
            "ws-1",
            new GptMakerCreateAgentRequest("Assistente Vavive - Moema", null, "Contexto base", "NORMAL", "SALE", "Vavive", "https://vavive.com.br", "Descricao")
        );

        assertTrue(feignClient.createAgentCalled);
        assertEquals("ws-1", feignClient.lastCreateAgentWorkspaceId);
        assertNotNull(feignClient.lastCreateAgentRequest);
        assertEquals("Assistente Vavive - Moema", feignClient.lastCreateAgentRequest.name());
        assertEquals("NORMAL", feignClient.lastCreateAgentRequest.communicationType());
        assertEquals("SALE", feignClient.lastCreateAgentRequest.type());
        assertEquals("agent-created-1", response.id());
        assertEquals("Assistente Vavive - Moema", response.name());
    }

    @Test
    void listWorkspacesAcceptsWrappedDataPayload() {
        TrackingFeignClient feignClient = new TrackingFeignClient();
        ObjectMapper objectMapper = new ObjectMapper();
        feignClient.workspacePayload = """
            {
              "data": [
                {
                  "id": "ws-1",
                  "name": "Workspace 1"
                }
              ]
            }
            """;

        GptMakerClient client = new GptMakerClient(
            new GptMakerProperties("https://api.gptmaker.ai", "token-123", false),
            feignClient,
            objectMapper
        );

        var workspaces = client.listWorkspaces();

        assertEquals(1, workspaces.size());
        assertEquals("ws-1", workspaces.getFirst().id());
    }

    @Test
    void listWorkspacesAcceptsRealApiPayloadWithExtraFields() throws Exception {
        TrackingFeignClient feignClient = new TrackingFeignClient();
        ObjectMapper objectMapper = new ObjectMapper();
        String payload = """
            [
              {
                "id": "3F48D32050D9013A41CA5ADF0F36FA2F",
                "tenant": "3F48D2FF0E98914C027FF682BC242D5D",
                "tenantOwner": "GPT_MAKER",
                "createdAt": 1781299515024,
                "updatedAt": null,
                "name": "teste",
                "trialZapiUsage": false
              },
              {
                "id": "3F48D2FF12B74038F57EF682BC242D5D",
                "tenant": "3F48D2FF0E98914C027FF682BC242D5D",
                "tenantOwner": "GPT_MAKER",
                "createdAt": 1781299459252,
                "updatedAt": null,
                "name": "Meu Workspace",
                "trialZapiUsage": false
              }
            ]
            """;
        feignClient.workspacePayload = payload;

        GptMakerClient client = new GptMakerClient(
            new GptMakerProperties("https://api.gptmaker.ai", "token-123", false),
            feignClient,
            objectMapper
        );

        var workspaces = client.listWorkspaces();

        assertEquals(2, workspaces.size());
        assertEquals("teste", workspaces.get(0).name());
        assertEquals("Meu Workspace", workspaces.get(1).name());
    }

    @Test
    void listAgentsAcceptsWrappedItemsPayload() {
        TrackingFeignClient feignClient = new TrackingFeignClient();
        ObjectMapper objectMapper = new ObjectMapper();
        feignClient.agentPayload = """
            {
              "items": [
                {
                  "id": "agent-1",
                  "name": "Agente 1",
                  "behavior": "NORMAL",
                  "communicationType": "FORMAL",
                  "type": "SALE"
                }
              ]
            }
            """;

        GptMakerClient client = new GptMakerClient(
            new GptMakerProperties("https://api.gptmaker.ai", "token-123", false),
            feignClient,
            objectMapper
        );

        var agents = client.listAgents("ws-1");

        assertEquals(1, agents.size());
        assertEquals("FORMAL", agents.getFirst().communicationType());
        assertEquals("SALE", agents.getFirst().type());
    }

    @Test
    void listAgentsAcceptsDirectArrayPayload() {
        TrackingFeignClient feignClient = new TrackingFeignClient();
        ObjectMapper objectMapper = new ObjectMapper();
        feignClient.agentPayload = """
            [
              {
                "id": "agent-real-1",
                "name": "Agente Real",
                "communicationType": "WHATSAPP",
                "type": "COMMERCIAL",
                "jobName": "Closer"
              }
            ]
            """;

        GptMakerClient client = new GptMakerClient(
            new GptMakerProperties("https://api.gptmaker.ai", "token-123", false),
            feignClient,
            objectMapper
        );

        var agents = client.listAgents("ws-1");

        assertEquals(1, agents.size());
        assertEquals("Agente Real", agents.getFirst().name());
        assertEquals("Closer", agents.getFirst().jobName());
    }

    @Test
    void agentDiagnosticsReturnsConnectedWhenAgentsAreListed() {
        TrackingFeignClient feignClient = new TrackingFeignClient();
        ObjectMapper objectMapper = new ObjectMapper();
        feignClient.agentPayload = """
            [
              { "id": "agent-1", "name": "Agente 1" },
              { "id": "agent-2", "name": "Agente 2" }
            ]
            """;

        GptMakerClient client = new GptMakerClient(
            new GptMakerProperties("https://api.gptmaker.ai", "token-123", false),
            feignClient,
            objectMapper
        );

        var diagnostics = client.agentDiagnostics("ws-1");

        assertEquals("CONNECTED", diagnostics.status());
        assertEquals(2, diagnostics.agentCount());
        assertEquals(java.util.List.of("Agente 1", "Agente 2"), diagnostics.agentNames());
    }

    @Test
    void diagnosticsReturnsParseErrorWhenHttp200PayloadCannotBeParsed() {
        TrackingFeignClient feignClient = new TrackingFeignClient();
        ObjectMapper objectMapper = new ObjectMapper();
        feignClient.workspacePayload = "[{invalid-json]";

        GptMakerClient client = new GptMakerClient(
            new GptMakerProperties("https://api.gptmaker.ai", "token-123", false),
            feignClient,
            objectMapper
        );

        var diagnostics = client.diagnostics();

        assertEquals("ERROR", diagnostics.status());
        assertEquals(200, diagnostics.httpStatus());
        assertEquals("GPTMAKER_PARSE_ERROR", diagnostics.errorCode());
        assertEquals("GPTMaker respondeu, mas o backend nao conseguiu interpretar o payload.", diagnostics.message());
        assertNotNull(diagnostics.responsePreview());
    }

    @Test
    void sanitizedApiTokenRemovesBearerPrefixAndSpaces() {
        GptMakerProperties properties = new GptMakerProperties("https://api.gptmaker.ai", "  Bearer token-123  ", false);

        assertEquals("token-123", properties.sanitizedApiToken());
        assertTrue(properties.tokenConfigured());
    }

    private static final class TrackingFeignClient implements GptMakerFeignClient {
        boolean trainingCalled;
        boolean intentCalled;
        boolean createAgentCalled;
        String workspacePayload = "[]";
        String agentPayload = "[]";
        String createAgentPayload = "{}";
        String lastCreateAgentWorkspaceId;
        GptMakerCreateAgentRequest lastCreateAgentRequest;

        @Override
        public ResponseEntity<String> listWorkspaces() {
            return ResponseEntity.ok(workspacePayload);
        }

        @Override
        public ResponseEntity<String> listAgents(String workspaceId) {
            return ResponseEntity.ok(agentPayload);
        }

        @Override
        public ResponseEntity<String> createAgent(String workspaceId, GptMakerCreateAgentRequest request) {
            createAgentCalled = true;
            lastCreateAgentWorkspaceId = workspaceId;
            lastCreateAgentRequest = request;
            return ResponseEntity.ok(createAgentPayload);
        }

        @Override
        public GptMakerCreateTrainingResponse createTraining(String agentId, GptMakerCreateTrainingRequest request) {
            trainingCalled = true;
            return new GptMakerCreateTrainingResponse(true, "training-1");
        }

        @Override
        public GptMakerCreateIntentResponse createIntent(String agentId, GptMakerCreateIntentRequest request) {
            intentCalled = true;
            return new GptMakerCreateIntentResponse(true, "intent-1");
        }
    }
}
