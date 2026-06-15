package br.com.vavive.gptmaker.controller;

import br.com.vavive.gptmaker.dto.CreateDefaultAgentTextRequest;
import br.com.vavive.gptmaker.dto.DefaultAgentTextResponse;
import br.com.vavive.gptmaker.dto.UpdateDefaultAgentTextRequest;
import br.com.vavive.gptmaker.service.DefaultAgentTextService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DefaultAgentTextController {
    private final DefaultAgentTextService service;

    public DefaultAgentTextController(DefaultAgentTextService service) {
        this.service = service;
    }

    @GetMapping("/default-agent-texts")
    public List<DefaultAgentTextResponse> list() {
        return service.list();
    }

    @PostMapping("/default-agent-texts")
    public DefaultAgentTextResponse create(@Valid @RequestBody CreateDefaultAgentTextRequest request) {
        return service.create(request);
    }

    @PutMapping("/default-agent-texts/{id}")
    public DefaultAgentTextResponse update(@PathVariable UUID id, @Valid @RequestBody UpdateDefaultAgentTextRequest request) {
        return service.update(id, request);
    }

    @PatchMapping("/default-agent-texts/{id}/toggle")
    public DefaultAgentTextResponse toggle(@PathVariable UUID id) {
        return service.toggle(id);
    }
}
