package br.com.vavive.gptmaker.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateRuleRequest(
    @NotBlank String title,
    @NotBlank String description,
    String category,
    boolean enabled
) {
}
