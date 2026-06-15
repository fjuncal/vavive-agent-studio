package br.com.vavive.gptmaker.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record AgentResponse(
    UUID id,
    UUID franchiseId,
    String externalId,
    String name,
    String avatar,
    String status,
    String toneOfVoice,
    String franchiseName,
    boolean connectedToRealGptMaker,
    String connectionStatus,
    LocalDateTime createdAt
) {
}
