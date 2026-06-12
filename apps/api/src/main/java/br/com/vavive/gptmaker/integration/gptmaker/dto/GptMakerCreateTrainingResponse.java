package br.com.vavive.gptmaker.integration.gptmaker.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record GptMakerCreateTrainingResponse(
    boolean success,
    @JsonAlias({"id", "trainingId", "reference", "externalReference"})
    String reference
) {
}
