package br.com.vavive.gptmaker.dto;

import jakarta.validation.constraints.NotNull;

public record CreateFullFranchiseResponse(
    @NotNull FranchiseResponse franchise,
    @NotNull UserResponse adminUser
) {}
