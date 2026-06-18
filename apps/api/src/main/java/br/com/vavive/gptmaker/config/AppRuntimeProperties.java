package br.com.vavive.gptmaker.config;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppRuntimeProperties(
    Cors cors,
    Features features
) {
    public record Cors(
        List<String> allowedOrigins
    ) {
        public List<String> resolvedAllowedOrigins() {
            return allowedOrigins == null || allowedOrigins.isEmpty()
                ? List.of("http://localhost:3000")
                : allowedOrigins;
        }
    }

    public record Features(
        boolean realChannelsEnabled,
        boolean liveInboxEnabled,
        boolean salesHandoffEnabled
    ) {
    }
}
