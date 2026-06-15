package br.com.vavive.gptmaker.dto;

import br.com.vavive.gptmaker.domain.enums.DefaultAgentTextCategory;
import java.time.LocalDateTime;
import java.util.UUID;

public record DefaultAgentTextResponse(
    UUID id,
    String title,
    DefaultAgentTextCategory category,
    String content,
    boolean active,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
}
