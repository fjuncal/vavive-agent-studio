package br.com.vavive.gptmaker.integration.whatsapp;

public interface WhatsAppNotificationProvider {
    WhatsAppSendResult sendText(String phone, String message);
    String providerName();
}
