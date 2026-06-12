package br.com.vavive.gptmaker.integration.gptmaker.dto;

public record GptMakerCreateTrainingRequest(
    String type,
    String text,
    String image,
    String callbackUrl
) {
}
