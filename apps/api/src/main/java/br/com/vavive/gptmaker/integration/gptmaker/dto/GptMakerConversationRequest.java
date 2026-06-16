package br.com.vavive.gptmaker.integration.gptmaker.dto;

public record GptMakerConversationRequest(
    String contextId,
    String prompt,
    String callbackUrl,
    String onFinishCallback,
    String chatName,
    String chatPicture,
    String phone
) {
}
