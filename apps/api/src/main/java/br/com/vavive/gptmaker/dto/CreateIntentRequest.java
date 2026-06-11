package br.com.vavive.gptmaker.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateIntentRequest(
    @NotBlank String name,
    @NotBlank String description,
    String examplePhrase
) {
}
