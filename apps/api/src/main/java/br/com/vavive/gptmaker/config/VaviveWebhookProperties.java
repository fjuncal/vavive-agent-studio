package br.com.vavive.gptmaker.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "vavive.webhooks.agent")
public record VaviveWebhookProperties(
    String secret
) {
    public boolean secretConfigured() {
        return secret != null && !secret.isBlank();
    }
}
