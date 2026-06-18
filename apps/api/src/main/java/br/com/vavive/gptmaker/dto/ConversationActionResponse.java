package br.com.vavive.gptmaker.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record ConversationActionResponse(
    UUID conversationId,
    boolean success,
    String status,
    String message,
    LocalDateTime processedAt
) {
}
