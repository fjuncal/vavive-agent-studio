package br.com.vavive.gptmaker.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record FranchiseResponse(
    UUID id,
    String name,
    String document,
    String city,
    String state,
    String status,
    String workspaceId,
    String workspaceName,
    String agentId,
    String agentName,
    LocalDateTime gptMakerLastSyncAt,
    LocalDateTime createdAt
) {
}
