package br.com.vavive.gptmaker.integration.gptmaker.dto;

import java.util.List;

public record GptMakerAgentDiagnosticsResponse(
    String workspaceId,
    String endpoint,
    Integer httpStatus,
    String status,
    int agentCount,
    List<String> agentNames,
    String message,
    String errorCode,
    String responsePreview
) {
}
