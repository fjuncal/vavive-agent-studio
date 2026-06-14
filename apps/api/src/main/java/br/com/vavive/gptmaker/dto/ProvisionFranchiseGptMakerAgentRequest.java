package br.com.vavive.gptmaker.dto;

import jakarta.validation.constraints.NotBlank;

public record ProvisionFranchiseGptMakerAgentRequest(
    @NotBlank String workspaceId,
    String workspaceName,
    @NotBlank String agentName,
    @NotBlank String communicationType,
    @NotBlank String type,
    String jobName,
    String jobSite,
    String jobDescription
) {
}
