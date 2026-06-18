package br.com.vavive.gptmaker.dto;

import com.fasterxml.jackson.databind.JsonNode;

public record AssistantBlockResponse(
    String blockType,
    String title,
    String description,
    String mode,
    boolean locked,
    boolean inherited,
    int standardVersion,
    JsonNode payload,
    boolean editable,
    String syncStatus,
    String syncMessage
) {
}
