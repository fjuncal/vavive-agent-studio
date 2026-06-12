package br.com.vavive.gptmaker.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record FranchiseSetupResponse(
    UUID franchiseId,
    String franchiseName,
    String document,
    String city,
    String state,
    String responsibleName,
    String services,
    String prices,
    String regions,
    String schedules,
    String faq,
    String rules,
    String toneOfVoice,
    int completionPercentage,
    String setupStatus,
    LocalDateTime lastPublishedAt,
    String lastGeneratedTraining
) {
}
