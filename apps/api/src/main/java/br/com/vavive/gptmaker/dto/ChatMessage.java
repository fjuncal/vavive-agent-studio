package br.com.vavive.gptmaker.dto;

import java.time.LocalDateTime;
import java.util.UUID;

// TODO: alinhar origem e status com o modelo real do GPTMaker antes de expor endpoints.
public record ChatMessage(
    UUID id,
    UUID chatId,
    String sender,
    String content,
    LocalDateTime createdAt
) {
}
