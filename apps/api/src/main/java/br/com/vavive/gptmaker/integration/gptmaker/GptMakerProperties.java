package br.com.vavive.gptmaker.integration.gptmaker;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "gptmaker")
public record GptMakerProperties(
    String baseUrl,
    String apiToken,
    boolean mockEnabled
) {
    public boolean tokenConfigured() {
        return apiToken != null && !apiToken.isBlank();
    }
}
