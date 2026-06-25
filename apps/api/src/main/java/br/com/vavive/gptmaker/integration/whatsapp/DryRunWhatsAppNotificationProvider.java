package br.com.vavive.gptmaker.integration.whatsapp;

import org.springframework.stereotype.Component;

@Component
public class DryRunWhatsAppNotificationProvider implements WhatsAppNotificationProvider {
    @Override
    public WhatsAppSendResult sendText(String phone, String message) {
        return WhatsAppSendResult.dryRun("DRY_RUN phone=" + phone + " messageLength=" + (message == null ? 0 : message.length()));
    }

    @Override
    public String providerName() {
        return "dry-run";
    }
}
