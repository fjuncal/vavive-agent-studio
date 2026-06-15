package br.com.vavive.gptmaker.service;

import br.com.vavive.gptmaker.dto.GptMakerAgentOptionResponse;
import br.com.vavive.gptmaker.dto.GptMakerWorkspaceOptionResponse;
import br.com.vavive.gptmaker.integration.gptmaker.GptMakerClient;
import br.com.vavive.gptmaker.integration.gptmaker.GptMakerClient.GptMakerIntegrationException;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerDiagnosticsResponse;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerAgentDiagnosticsResponse;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerHealthResponse;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerRawDiagnosticsResponse;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class GptMakerService {
    private final GptMakerClient gptMakerClient;
    private final CurrentUserService currentUserService;

    public GptMakerService(GptMakerClient gptMakerClient, CurrentUserService currentUserService) {
        this.gptMakerClient = gptMakerClient;
        this.currentUserService = currentUserService;
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

    public GptMakerDiagnosticsResponse diagnostics() {
        requireSuperAdmin();
        return gptMakerClient.diagnostics();
    }

    public List<GptMakerWorkspaceOptionResponse> listWorkspaces() {
        requireSuperAdmin();
        try {
            return gptMakerClient.listWorkspaces().stream()
                .map(item -> new GptMakerWorkspaceOptionResponse(item.id(), item.name()))
                .toList();
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, exception.getMessage());
        }
    }

    public List<GptMakerAgentOptionResponse> listAgents(String workspaceId) {
        requireSuperAdmin();
        try {
            return gptMakerClient.listAgents(workspaceId).stream()
                .map(item -> new GptMakerAgentOptionResponse(
                    item.id(),
                    item.name(),
                    item.behavior(),
                    item.avatar(),
                    item.communicationType(),
                    item.type(),
                    item.jobName(),
                    item.jobSite(),
                    item.jobDescription()
                ))
                .toList();
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, exception.getMessage());
        }
    }

    public GptMakerRawDiagnosticsResponse rawWorkspaceDiagnostics() {
        requireSuperAdmin();
        return gptMakerClient.rawWorkspaceDiagnostics();
    }

    public GptMakerAgentDiagnosticsResponse agentDiagnostics(String workspaceId) {
        requireSuperAdmin();
        return gptMakerClient.agentDiagnostics(workspaceId);
    }

    public com.fasterxml.jackson.databind.JsonNode debugAgents(String workspaceId) {
        requireSuperAdmin();
        try {
            return gptMakerClient.debugListAgents(workspaceId);
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, exception.getMessage());
        }
    }

    private void requireSuperAdmin() {
        currentUserService.requireSuperAdmin("Apenas SUPER_ADMIN pode acessar esta configuracao GPTMaker.");
    }
}
