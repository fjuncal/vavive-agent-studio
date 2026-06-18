package br.com.vavive.gptmaker.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateChannelRequest(
    @NotBlank(message = "Nome do canal e obrigatorio")
    String name,
    @NotBlank(message = "Tipo do canal e obrigatorio")
    String type
) {
}
