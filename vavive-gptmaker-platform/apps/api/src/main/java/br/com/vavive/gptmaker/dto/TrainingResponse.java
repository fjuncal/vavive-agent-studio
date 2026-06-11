package br.com.vavive.gptmaker.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record TrainingResponse(
    UUID id,
    String title,
    String content,
    String status,
    LocalDateTime createdAt
) {
}
