package br.com.vavive.gptmaker.service;

import br.com.vavive.gptmaker.dto.GptMakerAgentOptionResponse;
import br.com.vavive.gptmaker.dto.GptMakerWorkspaceOptionResponse;
import br.com.vavive.gptmaker.integration.gptmaker.GptMakerClient;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerHealthResponse;
import java.util.List;
import org.springframework.stereotype.Service;

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
        return gptMakerClient.listWorkspaces().stream()
            .map(item -> new GptMakerWorkspaceOptionResponse(item.id(), item.name()))
            .toList();
    }

    public List<GptMakerAgentOptionResponse> listAgents(String workspaceId) {
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
    }
}
