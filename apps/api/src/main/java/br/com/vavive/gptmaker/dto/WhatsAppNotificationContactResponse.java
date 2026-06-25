package br.com.vavive.gptmaker.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record WhatsAppNotificationContactResponse(
    UUID id,
    UUID franchiseId,
    String franchiseName,
    String name,
    String phone,
    boolean active,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
}
