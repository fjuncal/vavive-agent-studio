package br.com.vavive.gptmaker.controller;

import br.com.vavive.gptmaker.dto.ConversationMessageResponse;
import br.com.vavive.gptmaker.dto.ConversationSummaryResponse;
import br.com.vavive.gptmaker.dto.SendAgentConversationRequest;
import br.com.vavive.gptmaker.dto.SendAgentConversationResponse;
import br.com.vavive.gptmaker.dto.StartHumanTakeoverResponse;
import br.com.vavive.gptmaker.service.ConversationService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ConversationController {
    private final ConversationService conversationService;

    public ConversationController(ConversationService conversationService) {
        this.conversationService = conversationService;
    }

    @GetMapping("/conversations")
    public List<ConversationSummaryResponse> list(@RequestParam(required = false) UUID franchiseId) {
        return conversationService.list(franchiseId);
    }

    @GetMapping("/conversations/{id}/messages")
    public List<ConversationMessageResponse> listMessages(@PathVariable UUID id) {
        return conversationService.listMessages(id);
    }

    @PutMapping("/conversations/{id}/start-human")
    public StartHumanTakeoverResponse startHuman(@PathVariable UUID id) {
        return conversationService.startHuman(id);
    }

    @PostMapping("/conversations/test-agent")
    public SendAgentConversationResponse testAgent(@Valid @RequestBody SendAgentConversationRequest request) {
        return conversationService.testAgent(request);
    }
}
