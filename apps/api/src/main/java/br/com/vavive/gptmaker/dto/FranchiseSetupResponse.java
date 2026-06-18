package br.com.vavive.gptmaker.dto;

import java.time.LocalDateTime;
import java.util.List;
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
    String franchiseWhatsapp,
    String defaultContext,
    String conversationExamplesSummary,
    UUID agentId,
    String agentName,
    int completionPercentage,
    String setupStatus,
    LocalDateTime lastPublishedAt,
    String lastGeneratedTraining,
    List<ConversationExampleResponse> examples,
    List<TrainingResponse> recentTrainings
) {
}
