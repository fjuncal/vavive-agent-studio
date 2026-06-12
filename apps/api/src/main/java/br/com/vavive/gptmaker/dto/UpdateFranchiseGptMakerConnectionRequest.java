package br.com.vavive.gptmaker.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateFranchiseGptMakerConnectionRequest(
    @NotBlank String workspaceId,
    @NotBlank String agentId
) {
}
