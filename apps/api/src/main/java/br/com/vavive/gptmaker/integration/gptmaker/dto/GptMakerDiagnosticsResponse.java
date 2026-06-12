package br.com.vavive.gptmaker.integration.gptmaker.dto;

public record GptMakerDiagnosticsResponse(
    boolean mockEnabled,
    boolean tokenConfigured,
    String baseUrl,
    String status,
    int workspaceCount,
    String message,
    String details
) {
}
