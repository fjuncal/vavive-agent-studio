package br.com.vavive.gptmaker.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record PublishAgentResponse(
    UUID franchiseId,
    UUID agentId,
    UUID trainingId,
    boolean success,
    String status,
    String externalReference,
    String message,
    LocalDateTime publishedAt
) {
}
