package br.com.vavive.gptmaker.dto;

import java.util.List;
import java.util.UUID;

public record FranchiseWorkspaceMappingResponse(
    List<LinkedWorkspaceFranchiseResponse> linked,
    List<UnlinkedWorkspaceResponse> unlinkedWorkspaces,
    List<FranchiseWithoutWorkspaceResponse> franchisesWithoutWorkspace
) {
    public record LinkedWorkspaceFranchiseResponse(
        String workspaceId,
        String workspaceName,
        UUID franchiseId,
        String franchiseName,
        String agentId,
        String agentName
    ) {
    }

    public record UnlinkedWorkspaceResponse(
        String workspaceId,
        String workspaceName
    ) {
    }

    public record FranchiseWithoutWorkspaceResponse(
        UUID franchiseId,
        String franchiseName,
        String city,
        String state
    ) {
    }
}
