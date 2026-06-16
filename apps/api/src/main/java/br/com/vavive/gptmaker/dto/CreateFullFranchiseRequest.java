package br.com.vavive.gptmaker.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateFullFranchiseRequest(
    @NotNull @Valid FranchisePart franchise,
    @NotNull @Valid AdminUserPart adminUser
) {
    public record FranchisePart(
        @NotBlank String name,
        String document,
        @NotBlank String city,
        @NotBlank String state,
        String workspaceId,
        String workspaceName
    ) {}

    public record AdminUserPart(
        @NotBlank String name,
        @NotBlank String email,
        @NotBlank String password
    ) {}
}
