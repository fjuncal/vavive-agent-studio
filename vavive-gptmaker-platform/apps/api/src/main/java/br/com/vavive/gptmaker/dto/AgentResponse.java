package br.com.vavive.gptmaker.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record AgentResponse(
    UUID id,
    String externalId,
    String name,
    String status,
    String toneOfVoice,
    String franchiseName,
    LocalDateTime createdAt
) {
}
