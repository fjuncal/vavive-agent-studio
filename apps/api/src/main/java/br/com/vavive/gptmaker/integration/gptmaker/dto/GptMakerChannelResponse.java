package br.com.vavive.gptmaker.integration.gptmaker.dto;

public record GptMakerChannelResponse(
    String id,
    String name,
    String agentId,
    String agentPicture,
    String agentName,
    String facebookPageId,
    boolean connected,
    String username
) {
}
