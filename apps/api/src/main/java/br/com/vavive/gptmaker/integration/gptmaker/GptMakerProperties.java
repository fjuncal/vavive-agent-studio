package br.com.vavive.gptmaker.integration.gptmaker;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "gptmaker")
public record GptMakerProperties(
    String baseUrl,
    String apiToken,
    boolean mockEnabled
) {
    public boolean tokenConfigured() {
        return !sanitizedApiToken().isBlank();
    }

    public String sanitizedApiToken() {
        if (apiToken == null) {
            return "";
        }
        String token = apiToken.trim();
        if (token.regionMatches(true, 0, "Bearer ", 0, 7)) {
            token = token.substring(7).trim();
        }
        return token;
    }
}
