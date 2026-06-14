package br.com.vavive.gptmaker.controller;

import br.com.vavive.gptmaker.dto.CreateFranchiseRequest;
import br.com.vavive.gptmaker.dto.CreateFranchiseAdminUserRequest;
import br.com.vavive.gptmaker.dto.FranchiseGptMakerConnectionResponse;
import br.com.vavive.gptmaker.dto.FranchiseResponse;
import br.com.vavive.gptmaker.dto.FranchiseSetupResponse;
import br.com.vavive.gptmaker.dto.GptMakerAgentOptionResponse;
import br.com.vavive.gptmaker.dto.GptMakerWorkspaceOptionResponse;
import br.com.vavive.gptmaker.dto.PublishAgentResponse;
import br.com.vavive.gptmaker.dto.ProvisionFranchiseGptMakerAgentRequest;
import br.com.vavive.gptmaker.dto.UpdateFranchiseSetupRequest;
import br.com.vavive.gptmaker.dto.UpdateFranchiseGptMakerConnectionRequest;
import br.com.vavive.gptmaker.dto.UserResponse;
import br.com.vavive.gptmaker.dto.VaviveDefaultContextResponse;
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

    @GetMapping("/franchises/{id}/admin-user")
    public UserResponse getAdminUser(@PathVariable UUID id) {
        return franchiseService.getAdminUser(id);
    }

    @PostMapping("/franchises/{id}/admin-user")
    public UserResponse createAdminUser(@PathVariable UUID id, @Valid @RequestBody CreateFranchiseAdminUserRequest request) {
        return franchiseService.createAdminUser(id, request);
    }

    @GetMapping("/franchises/{id}/gptmaker-connection")
    public FranchiseGptMakerConnectionResponse getGptMakerConnection(@PathVariable UUID id) {
        return franchiseService.getGptMakerConnection(id);
    }

    @PostMapping("/franchises/{id}/gptmaker-connection")
    public FranchiseGptMakerConnectionResponse updateGptMakerConnection(@PathVariable UUID id, @Valid @RequestBody UpdateFranchiseGptMakerConnectionRequest request) {
        return franchiseService.updateGptMakerConnection(id, request);
    }

    @GetMapping("/franchises/gptmaker/workspaces")
    public List<GptMakerWorkspaceOptionResponse> listWorkspaces() {
        return franchiseService.listWorkspaces();
    }

    @GetMapping("/franchises/gptmaker/workspaces/{workspaceId}/agents")
    public List<GptMakerAgentOptionResponse> listWorkspaceAgents(@PathVariable String workspaceId) {
        return franchiseService.listWorkspaceAgents(workspaceId);
    }

    @GetMapping("/franchises/{id}/gptmaker/default-context")
    public VaviveDefaultContextResponse getDefaultContext(@PathVariable UUID id) {
        return franchiseService.getDefaultContext(id);
    }

    @PostMapping("/franchises/{id}/gptmaker/agent")
    public FranchiseGptMakerConnectionResponse provisionGptMakerAgent(@PathVariable UUID id, @Valid @RequestBody ProvisionFranchiseGptMakerAgentRequest request) {
        return franchiseService.provisionGptMakerAgent(id, request);
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
