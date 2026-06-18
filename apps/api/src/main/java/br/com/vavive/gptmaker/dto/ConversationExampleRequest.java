package br.com.vavive.gptmaker.dto;

public record ConversationExampleRequest(
    String title,
    String objective,
    String messages,
    String status,
    Boolean includeInTraining
) {
}
