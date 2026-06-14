package br.com.vavive.gptmaker.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record CreateFranchiseAdminUserRequest(
    @NotBlank String name,
    @NotBlank @Email String email,
    @NotBlank String password
) {
}
