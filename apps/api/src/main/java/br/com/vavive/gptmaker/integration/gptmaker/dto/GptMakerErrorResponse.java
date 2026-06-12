package br.com.vavive.gptmaker.integration.gptmaker.dto;

public record GptMakerErrorResponse(
    String message,
    String error,
    String code
) {
}
