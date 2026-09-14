package br.com.vavive.gptmaker.dto;

import br.com.vavive.gptmaker.domain.enums.FranchiseAccessStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateFranchiseAccessStatusRequest(
    @NotNull FranchiseAccessStatus status
) {
}
