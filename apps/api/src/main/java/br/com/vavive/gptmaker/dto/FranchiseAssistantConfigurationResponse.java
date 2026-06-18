package br.com.vavive.gptmaker.dto;

import java.util.List;
import java.util.UUID;

public record FranchiseAssistantConfigurationResponse(
    UUID franchiseId,
    String franchiseName,
    String assistantName,
    boolean assistantConfigured,
    List<AssistantBlockResponse> blocks
) {
}
