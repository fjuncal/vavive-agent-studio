package br.com.vavive.gptmaker.dto;

import br.com.vavive.gptmaker.domain.enums.UserRole;
import java.util.UUID;

public record UserResponse(
    UUID id,
    String name,
    String email,
    UserRole role,
    FranchiseResponse franchise
) {
}
