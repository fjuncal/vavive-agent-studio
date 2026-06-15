package br.com.vavive.gptmaker.dto;

import br.com.vavive.gptmaker.domain.enums.DefaultAgentTextCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UpdateDefaultAgentTextRequest(
    @NotBlank String title,
    @NotNull DefaultAgentTextCategory category,
    @NotBlank String content,
    Boolean active
) {
}
