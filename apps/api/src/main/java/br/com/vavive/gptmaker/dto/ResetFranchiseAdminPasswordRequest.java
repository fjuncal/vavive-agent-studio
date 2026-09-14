package br.com.vavive.gptmaker.dto;

import jakarta.validation.constraints.NotBlank;

public record ResetFranchiseAdminPasswordRequest(
    @NotBlank String newPassword,
    @NotBlank String confirmPassword
) {
}
