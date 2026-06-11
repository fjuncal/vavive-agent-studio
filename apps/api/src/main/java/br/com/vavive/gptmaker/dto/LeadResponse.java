package br.com.vavive.gptmaker.dto;

import br.com.vavive.gptmaker.domain.enums.LeadStatus;
import java.time.LocalDateTime;
import java.util.UUID;

public record LeadResponse(
    UUID id,
    String name,
    String phone,
    String service,
    String source,
    LeadStatus status,
    String franchiseName,
    String agentName,
    LocalDateTime createdAt
) {
}
