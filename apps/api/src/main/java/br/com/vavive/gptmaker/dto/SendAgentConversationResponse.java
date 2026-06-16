package br.com.vavive.gptmaker.dto;

import java.util.List;
import java.util.UUID;

public record SendAgentConversationResponse(
    UUID conversationId,
    UUID franchiseId,
    String franchiseName,
    String agentName,
    String contextId,
    String chatId,
    String interactionId,
    String message,
    List<String> images,
    List<String> audios,
    List<String> documents
) {
}
