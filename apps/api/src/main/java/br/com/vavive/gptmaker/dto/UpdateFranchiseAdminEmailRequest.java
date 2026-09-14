package br.com.vavive.gptmaker.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateFranchiseAdminEmailRequest(
    @NotBlank String email
) {
}
