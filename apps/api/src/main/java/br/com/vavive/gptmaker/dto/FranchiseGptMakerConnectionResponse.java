package br.com.vavive.gptmaker.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record FranchiseGptMakerConnectionResponse(
    UUID franchiseId,
    String franchiseName,
    String workspaceId,
    String workspaceName,
    String agentId,
    String agentName,
    String status,
    LocalDateTime lastSyncAt
) {
}
