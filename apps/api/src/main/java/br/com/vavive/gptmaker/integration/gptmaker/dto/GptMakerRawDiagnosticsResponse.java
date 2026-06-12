package br.com.vavive.gptmaker.integration.gptmaker.dto;

import com.fasterxml.jackson.databind.JsonNode;

public record GptMakerRawDiagnosticsResponse(
    String endpoint,
    Integer httpStatus,
    JsonNode payload,
    String errorCode,
    String message,
    String responsePreview,
    String details
) {
}
