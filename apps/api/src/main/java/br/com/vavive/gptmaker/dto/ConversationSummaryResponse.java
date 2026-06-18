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
    String firstPrompt,
    String lastResponse,
    String channelType,
    String operationalStatus,
    String responsibleUserName,
    String syncStatus,
    String closedReason,
    String saleOutcome,
    String handoffStatus,
    boolean humanTakeoverActive,
    LocalDateTime lastMessageAt,
    LocalDateTime lastSyncedAt,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
}
