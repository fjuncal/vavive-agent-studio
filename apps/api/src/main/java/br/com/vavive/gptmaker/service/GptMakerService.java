package br.com.vavive.gptmaker.service;

import br.com.vavive.gptmaker.dto.GptMakerAgentOptionResponse;
import br.com.vavive.gptmaker.dto.GptMakerWorkspaceOptionResponse;
import br.com.vavive.gptmaker.integration.gptmaker.GptMakerClient;
import br.com.vavive.gptmaker.integration.gptmaker.GptMakerClient.GptMakerIntegrationException;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerHealthResponse;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class GptMakerService {
    private final GptMakerClient gptMakerClient;

    public GptMakerService(GptMakerClient gptMakerClient) {
        this.gptMakerClient = gptMakerClient;
    }

    public GptMakerHealthResponse health() {
        var status = gptMakerClient.health();
        return new GptMakerHealthResponse(
            status.baseUrl(),
            status.mockEnabled(),
            status.tokenConfigured(),
            status.status(),
            status.message()
        );
    }

    public List<GptMakerWorkspaceOptionResponse> listWorkspaces() {
        try {
            return gptMakerClient.listWorkspaces().stream()
                .map(item -> new GptMakerWorkspaceOptionResponse(item.id(), item.name()))
                .toList();
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, exception.getMessage());
        }
    }

    public List<GptMakerAgentOptionResponse> listAgents(String workspaceId) {
        try {
            return gptMakerClient.listAgents(workspaceId).stream()
                .map(item -> new GptMakerAgentOptionResponse(
                    item.id(),
                    item.name(),
                    item.behavior(),
                    item.avatar(),
                    item.jobName(),
                    item.jobSite(),
                    item.jobDescription()
                ))
                .toList();
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, exception.getMessage());
        }
    }

    public JsonNode debugWorkspaces() {
        try {
            return gptMakerClient.debugListWorkspaces();
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, exception.getMessage());
        }
    }

    public JsonNode debugAgents(String workspaceId) {
        try {
            return gptMakerClient.debugListAgents(workspaceId);
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, exception.getMessage());
        }
    }
}
