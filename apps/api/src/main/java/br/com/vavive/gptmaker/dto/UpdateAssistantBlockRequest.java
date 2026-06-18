package br.com.vavive.gptmaker.dto;

public record UpdateAssistantBlockRequest(
    String mode,
    Object payload
) {
}
