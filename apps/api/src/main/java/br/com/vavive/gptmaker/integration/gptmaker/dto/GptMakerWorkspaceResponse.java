package br.com.vavive.gptmaker.integration.gptmaker.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record GptMakerWorkspaceResponse(
    String id,
    String name
) {
}
