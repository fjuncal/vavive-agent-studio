package br.com.vavive.gptmaker.service;

import br.com.vavive.gptmaker.integration.gptmaker.GptMakerClient;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerHealthResponse;
import org.springframework.stereotype.Service;

@Service
public class GptMakerService {
    private final GptMakerClient gptMakerClient;

    public GptMakerService(GptMakerClient gptMakerClient) {
        this.gptMakerClient = gptMakerClient;
    }

    public GptMakerHealthResponse health() {
        var status = gptMakerClient.health();
        return new GptMakerHealthResponse(
            status.baseUrl(),
            status.mockEnabled(),
            status.tokenConfigured(),
            status.status(),
            status.message()
        );
    }
}
