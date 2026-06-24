package br.com.vavive.gptmaker.service;

import br.com.vavive.gptmaker.domain.entity.Franchise;
import br.com.vavive.gptmaker.domain.entity.User;
import br.com.vavive.gptmaker.domain.enums.UserRole;
import br.com.vavive.gptmaker.dto.ContactResponse;
import br.com.vavive.gptmaker.dto.UpdateContactRequest;
import br.com.vavive.gptmaker.integration.gptmaker.GptMakerClient;
import br.com.vavive.gptmaker.integration.gptmaker.GptMakerClient.GptMakerIntegrationException;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerContactResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ContactService {
    private final CurrentUserService currentUserService;
    private final GptMakerClient gptMakerClient;
    private final ObjectMapper objectMapper;

    public ContactService(
        CurrentUserService currentUserService,
        GptMakerClient gptMakerClient,
        ObjectMapper objectMapper
    ) {
        this.currentUserService = currentUserService;
        this.gptMakerClient = gptMakerClient;
        this.objectMapper = objectMapper;
    }

    public List<ContactResponse> list(Integer page, Integer pageSize) {
        Franchise franchise = requireFranchiseWorkspace();
        try {
            return gptMakerClient.searchContacts(franchise.getWorkspaceId(), page, pageSize).stream()
                .map(this::toResponse)
                .toList();
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(statusFor(exception), exception.getMessage());
        }
    }

    public ContactResponse get(String contactId) {
        Franchise franchise = requireFranchiseWorkspace();
        try {
            return toResponse(gptMakerClient.getContact(franchise.getWorkspaceId(), contactId));
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(statusFor(exception), exception.getMessage());
        }
    }

    public ContactResponse update(String contactId, UpdateContactRequest request) {
        Franchise franchise = requireFranchiseWorkspace();
        try {
            gptMakerClient.getContact(franchise.getWorkspaceId(), contactId);
            ObjectNode payload = objectMapper.createObjectNode();
            payload.put("id", contactId);
            if (request != null) {
                putIfNotNull(payload, "name", request.name());
                putIfNotNull(payload, "birthday", request.birthday());
                putIfNotNull(payload, "gender", request.gender());
                putIfNotNull(payload, "picture", request.picture());
                putIfNotNull(payload, "phone", request.phone());
                putIfNotNull(payload, "email", request.email());
                putIfNotNull(payload, "jobTitle", request.jobTitle());
                putIfNotNull(payload, "recipient", request.recipient());
                if (request.customFieldValues() != null) {
                    payload.set("customFieldValues", request.customFieldValues());
                }
            }
            GptMakerContactResponse updated = gptMakerClient.updateContact(contactId, payload);
            if (updated.id() == null || updated.id().isBlank()) {
                updated = gptMakerClient.getContact(franchise.getWorkspaceId(), contactId);
            }
            return toResponse(updated);
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(statusFor(exception), exception.getMessage());
        }
    }

    public void delete(String contactId) {
        Franchise franchise = requireFranchiseWorkspace();
        try {
            gptMakerClient.getContact(franchise.getWorkspaceId(), contactId);
            gptMakerClient.deleteContact(contactId);
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(statusFor(exception), exception.getMessage());
        }
    }

    private Franchise requireFranchiseWorkspace() {
        User user = currentUserService.requireCurrentUser();
        if (user.getRole() != UserRole.ADMIN_FRANQUIA) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Contatos estao disponiveis apenas para usuarios da franquia.");
        }
        Franchise franchise = currentUserService.requireFranchise(user);
        if (franchise.getWorkspaceId() == null || franchise.getWorkspaceId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Franquia sem workspace GPTMaker vinculada.");
        }
        return franchise;
    }

    private ContactResponse toResponse(GptMakerContactResponse contact) {
        return new ContactResponse(
            contact.id(),
            contact.name(),
            contact.birthday(),
            contact.gender(),
            contact.picture(),
            contact.phone(),
            contact.email(),
            contact.jobTitle(),
            contact.recipient(),
            contact.customFieldValues()
        );
    }

    private void putIfNotNull(ObjectNode node, String field, String value) {
        if (value != null) {
            node.put(field, value);
        }
    }

    private void putIfNotNull(ObjectNode node, String field, Long value) {
        if (value != null) {
            node.put(field, value);
        }
    }

    private HttpStatus statusFor(GptMakerIntegrationException exception) {
        if ("INVALID_WORKSPACE".equals(exception.getErrorCode())
            || "INVALID_CONTACT".equals(exception.getErrorCode())
            || "MISSING_TOKEN".equals(exception.getErrorCode())) {
            return HttpStatus.BAD_REQUEST;
        }
        if (exception.getHttpStatus() != null && exception.getHttpStatus() == 404) {
            return HttpStatus.NOT_FOUND;
        }
        return HttpStatus.BAD_GATEWAY;
    }
}
