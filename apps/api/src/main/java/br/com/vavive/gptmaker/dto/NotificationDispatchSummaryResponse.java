package br.com.vavive.gptmaker.dto;

public record NotificationDispatchSummaryResponse(
    int total,
    int sent,
    int failed,
    int dryRun,
    String provider
) {
}
