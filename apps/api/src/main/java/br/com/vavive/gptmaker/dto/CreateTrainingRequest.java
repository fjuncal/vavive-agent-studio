package br.com.vavive.gptmaker.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateTrainingRequest(
    @NotBlank String title,
    @NotBlank String content
) {
}
