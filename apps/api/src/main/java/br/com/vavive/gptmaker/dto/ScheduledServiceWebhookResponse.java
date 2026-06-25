package br.com.vavive.gptmaker.dto;

import java.util.UUID;

public record ScheduledServiceWebhookResponse(
    boolean success,
    String message,
    UUID scheduledRequestId,
    NotificationDispatchSummaryResponse notifications
) {
}
