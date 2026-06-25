package br.com.vavive.gptmaker.service;

import br.com.vavive.gptmaker.domain.entity.Franchise;
import br.com.vavive.gptmaker.domain.entity.WhatsAppNotificationContact;
import br.com.vavive.gptmaker.dto.NotificationDispatchSummaryResponse;
import br.com.vavive.gptmaker.dto.TestWhatsAppNotificationRequest;
import br.com.vavive.gptmaker.dto.WhatsAppNotificationContactRequest;
import br.com.vavive.gptmaker.dto.WhatsAppNotificationContactResponse;
import br.com.vavive.gptmaker.repository.FranchiseRepository;
import br.com.vavive.gptmaker.repository.WhatsAppNotificationContactRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class WhatsAppNotificationContactService {
    private final CurrentUserService currentUserService;
    private final FranchiseRepository franchiseRepository;
    private final WhatsAppNotificationContactRepository contactRepository;
    private final WhatsAppNotificationService notificationService;

    public WhatsAppNotificationContactService(
        CurrentUserService currentUserService,
        FranchiseRepository franchiseRepository,
        WhatsAppNotificationContactRepository contactRepository,
        WhatsAppNotificationService notificationService
    ) {
        this.currentUserService = currentUserService;
        this.franchiseRepository = franchiseRepository;
        this.contactRepository = contactRepository;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public List<WhatsAppNotificationContactResponse> list(UUID franchiseId) {
        Franchise franchise = requireFranchise(franchiseId);
        return contactRepository.findByFranchiseIdOrderByNameAsc(franchiseId).stream()
            .map(contact -> toResponse(franchise, contact))
            .toList();
    }

    @Transactional
    public WhatsAppNotificationContactResponse create(UUID franchiseId, WhatsAppNotificationContactRequest request) {
        Franchise franchise = requireFranchise(franchiseId);
        String name = requireName(request == null ? null : request.name());
        String phone = normalizePhone(request == null ? null : request.phone());
        boolean active = request == null || request.active() == null || request.active();

        WhatsAppNotificationContact saved = contactRepository.save(new WhatsAppNotificationContact(franchise, name, phone, active));
        return toResponse(franchise, saved);
    }

    @Transactional
    public WhatsAppNotificationContactResponse update(UUID franchiseId, UUID contactId, WhatsAppNotificationContactRequest request) {
        Franchise franchise = requireFranchise(franchiseId);
        WhatsAppNotificationContact contact = contactRepository.findByIdAndFranchiseId(contactId, franchiseId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contato de notificacao nao encontrado."));

        contact.setName(requireName(request == null ? null : request.name()));
        contact.setPhone(normalizePhone(request == null ? null : request.phone()));
        contact.setActive(request != null && request.active() != null ? request.active() : contact.isActive());
        return toResponse(franchise, contactRepository.save(contact));
    }

    @Transactional
    public void delete(UUID franchiseId, UUID contactId) {
        requireFranchise(franchiseId);
        WhatsAppNotificationContact contact = contactRepository.findByIdAndFranchiseId(contactId, franchiseId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contato de notificacao nao encontrado."));
        contact.setActive(false);
        contactRepository.save(contact);
    }

    @Transactional
    public NotificationDispatchSummaryResponse sendTestMessage(UUID franchiseId, TestWhatsAppNotificationRequest request) {
        requireFranchise(franchiseId);
        return notificationService.sendTestMessage(franchiseId, request == null ? null : request.message());
    }

    private Franchise requireFranchise(UUID franchiseId) {
        currentUserService.requireSuperAdmin("Apenas SUPER_ADMIN pode configurar notificacoes de agendamento.");
        return franchiseRepository.findById(franchiseId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Franquia nao encontrada."));
    }

    private String requireName(String value) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nome do contato e obrigatorio.");
        }
        return value.trim();
    }

    private String normalizePhone(String value) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Telefone do contato e obrigatorio.");
        }
        String normalized = value.replaceAll("[^0-9]", "");
        if (normalized.length() < 10 || normalized.length() > 15) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Telefone invalido. Use apenas numeros com 10 a 15 digitos.");
        }
        return normalized;
    }

    private WhatsAppNotificationContactResponse toResponse(Franchise franchise, WhatsAppNotificationContact contact) {
        return new WhatsAppNotificationContactResponse(
            contact.getId(),
            franchise.getId(),
            franchise.getName(),
            contact.getName(),
            contact.getPhone(),
            contact.isActive(),
            contact.getCreatedAt(),
            contact.getUpdatedAt()
        );
    }
}
