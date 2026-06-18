package br.com.vavive.gptmaker.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record FranchiseChannelResponse(
    UUID id,
    String externalChannelId,
    String name,
    String channelType,
    boolean connected,
    String agentName,
    String externalUsername,
    LocalDateTime lastSyncedAt,
    String lastSyncError
) {
}
