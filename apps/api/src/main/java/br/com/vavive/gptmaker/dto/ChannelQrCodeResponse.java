package br.com.vavive.gptmaker.dto;

public record ChannelQrCodeResponse(
    String value,
    boolean connected,
    String message
) {
}
