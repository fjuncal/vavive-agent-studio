package br.com.vavive.gptmaker.integration.gptmaker;

import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerCreateIntentRequest;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerCreateIntentResponse;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerCreateAgentRequest;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerCreateChannelRequest;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerCreateTrainingRequest;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerCreateTrainingResponse;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerConversationRequest;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerSendChatMessageRequest;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerSimpleSuccessResponse;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerStartHumanResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(
    name = "gptMakerFeignClient",
    url = "${gptmaker.base-url}",
    configuration = GptMakerFeignConfig.class
)
public interface GptMakerFeignClient {
    @GetMapping("/v2/workspaces")
    ResponseEntity<String> listWorkspaces();

    @GetMapping("/v2/workspace/{workspaceId}/credits")
    ResponseEntity<String> getWorkspaceCredits(@PathVariable String workspaceId);

    @GetMapping("/v2/workspace/{workspaceId}/agents")
    ResponseEntity<String> listAgents(@PathVariable String workspaceId);

    @PostMapping("/v2/workspace/{workspaceId}/agents")
    ResponseEntity<String> createAgent(
        @PathVariable String workspaceId,
        @RequestBody GptMakerCreateAgentRequest request
    );

    @GetMapping("/v2/agent/{agentId}")
    ResponseEntity<String> getAgent(@PathVariable String agentId);

    @PutMapping("/v2/agent/{agentId}/active")
    ResponseEntity<String> activateAgent(@PathVariable String agentId);

    @PutMapping("/v2/agent/{agentId}/inactive")
    ResponseEntity<String> inactivateAgent(@PathVariable String agentId);

    @DeleteMapping("/v2/agent/{agentId}")
    ResponseEntity<String> deleteAgent(@PathVariable String agentId);

    @PutMapping("/v2/agent/{agentId}")
    ResponseEntity<String> updateAgent(@PathVariable String agentId, @RequestBody Object request);

    @PutMapping("/assistants/{assistantId}")
    ResponseEntity<String> updateAssistant(@PathVariable String assistantId, @RequestBody Object request);

    @GetMapping("/v2/agent/{agentId}/settings")
    ResponseEntity<String> getAgentSettings(@PathVariable String agentId);

    @PutMapping("/v2/agent/{agentId}/settings")
    ResponseEntity<String> updateAgentSettings(@PathVariable String agentId, @RequestBody Object settings);

    @GetMapping("/v2/agent/{agentId}/webhooks")
    ResponseEntity<String> getAgentWebhooks(@PathVariable String agentId);

    @PutMapping("/v2/agent/{agentId}/webhooks")
    ResponseEntity<String> updateAgentWebhooks(@PathVariable String agentId, @RequestBody Object webhooks);

    @PostMapping("/v2/agent/{agentId}/conversation")
    ResponseEntity<String> sendConversation(
        @PathVariable String agentId,
        @RequestBody GptMakerConversationRequest request
    );

    @GetMapping("/v2/agent/{agentId}/intentions")
    ResponseEntity<String> listIntentions(@PathVariable String agentId);

    @PostMapping("/v2/agent/{agentId}/intentions")
    GptMakerCreateIntentResponse createIntent(
        @PathVariable String agentId,
        @RequestBody GptMakerCreateIntentRequest request
    );

    @PostMapping("/v2/agent/{agentId}/intentions")
    ResponseEntity<String> createIntentionRaw(
        @PathVariable String agentId,
        @RequestBody Object intention
    );

    @GetMapping("/v2/agent/{agentId}/trainings")
    ResponseEntity<String> listTrainings(@PathVariable String agentId);

    @PostMapping("/v2/agent/{agentId}/trainings")
    GptMakerCreateTrainingResponse createTraining(
        @PathVariable String agentId,
        @RequestBody GptMakerCreateTrainingRequest request
    );

    @DeleteMapping("/v2/training/{trainingId}")
    ResponseEntity<String> deleteTraining(@PathVariable String trainingId);

    @GetMapping("/v2/interaction/{interactionId}/messages")
    ResponseEntity<String> listInteractionMessages(@PathVariable String interactionId);

    @GetMapping("/v2/workspace/{workspaceId}/channels")
    ResponseEntity<String> listWorkspaceChannels(@PathVariable String workspaceId);

    @PostMapping("/v2/channel/workspace/{workspaceId}")
    ResponseEntity<String> createChannel(
        @PathVariable String workspaceId,
        @RequestBody GptMakerCreateChannelRequest request
    );

    @GetMapping("/v2/channel/{channelId}/qr-code")
    ResponseEntity<String> getChannelQRCode(@PathVariable String channelId);

    @PutMapping("/v2/channel/{channelId}/edit")
    ResponseEntity<String> editChannel(
        @PathVariable String channelId,
        @RequestBody Object editRequest
    );

    @DeleteMapping("/v2/channel/{channelId}")
    ResponseEntity<String> deleteChannel(@PathVariable String channelId);

    @GetMapping("/v2/workspace/{workspaceId}/chats")
    ResponseEntity<String> listChats(@PathVariable String workspaceId);

    @GetMapping("/v2/chat/{chatId}/messages")
    ResponseEntity<String> listChatMessages(@PathVariable String chatId);

    @PutMapping("/v2/chat/{chatId}/start-human")
    GptMakerStartHumanResponse startHuman(@PathVariable String chatId);

    @PutMapping("/v2/chat/{chatId}/stop-human")
    GptMakerSimpleSuccessResponse stopHuman(@PathVariable String chatId);

    @PostMapping("/v2/chat/{chatId}/send-message")
    GptMakerSimpleSuccessResponse sendChatMessage(@PathVariable String chatId, @RequestBody GptMakerSendChatMessageRequest request);

    @GetMapping("/v2/transfer-rules/agent/{agentId}")
    ResponseEntity<String> listTransferRules(@PathVariable String agentId);

    @PostMapping("/v2/transfer-rules/agent/{agentId}")
    ResponseEntity<String> createTransferRule(@PathVariable String agentId, @RequestBody Object rule);

    @PutMapping("/v2/transfer-rule/{ruleId}")
    ResponseEntity<String> updateTransferRule(@PathVariable String ruleId, @RequestBody Object rule);

    @DeleteMapping("/v2/transfer-rule/{ruleId}")
    ResponseEntity<String> deleteTransferRule(@PathVariable String ruleId);

    @GetMapping("/v2/idle-actions/agent/{agentId}")
    ResponseEntity<String> listIdleActions(@PathVariable String agentId);

    @PostMapping("/v2/idle-actions/agent/{agentId}")
    ResponseEntity<String> createIdleAction(@PathVariable String agentId, @RequestBody Object action);

    @PutMapping("/v2/idle-action/{actionId}")
    ResponseEntity<String> updateIdleAction(@PathVariable String actionId, @RequestBody Object action);

    @DeleteMapping("/v2/idle-action/{actionId}")
    ResponseEntity<String> deleteIdleAction(@PathVariable String actionId);

    @PutMapping("/v2/training/{trainingId}")
    ResponseEntity<String> updateTraining(@PathVariable String trainingId, @RequestBody Object training);

    @PutMapping("/v2/intention/{intentionId}")
    ResponseEntity<String> updateIntention(@PathVariable String intentionId, @RequestBody Object intention);

    @DeleteMapping("/v2/intention/{intentionId}")
    ResponseEntity<String> deleteIntention(@PathVariable String intentionId);
}
