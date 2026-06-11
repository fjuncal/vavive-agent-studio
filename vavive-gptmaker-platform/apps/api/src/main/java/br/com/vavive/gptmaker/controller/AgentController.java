package br.com.vavive.gptmaker.controller;

import br.com.vavive.gptmaker.dto.AgentResponse;
import br.com.vavive.gptmaker.dto.CreateIntentRequest;
import br.com.vavive.gptmaker.dto.CreateRuleRequest;
import br.com.vavive.gptmaker.dto.CreateTrainingRequest;
import br.com.vavive.gptmaker.dto.IntentResponse;
import br.com.vavive.gptmaker.dto.RuleResponse;
import br.com.vavive.gptmaker.dto.TrainingResponse;
import br.com.vavive.gptmaker.service.AgentService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AgentController {
    private final AgentService agentService;

    public AgentController(AgentService agentService) {
        this.agentService = agentService;
    }

    @GetMapping("/agents")
    public List<AgentResponse> list() {
        return agentService.list();
    }

    @PostMapping("/agents/{id}/trainings")
    public TrainingResponse addTraining(@PathVariable UUID id, @Valid @RequestBody CreateTrainingRequest request) {
        return agentService.addTraining(id, request);
    }

    @PostMapping("/agents/{id}/intents")
    public IntentResponse addIntent(@PathVariable UUID id, @Valid @RequestBody CreateIntentRequest request) {
        return agentService.addIntent(id, request);
    }

    @PostMapping("/agents/{id}/rules")
    public RuleResponse addRule(@PathVariable UUID id, @Valid @RequestBody CreateRuleRequest request) {
        return agentService.addRule(id, request);
    }
}
