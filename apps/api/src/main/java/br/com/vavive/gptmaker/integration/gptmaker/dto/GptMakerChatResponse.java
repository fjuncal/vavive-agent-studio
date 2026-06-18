package br.com.vavive.gptmaker.integration.gptmaker.dto;

public record GptMakerChatResponse(
    String id,
    boolean humanTalk,
    boolean read,
    boolean finished,
    String role,
    String agentName,
    String agentId,
    String whatsappPhone,
    String title,
    String type,
    String userName,
    String userId,
    String conversationType,
    String conversation,
    String messageUserName,
    String picture,
    String userPicture,
    String avatar,
    String recipient,
    String name,
    Long createdAt,
    Long time,
    Integer unReadCount
) {
}
