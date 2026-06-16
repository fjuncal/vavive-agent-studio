package br.com.vavive.gptmaker.dto;

import java.util.UUID;

public record StartHumanTakeoverResponse(
    UUID conversationId,
    boolean success,
    String message
) {
}
