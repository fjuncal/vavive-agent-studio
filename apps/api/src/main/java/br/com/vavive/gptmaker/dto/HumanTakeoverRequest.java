package br.com.vavive.gptmaker.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

// TODO: usar este contrato quando assumirmos atendimento humano via GPTMaker.
public record HumanTakeoverRequest(
    @NotNull UUID chatId,
    String reason
) {
}
