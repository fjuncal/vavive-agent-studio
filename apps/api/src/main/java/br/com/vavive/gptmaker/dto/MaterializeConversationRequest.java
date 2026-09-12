package br.com.vavive.gptmaker.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public record MaterializeConversationRequest(
    UUID franchiseId,
    @NotBlank String chatId
) {
}
