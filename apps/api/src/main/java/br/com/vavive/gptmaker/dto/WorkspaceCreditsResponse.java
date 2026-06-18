package br.com.vavive.gptmaker.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record WorkspaceCreditsResponse(
    UUID franchiseId,
    String status,
    long credits,
    long used,
    long remaining,
    String message,
    LocalDateTime checkedAt
) {
}
