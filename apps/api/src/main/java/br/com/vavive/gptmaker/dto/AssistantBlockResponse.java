package br.com.vavive.gptmaker.dto;

public record AssistantBlockResponse(
    String blockType,
    String title,
    String description,
    String mode,
    boolean locked,
    boolean inherited,
    int standardVersion,
    Object payload,
    boolean editable,
    String syncStatus,
    String syncMessage
) {
}
