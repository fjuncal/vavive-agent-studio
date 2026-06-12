package br.com.vavive.gptmaker.integration.gptmaker;

import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerCreateIntentRequest;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerCreateIntentResponse;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerCreateTrainingRequest;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerCreateTrainingResponse;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerAgentResponse;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerWorkspaceResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
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
    void diagnosticsReturnsConnectedWhenRealModeListsWorkspaces() {
        TrackingFeignClient feignClient = new TrackingFeignClient();
        ObjectMapper objectMapper = new ObjectMapper();
        ArrayNode workspaces = objectMapper.createArrayNode();
        workspaces.add(objectMapper.createObjectNode().put("id", "ws-1").put("name", "Workspace 1"));
        feignClient.workspacePayload = workspaces;

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
    void listWorkspacesAcceptsWrappedDataPayload() {
        TrackingFeignClient feignClient = new TrackingFeignClient();
        ObjectMapper objectMapper = new ObjectMapper();
        ObjectNode payload = objectMapper.createObjectNode();
        ArrayNode data = objectMapper.createArrayNode();
        data.add(objectMapper.createObjectNode().put("id", "ws-1").put("name", "Workspace 1"));
        payload.set("data", data);
        feignClient.workspacePayload = payload;

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
        feignClient.workspacePayload = objectMapper.readTree(payload);

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
        ObjectNode payload = objectMapper.createObjectNode();
        ArrayNode items = objectMapper.createArrayNode();
        items.add(objectMapper.createObjectNode()
            .put("id", "agent-1")
            .put("name", "Agente 1")
            .put("behavior", "NORMAL")
            .put("communicationType", "FORMAL")
            .put("type", "SALE"));
        payload.set("items", items);
        feignClient.agentPayload = payload;

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
    void sanitizedApiTokenRemovesBearerPrefixAndSpaces() {
        GptMakerProperties properties = new GptMakerProperties("https://api.gptmaker.ai", "  Bearer token-123  ", false);

        assertEquals("token-123", properties.sanitizedApiToken());
        assertTrue(properties.tokenConfigured());
    }

    private static final class TrackingFeignClient implements GptMakerFeignClient {
        boolean trainingCalled;
        boolean intentCalled;
        JsonNode workspacePayload = new ObjectMapper().createArrayNode();
        JsonNode agentPayload = new ObjectMapper().createArrayNode();

        @Override
        public ResponseEntity<JsonNode> listWorkspaces() {
            return ResponseEntity.ok(workspacePayload);
        }

        @Override
        public ResponseEntity<JsonNode> listAgents(String workspaceId) {
            return ResponseEntity.ok(agentPayload);
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
