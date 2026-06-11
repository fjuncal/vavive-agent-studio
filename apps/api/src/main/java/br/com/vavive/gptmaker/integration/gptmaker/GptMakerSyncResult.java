package br.com.vavive.gptmaker.integration.gptmaker;

public record GptMakerSyncResult(
    boolean success,
    String externalReference,
    String message
) {
}
