package br.com.vavive.gptmaker.dto;

import jakarta.validation.constraints.Min;

public record RevertBlockRequest(
    @Min(value = 1, message = "Versao deve ser maior que zero")
    int version
) {
}
