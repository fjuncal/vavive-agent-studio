package br.com.vavive.gptmaker.integration.gptmaker;

import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerCreateIntentRequest;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerCreateIntentResponse;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerCreateTrainingRequest;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerCreateTrainingResponse;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerAgentResponse;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerWorkspaceResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

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

    private static final class TrackingFeignClient implements GptMakerFeignClient {
        boolean trainingCalled;
        boolean intentCalled;

        @Override
        public GptMakerWorkspaceResponse[] listWorkspaces() {
            return new GptMakerWorkspaceResponse[0];
        }

        @Override
        public GptMakerAgentResponse[] listAgents(String workspaceId) {
            return new GptMakerAgentResponse[0];
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
