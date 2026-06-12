package br.com.vavive.gptmaker.integration.gptmaker.dto;

import com.fasterxml.jackson.annotation.JsonAlias;

public record GptMakerCreateTrainingResponse(
    boolean success,
    @JsonAlias({"id", "trainingId", "reference", "externalReference"})
    String reference
) {
    public String referenceOrDefault(String fallback) {
        return reference == null || reference.isBlank() ? fallback : reference;
    }
}
