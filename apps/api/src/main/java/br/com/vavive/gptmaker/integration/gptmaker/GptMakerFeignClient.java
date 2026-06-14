package br.com.vavive.gptmaker.integration.gptmaker;

import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerCreateIntentRequest;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerCreateIntentResponse;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerCreateTrainingRequest;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerCreateTrainingResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(
    name = "gptMakerFeignClient",
    url = "${gptmaker.base-url}",
    configuration = GptMakerFeignConfig.class
)
public interface GptMakerFeignClient {
    @GetMapping("/v2/workspaces")
    ResponseEntity<String> listWorkspaces();

    @GetMapping("/v2/workspace/{workspaceId}/agents")
    ResponseEntity<String> listAgents(@PathVariable String workspaceId);

    @PostMapping("/v2/agent/{agentId}/trainings")
    GptMakerCreateTrainingResponse createTraining(
        @PathVariable String agentId,
        @RequestBody GptMakerCreateTrainingRequest request
    );

    @PostMapping("/v2/agent/{agentId}/intentions")
    GptMakerCreateIntentResponse createIntent(
        @PathVariable String agentId,
        @RequestBody GptMakerCreateIntentRequest request
    );
}
