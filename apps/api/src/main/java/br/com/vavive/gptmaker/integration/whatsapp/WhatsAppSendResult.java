package br.com.vavive.gptmaker.integration.whatsapp;

public record WhatsAppSendResult(
    boolean success,
    boolean dryRun,
    String providerResponse,
    String errorMessage
) {
    public static WhatsAppSendResult success(String providerResponse) {
        return new WhatsAppSendResult(true, false, providerResponse, null);
    }

    public static WhatsAppSendResult dryRun(String providerResponse) {
        return new WhatsAppSendResult(true, true, providerResponse, null);
    }

    public static WhatsAppSendResult failed(String errorMessage, String providerResponse) {
        return new WhatsAppSendResult(false, false, providerResponse, errorMessage);
    }
}
