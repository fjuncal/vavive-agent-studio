package br.com.vavive.gptmaker.dto;

import java.time.LocalDateTime;
import java.util.UUID;

// TODO: conectar ao GPTMaker quando o fluxo de conversas for validado.
public record ChatSummary(
    UUID id,
    UUID franchiseId,
    String customerName,
    String customerPhone,
    String status,
    String lastMessagePreview,
    LocalDateTime lastMessageAt,
    boolean humanTakeoverActive
) {
}
