package br.com.vavive.gptmaker.dto;

import java.time.LocalDateTime;

public record DashboardSummaryResponse(
    long totalLeads,
    long newLeads,
    long activeLeads,
    long finishedChats,
    double conversionRate,
    String setupStatus,
    int completionPercentage,
    LocalDateTime lastPublicationAt,
    String lastTrainingTitle,
    long blockedFranchises,
    long franchisesWithoutAgent,
    long franchisesReadyToPublish,
    long waitingHumanConversations,
    long syncedChannels,
    LocalDateTime lastNetworkActionAt
) {
}
