package br.com.vavive.gptmaker.controller;

import br.com.vavive.gptmaker.dto.NotificationDispatchSummaryResponse;
import br.com.vavive.gptmaker.dto.TestWhatsAppNotificationRequest;
import br.com.vavive.gptmaker.dto.WhatsAppNotificationContactRequest;
import br.com.vavive.gptmaker.dto.WhatsAppNotificationContactResponse;
import br.com.vavive.gptmaker.service.WhatsAppNotificationContactService;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/franchises/{franchiseId}/whatsapp-notification-contacts")
public class WhatsAppNotificationContactController {
    private final WhatsAppNotificationContactService service;

    public WhatsAppNotificationContactController(WhatsAppNotificationContactService service) {
        this.service = service;
    }

    @GetMapping
    public List<WhatsAppNotificationContactResponse> list(@PathVariable UUID franchiseId) {
        return service.list(franchiseId);
    }

    @PostMapping
    public WhatsAppNotificationContactResponse create(@PathVariable UUID franchiseId, @RequestBody WhatsAppNotificationContactRequest request) {
        return service.create(franchiseId, request);
    }

    @PutMapping("/{contactId}")
    public WhatsAppNotificationContactResponse update(
        @PathVariable UUID franchiseId,
        @PathVariable UUID contactId,
        @RequestBody WhatsAppNotificationContactRequest request
    ) {
        return service.update(franchiseId, contactId, request);
    }

    @DeleteMapping("/{contactId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID franchiseId, @PathVariable UUID contactId) {
        service.delete(franchiseId, contactId);
    }

    @PostMapping("/test")
    public NotificationDispatchSummaryResponse test(@PathVariable UUID franchiseId, @RequestBody(required = false) TestWhatsAppNotificationRequest request) {
        return service.sendTestMessage(franchiseId, request);
    }
}
