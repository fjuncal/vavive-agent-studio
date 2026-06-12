package br.com.vavive.gptmaker.dto;

public record GptMakerAgentOptionResponse(
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
