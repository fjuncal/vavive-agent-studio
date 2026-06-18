package br.com.vavive.gptmaker.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record ConversationExampleResponse(
    UUID id,
    String title,
    String objective,
    String messages,
    String status,
    boolean includeInTraining,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
}
