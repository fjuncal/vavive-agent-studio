package br.com.vavive.gptmaker.integration.gptmaker.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record GptMakerAgentResponse(
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
