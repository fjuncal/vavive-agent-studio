package br.com.vavive.gptmaker.dto;

import java.util.UUID;

public record VaviveDefaultContextResponse(
    UUID franchiseId,
    String franchiseName,
    String context
) {
}
