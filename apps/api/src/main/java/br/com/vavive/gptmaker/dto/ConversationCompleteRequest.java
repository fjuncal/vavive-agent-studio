package br.com.vavive.gptmaker.dto;

public record ConversationCompleteRequest(
    String outcome,
    String closedReason,
    String saleSummary
) {
}
