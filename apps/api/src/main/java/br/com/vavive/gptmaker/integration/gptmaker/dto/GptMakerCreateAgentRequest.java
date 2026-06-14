package br.com.vavive.gptmaker.integration.gptmaker.dto;

public record GptMakerCreateAgentRequest(
    String name,
    String avatar,
    String behavior,
    String communicationType,
    String type,
    String jobName,
    String jobSite,
    String jobDescription
) {
}
