package br.com.vavive.gptmaker.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record RuleResponse(
    UUID id,
    String title,
    String description,
    String category,
    boolean enabled,
    LocalDateTime createdAt
) {
}
