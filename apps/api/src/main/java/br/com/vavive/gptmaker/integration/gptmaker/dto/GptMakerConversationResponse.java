package br.com.vavive.gptmaker.integration.gptmaker.dto;

import java.util.List;

public record GptMakerConversationResponse(
    String chatId,
    String interactionId,
    String message,
    List<String> images,
    List<String> audios,
    List<String> documents
) {
}
