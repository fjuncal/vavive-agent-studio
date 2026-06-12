package br.com.vavive.gptmaker.integration.gptmaker.dto;

import com.fasterxml.jackson.annotation.JsonAlias;

public record GptMakerCreateIntentResponse(
    boolean success,
    @JsonAlias({"id", "intentionId", "reference", "externalReference"})
    String reference
) {
    public String referenceOrDefault(String fallback) {
        return reference == null || reference.isBlank() ? fallback : reference;
    }
}
