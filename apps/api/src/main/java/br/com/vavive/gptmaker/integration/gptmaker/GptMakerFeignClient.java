package br.com.vavive.gptmaker.integration.gptmaker;

import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerCreateIntentRequest;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerCreateIntentResponse;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerCreateTrainingRequest;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerCreateTrainingResponse;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerWorkspaceResponse;
import org.springframework.cloud.openfeign.FeignClient;
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

    @GetMapping("/v2/workspaces")
    GptMakerWorkspaceResponse[] listWorkspaces();
}
