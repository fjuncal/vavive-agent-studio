package br.com.vavive.gptmaker.integration.gptmaker.dto;

public record GptMakerHealthResponse(
    String baseUrl,
    boolean mockEnabled,
    boolean tokenConfigured,
    String status,
    String message
) {
}
