package br.com.vavive.gptmaker.dto;

import java.time.LocalDateTime;

public record ChannelConfigurationResponse(
    String channelType,
    Object payload,
    LocalDateTime updatedAt,
    boolean standard
) {
}
