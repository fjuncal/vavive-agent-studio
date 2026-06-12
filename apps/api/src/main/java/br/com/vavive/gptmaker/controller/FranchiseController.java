package br.com.vavive.gptmaker.controller;

import br.com.vavive.gptmaker.dto.CreateFranchiseRequest;
import br.com.vavive.gptmaker.dto.FranchiseResponse;
import br.com.vavive.gptmaker.dto.FranchiseSetupResponse;
import br.com.vavive.gptmaker.dto.PublishAgentResponse;
import br.com.vavive.gptmaker.dto.UpdateFranchiseSetupRequest;
import br.com.vavive.gptmaker.service.FranchiseService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class FranchiseController {
    private final FranchiseService franchiseService;

    public FranchiseController(FranchiseService franchiseService) {
        this.franchiseService = franchiseService;
    }

    @GetMapping("/franchises")
    public List<FranchiseResponse> list() {
        return franchiseService.list();
    }

    @PostMapping("/franchises")
    public FranchiseResponse create(@Valid @RequestBody CreateFranchiseRequest request) {
        return franchiseService.create(request);
    }

    @GetMapping("/franchises/{id}")
    public FranchiseResponse get(@PathVariable UUID id) {
        return franchiseService.get(id);
    }

    @GetMapping("/franchises/{id}/setup")
    public FranchiseSetupResponse getSetup(@PathVariable UUID id) {
        return franchiseService.getSetup(id);
    }

    @PostMapping("/franchises/{id}/setup")
    public FranchiseSetupResponse updateSetup(@PathVariable UUID id, @RequestBody UpdateFranchiseSetupRequest request) {
        return franchiseService.updateSetup(id, request);
    }

    @PostMapping("/franchises/{id}/publish-agent")
    public PublishAgentResponse publishAgent(@PathVariable UUID id) {
        return franchiseService.publishAgent(id);
    }
}
