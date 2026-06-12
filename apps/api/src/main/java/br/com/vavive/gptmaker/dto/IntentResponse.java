package br.com.vavive.gptmaker.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record IntentResponse(
    UUID id,
    String name,
    String description,
    String examplePhrase,
    boolean active,
    String status,
    String externalReference,
    String message,
    boolean mockEnabled,
    LocalDateTime createdAt
) {
}
