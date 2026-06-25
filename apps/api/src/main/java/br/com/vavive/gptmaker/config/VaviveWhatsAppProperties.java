package br.com.vavive.gptmaker.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "vavive.whatsapp")
public record VaviveWhatsAppProperties(
    String provider,
    Evolution evolution
) {
    public boolean isDryRunPreferred() {
        return provider == null || provider.isBlank() || "dry-run".equalsIgnoreCase(provider);
    }

    public record Evolution(
        String baseUrl,
        String apiKey,
        String instance,
        String sendPath
    ) {
        public boolean isConfigured() {
            return baseUrl != null && !baseUrl.isBlank()
                && apiKey != null && !apiKey.isBlank()
                && instance != null && !instance.isBlank();
        }

        public String resolvedSendPath() {
            return sendPath == null || sendPath.isBlank() ? "/message/sendText/{instance}" : sendPath;
        }
    }
}
