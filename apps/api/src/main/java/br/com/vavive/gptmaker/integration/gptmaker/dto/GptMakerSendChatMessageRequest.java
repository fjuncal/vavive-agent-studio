package br.com.vavive.gptmaker.integration.gptmaker.dto;

public record GptMakerSendChatMessageRequest(
    String message,
    String replyMessageId
) {
}
