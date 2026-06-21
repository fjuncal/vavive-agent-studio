package br.com.vavive.gptmaker.integration.gptmaker.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record GptMakerCreateTrainingRequest(
    String type,
    // TEXT fields
    String text,
    String image,
    // WEBSITE fields
    String website,
    String trainingSubPages,
    String trainingInterval,
    // VIDEO fields
    String video,
    // DOCUMENT fields
    String documentUrl,
    String documentName,
    String documentMimetype,
    // Common
    String callbackUrl
) {
}
