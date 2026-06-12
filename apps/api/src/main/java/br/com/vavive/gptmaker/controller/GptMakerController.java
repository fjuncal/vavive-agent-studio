package br.com.vavive.gptmaker.controller;

import br.com.vavive.gptmaker.dto.GptMakerAgentOptionResponse;
import br.com.vavive.gptmaker.dto.GptMakerWorkspaceOptionResponse;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerHealthResponse;
import com.fasterxml.jackson.databind.JsonNode;
import br.com.vavive.gptmaker.service.GptMakerService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class GptMakerController {
    private final GptMakerService gptMakerService;

    public GptMakerController(GptMakerService gptMakerService) {
        this.gptMakerService = gptMakerService;
    }

    @GetMapping("/gptmaker/health")
    public GptMakerHealthResponse health() {
        return gptMakerService.health();
    }

    @GetMapping("/gptmaker/workspaces")
    public List<GptMakerWorkspaceOptionResponse> listWorkspaces() {
        return gptMakerService.listWorkspaces();
    }

    @GetMapping("/gptmaker/workspaces/{workspaceId}/agents")
    public List<GptMakerAgentOptionResponse> listAgents(@PathVariable String workspaceId) {
        return gptMakerService.listAgents(workspaceId);
    }

    @GetMapping("/gptmaker/debug/workspaces")
    public JsonNode debugWorkspaces() {
        return gptMakerService.debugWorkspaces();
    }

    @GetMapping("/gptmaker/debug/agents/{workspaceId}")
    public JsonNode debugAgents(@PathVariable String workspaceId) {
        return gptMakerService.debugAgents(workspaceId);
    }
}
