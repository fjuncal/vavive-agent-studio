package br.com.vavive.gptmaker.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateFranchiseRequest(
    @NotBlank String name,
    String document,
    @NotBlank String city,
    @NotBlank String state
) {
}
