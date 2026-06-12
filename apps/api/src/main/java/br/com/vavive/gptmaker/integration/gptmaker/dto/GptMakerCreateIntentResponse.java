package br.com.vavive.gptmaker.integration.gptmaker.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record GptMakerCreateIntentResponse(
    boolean success,
    @JsonAlias({"id", "intentionId", "reference", "externalReference"})
    String reference
) {
}
