package br.com.vavive.gptmaker.integration.gptmaker;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class GptMakerClient {
    private final String baseUrl;
    private final String token;
    private final boolean mockEnabled;

    public GptMakerClient(
        @Value("${gptmaker.base-url}") String baseUrl,
        @Value("${gptmaker.token:}") String token,
        @Value("${gptmaker.mock-enabled:true}") boolean mockEnabled
    ) {
        this.baseUrl = baseUrl;
        this.token = token;
        this.mockEnabled = mockEnabled;
    }

    public GptMakerSyncResult sendTraining(String externalAgentId, String title, String content) {
        if (mockEnabled) {
            return new GptMakerSyncResult(true, "mock-training-" + externalAgentId, "Treinamento aceito pelo mock GPTMaker.");
        }

        // Future implementation: call GPTMaker using Authorization: Bearer token.
        if (token == null || token.isBlank()) {
            return new GptMakerSyncResult(false, null, "GPTMaker token is not configured.");
        }
        return new GptMakerSyncResult(false, null, "Real GPTMaker integration is not implemented yet for " + baseUrl + ".");
    }

    public GptMakerSyncResult sendIntent(String externalAgentId, String name, String description) {
        if (mockEnabled) {
            return new GptMakerSyncResult(true, "mock-intent-" + externalAgentId, "Intencao aceita pelo mock GPTMaker.");
        }
        return new GptMakerSyncResult(false, null, "Real GPTMaker integration is not implemented yet.");
    }

    public GptMakerSyncResult sendRule(String externalAgentId, String title, String description) {
        if (mockEnabled) {
            return new GptMakerSyncResult(true, "mock-rule-" + externalAgentId, "Regra aceita pelo mock GPTMaker.");
        }
        return new GptMakerSyncResult(false, null, "Real GPTMaker integration is not implemented yet.");
    }
}
