package br.com.vavive.gptmaker.integration.gptmaker.dto;

public record GptMakerCreateAgentResponse(
    String id,
    String name,
    String behavior,
    String avatar,
    String communicationType,
    String type,
    String jobName,
    String jobSite,
    String jobDescription
) {
}
