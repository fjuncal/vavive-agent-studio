package br.com.vavive.gptmaker.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record AssistantStandardProfileResponse(
    UUID id,
    String name,
    boolean active,
    int version,
    LocalDateTime updatedAt,
    List<AssistantBlockResponse> blocks
) {
}
