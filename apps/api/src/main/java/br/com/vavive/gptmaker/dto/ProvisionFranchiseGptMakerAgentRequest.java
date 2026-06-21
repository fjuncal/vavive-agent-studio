package br.com.vavive.gptmaker.dto;

import jakarta.validation.constraints.NotBlank;

public record ProvisionFranchiseGptMakerAgentRequest(
    @NotBlank String workspaceId,
    String workspaceName,
    @NotBlank String agentName,
    String avatar,
    @NotBlank String communicationType,
    @NotBlank String type,
    Boolean confirmCriticalChange,
    String jobName,
    String jobSite,
    String jobDescription,
    String behavior
) {
}
