package br.com.vavive.gptmaker.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateFranchiseGptMakerWorkspaceRequest(
    @NotBlank String workspaceId,
    String workspaceName,
    Boolean confirmCriticalChange
) {
}
