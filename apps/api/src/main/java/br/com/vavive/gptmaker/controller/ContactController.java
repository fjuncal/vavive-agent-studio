package br.com.vavive.gptmaker.controller;

import br.com.vavive.gptmaker.dto.ContactResponse;
import br.com.vavive.gptmaker.dto.UpdateContactRequest;
import br.com.vavive.gptmaker.service.ContactService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ContactController {
    private final ContactService contactService;

    public ContactController(ContactService contactService) {
        this.contactService = contactService;
    }

    @GetMapping("/contacts")
    public List<ContactResponse> list(
        @RequestParam(required = false) Integer page,
        @RequestParam(required = false) Integer pageSize
    ) {
        return contactService.list(page, pageSize);
    }

    @GetMapping("/contacts/{contactId}")
    public ContactResponse get(@PathVariable String contactId) {
        return contactService.get(contactId);
    }

    @PutMapping("/contacts/{contactId}")
    public ContactResponse update(@PathVariable String contactId, @RequestBody UpdateContactRequest request) {
        return contactService.update(contactId, request);
    }

    @DeleteMapping("/contacts/{contactId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String contactId) {
        contactService.delete(contactId);
    }
}
