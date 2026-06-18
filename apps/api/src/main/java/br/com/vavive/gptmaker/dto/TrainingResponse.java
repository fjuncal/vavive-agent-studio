package br.com.vavive.gptmaker.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record TrainingResponse(
    UUID id,
    String title,
    String content,
    String status,
    String externalReference,
    String message,
    String contentSummary,
    boolean mockEnabled,
    LocalDateTime publishedAt,
    LocalDateTime createdAt
) {
}
