package br.com.vavive.gptmaker.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public record SendAgentConversationRequest(
    UUID franchiseId,
    @NotBlank String prompt,
    @NotBlank String contextId,
    String customerName,
    String phone,
    String chatPicture
) {
}
