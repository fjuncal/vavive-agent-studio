package br.com.vavive.gptmaker.dto;

public record ConversationManualMessageRequest(
    String message,
    String replyMessageId
) {
}
