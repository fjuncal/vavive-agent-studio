package br.com.vavive.gptmaker.controller;

import br.com.vavive.gptmaker.dto.CreateFranchiseRequest;
import br.com.vavive.gptmaker.dto.CreateFranchiseAdminUserRequest;
import br.com.vavive.gptmaker.dto.CreateFullFranchiseRequest;
import br.com.vavive.gptmaker.dto.CreateFullFranchiseResponse;
import br.com.vavive.gptmaker.dto.CriticalChangeRequest;
import br.com.vavive.gptmaker.dto.FranchiseChannelResponse;
import br.com.vavive.gptmaker.dto.FranchiseGptMakerConnectionResponse;
import br.com.vavive.gptmaker.dto.FranchiseResponse;
import br.com.vavive.gptmaker.dto.FranchiseSetupResponse;
import br.com.vavive.gptmaker.dto.FranchiseWorkspaceMappingResponse;
import br.com.vavive.gptmaker.dto.GptMakerAgentOptionResponse;
import br.com.vavive.gptmaker.dto.GptMakerWorkspaceOptionResponse;
import br.com.vavive.gptmaker.dto.PublishAgentResponse;
import br.com.vavive.gptmaker.dto.ProvisionFranchiseGptMakerAgentRequest;
import br.com.vavive.gptmaker.dto.UpdateFranchiseSetupRequest;
import br.com.vavive.gptmaker.dto.UpdateFranchiseGptMakerConnectionRequest;
import br.com.vavive.gptmaker.dto.UpdateFranchiseGptMakerWorkspaceRequest;
import br.com.vavive.gptmaker.dto.UserResponse;
import br.com.vavive.gptmaker.dto.VaviveDefaultContextResponse;
import br.com.vavive.gptmaker.service.ChannelService;
import br.com.vavive.gptmaker.service.FranchiseService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class FranchiseController {
    private final FranchiseService franchiseService;
    private final ChannelService channelService;

    public FranchiseController(FranchiseService franchiseService, ChannelService channelService) {
        this.franchiseService = franchiseService;
        this.channelService = channelService;
    }

    @GetMapping("/franchises")
    public List<FranchiseResponse> list() {
        return franchiseService.list();
    }

    @PostMapping("/franchises")
    public FranchiseResponse create(@Valid @RequestBody CreateFranchiseRequest request) {
        return franchiseService.create(request);
    }

    @PostMapping("/franchises/full")
    public CreateFullFranchiseResponse createFull(@Valid @RequestBody CreateFullFranchiseRequest request) {
        return franchiseService.createFull(request);
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

    @GetMapping("/franchises/gptmaker/available-workspaces")
    public List<GptMakerWorkspaceOptionResponse> listAvailableWorkspaces() {
        return franchiseService.listAvailableWorkspaces();
    }

    @GetMapping("/franchises/gptmaker/workspace-mapping")
    public FranchiseWorkspaceMappingResponse workspaceMapping() {
        return franchiseService.workspaceMapping();
    }

    @GetMapping("/franchises/gptmaker/workspaces/{workspaceId}/agents")
    public List<GptMakerAgentOptionResponse> listWorkspaceAgents(@PathVariable String workspaceId) {
        return franchiseService.listWorkspaceAgents(workspaceId);
    }

    @PostMapping("/franchises/{id}/gptmaker/workspace")
    public FranchiseGptMakerConnectionResponse linkGptMakerWorkspace(@PathVariable UUID id, @Valid @RequestBody UpdateFranchiseGptMakerWorkspaceRequest request) {
        return franchiseService.linkGptMakerWorkspace(id, request);
    }

    @DeleteMapping("/franchises/{id}/gptmaker/workspace")
    public FranchiseGptMakerConnectionResponse unlinkGptMakerWorkspace(@PathVariable UUID id, @RequestBody CriticalChangeRequest request) {
        return franchiseService.unlinkGptMakerWorkspace(id, request);
    }

    @GetMapping("/franchises/{id}/gptmaker/default-context")
    public VaviveDefaultContextResponse getDefaultContext(@PathVariable UUID id) {
        return franchiseService.getDefaultContext(id);
    }

    @PostMapping("/franchises/{id}/gptmaker/agent")
    public FranchiseGptMakerConnectionResponse provisionGptMakerAgent(@PathVariable UUID id, @Valid @RequestBody ProvisionFranchiseGptMakerAgentRequest request) {
        return franchiseService.provisionGptMakerAgent(id, request);
    }

    @DeleteMapping("/franchises/{id}/gptmaker/agent")
    public FranchiseGptMakerConnectionResponse clearGptMakerAgent(@PathVariable UUID id, @RequestBody CriticalChangeRequest request) {
        return franchiseService.clearGptMakerAgent(id, request);
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

    @GetMapping("/franchises/{id}/channels")
    public List<FranchiseChannelResponse> listChannels(@PathVariable UUID id) {
        return channelService.list(id);
    }

    @PostMapping("/franchises/{id}/channels/sync")
    public List<FranchiseChannelResponse> syncChannels(@PathVariable UUID id) {
        return channelService.sync(id);
    }

    @PostMapping("/franchises/{id}/channels")
    public Object createChannel(@PathVariable UUID id, @RequestBody java.util.Map<String, String> request) {
        return channelService.create(id, request.get("name"), request.get("type"));
    }

    @GetMapping("/franchises/{id}/credits")
    public Object getWorkspaceCredits(@PathVariable UUID id) {
        return franchiseService.getWorkspaceCredits(id);
    }

    @GetMapping("/franchises/{id}/gptmaker/agent-settings")
    public Object getAgentSettings(@PathVariable UUID id) {
        return franchiseService.getAgentSettings(id);
    }

    @PostMapping("/franchises/{id}/gptmaker/agent-settings")
    public Object updateAgentSettings(@PathVariable UUID id, @RequestBody Object settings) {
        return franchiseService.updateAgentSettings(id, settings);
    }

    @GetMapping("/franchises/{id}/gptmaker/agent-webhooks")
    public Object getAgentWebhooks(@PathVariable UUID id) {
        return franchiseService.getAgentWebhooks(id);
    }

    @PostMapping("/franchises/{id}/gptmaker/agent-webhooks")
    public Object updateAgentWebhooks(@PathVariable UUID id, @RequestBody Object webhooks) {
        return franchiseService.updateAgentWebhooks(id, webhooks);
    }

    @GetMapping("/franchises/{id}/gptmaker/intentions")
    public Object listIntentions(@PathVariable UUID id) {
        return franchiseService.listIntentions(id);
    }

    @GetMapping("/franchises/{id}/gptmaker/trainings")
    public Object listTrainings(@PathVariable UUID id) {
        return franchiseService.listTrainings(id);
    }

    @DeleteMapping("/franchises/{id}/gptmaker/trainings/{trainingId}")
    public Object deleteTraining(@PathVariable UUID id, @PathVariable String trainingId) {
        return franchiseService.deleteTraining(id, trainingId);
    }

    @GetMapping("/franchises/{id}/gptmaker/transfer-rules")
    public Object listTransferRules(@PathVariable UUID id) {
        return franchiseService.listTransferRules(id);
    }

    @GetMapping("/franchises/{id}/gptmaker/idle-actions")
    public Object listIdleActions(@PathVariable UUID id) {
        return franchiseService.listIdleActions(id);
    }
}
