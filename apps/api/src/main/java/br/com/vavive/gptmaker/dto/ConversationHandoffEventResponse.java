package br.com.vavive.gptmaker.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record ConversationHandoffEventResponse(
    UUID id,
    String outcome,
    String deliveryStatus,
    String responsibleUserName,
    String recipientPhone,
    String summary,
    String deliveryError,
    LocalDateTime sentAt
) {
}
