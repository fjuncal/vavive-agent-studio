package br.com.vavive.gptmaker.integration.gptmaker;

public record GptMakerSyncResult(
    boolean success,
    String status,
    String externalReference,
    String message,
    boolean mockEnabled,
    String errorCode,
    String details
) {
}
