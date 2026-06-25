package br.com.vavive.gptmaker.dto;

public record WhatsAppNotificationContactRequest(
    String name,
    String phone,
    Boolean active
) {
}
