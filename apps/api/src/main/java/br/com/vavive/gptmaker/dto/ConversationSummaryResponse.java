package br.com.vavive.gptmaker.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record ConversationSummaryResponse(
    UUID id,
    UUID franchiseId,
    String franchiseName,
    String agentName,
    String customerName,
    String customerPhone,
    String contextId,
    String firstPrompt,
    String lastResponse,
    String chatId,
    String interactionId,
    boolean humanTakeoverActive,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
}
