package br.com.vavive.gptmaker.integration.gptmaker.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record GptMakerCreateTrainingRequest(
    String type,
    String text,
    String image,
    String callbackUrl
) {
}
