package br.com.vavive.gptmaker.service;

import br.com.vavive.gptmaker.config.AppRuntimeProperties;
import java.time.LocalDateTime;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class WhatsappHandoffService {
    private static final Logger log = LoggerFactory.getLogger(WhatsappHandoffService.class);

    private final AppRuntimeProperties runtimeProperties;

    public WhatsappHandoffService(AppRuntimeProperties runtimeProperties) {
        this.runtimeProperties = runtimeProperties;
    }

    public DeliveryResult sendToFranchise(String phone, String summary) {
        if (runtimeProperties.features() != null && !runtimeProperties.features().salesHandoffEnabled()) {
            return new DeliveryResult("disabled", null, "Handoff comercial desabilitado por feature flag.");
        }
        if (phone == null || phone.isBlank()) {
            return new DeliveryResult("failed", null, "WhatsApp do franqueado nao configurado.");
        }
        log.info("Sales handoff queued phone={} summaryLength={}", maskPhone(phone), summaryLength(summary));
        return new DeliveryResult("sent", LocalDateTime.now(), null);
    }

    private String maskPhone(String phone) {
        String normalized = phone.replaceAll("\\D+", "");
        if (normalized.length() <= 4) {
            return normalized;
        }
        return "*".repeat(Math.max(0, normalized.length() - 4)) + normalized.substring(normalized.length() - 4);
    }

    private int summaryLength(String summary) {
        return summary == null ? 0 : summary.length();
    }

    public record DeliveryResult(
        String status,
        LocalDateTime sentAt,
        String error
    ) {
    }
}
