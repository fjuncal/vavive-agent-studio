package br.com.vavive.gptmaker.controller;

import br.com.vavive.gptmaker.dto.ScheduledServiceWebhookResponse;
import br.com.vavive.gptmaker.service.ScheduledServiceWebhookService;
import java.util.Map;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/webhooks/vavive-agent")
public class VaviveAgentWebhookController {
    private final ScheduledServiceWebhookService scheduledServiceWebhookService;

    public VaviveAgentWebhookController(ScheduledServiceWebhookService scheduledServiceWebhookService) {
        this.scheduledServiceWebhookService = scheduledServiceWebhookService;
    }

    @PostMapping("/scheduled-service")
    public ScheduledServiceWebhookResponse scheduledService(
        @RequestBody(required = false) Map<String, Object> payload,
        @RequestHeader(value = "X-Vavive-Webhook-Secret", required = false) String secret
    ) {
        return scheduledServiceWebhookService.registerScheduledService(payload, secret);
    }
}
