package br.com.vavive.gptmaker.integration.gptmaker;

import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerCreateIntentRequest;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerCreateAgentRequest;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerCreateAgentResponse;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerCreateTrainingRequest;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerAgentResponse;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerChannelResponse;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerChatResponse;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerConversationMessageResponse;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerConversationRequest;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerConversationResponse;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerAgentDiagnosticsResponse;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerDiagnosticsResponse;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerErrorResponse;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerRawDiagnosticsResponse;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerSendChatMessageRequest;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerSimpleSuccessResponse;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerStartHumanResponse;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerWorkspaceResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import feign.FeignException;
import feign.RetryableException;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

@Component
public class GptMakerClient {
    private static final String MISSING_TOKEN_MESSAGE = "Token da API GPTMaker nao configurado no backend.";
    private static final String PARSE_ERROR_MESSAGE = "GPTMaker respondeu, mas o backend nao conseguiu interpretar o payload.";
    private static final String WORKSPACE_AGENT_LIMIT_MESSAGE = "Este workspace ja atingiu o limite de agentes no GPTMaker. Escolha outro workspace ou remova um agente diretamente no GPTMaker.";
    private static final String WORKSPACES_ENDPOINT = "/v2/workspaces";
    private static final String AGENTS_ENDPOINT_TEMPLATE = "/v2/workspace/%s/agents";
    private static final Logger log = LoggerFactory.getLogger(GptMakerClient.class);

    private final GptMakerProperties properties;
    private final GptMakerFeignClient feignClient;
    private final ObjectMapper objectMapper;

    public GptMakerClient(
        GptMakerProperties properties,
        GptMakerFeignClient feignClient,
        ObjectMapper objectMapper
    ) {
        this.properties = properties;
        this.feignClient = feignClient;
        this.objectMapper = objectMapper;
    }

    public GptMakerSyncResult sendTraining(String externalAgentId, String title, String content) {
        if (externalAgentId == null || externalAgentId.isBlank()) {
            return failure("PUBLICACAO_FALHOU", "INVALID_AGENT", "Agente GPTMaker sem identificador externo configurado.", null);
        }
        if (title == null || title.isBlank() || content == null || content.isBlank()) {
            return failure("PUBLICACAO_FALHOU", "INVALID_TRAINING", "Titulo e conteudo do treinamento sao obrigatorios.", null);
        }
        if (properties.mockEnabled()) {
            return new GptMakerSyncResult(
                true,
                "PUBLICADO_GPTMAKER_MOCK",
                "mock-training-" + externalAgentId,
                "Publicacao simulada em ambiente de desenvolvimento.",
                true,
                null,
                null
            );
        }
        if (!properties.tokenConfigured()) {
            return failure("PUBLICACAO_FALHOU", "MISSING_TOKEN", MISSING_TOKEN_MESSAGE, null);
        }

        try {
            var response = feignClient.createTraining(
                externalAgentId,
                new GptMakerCreateTrainingRequest("TEXT", content, null, null)
            );
            return new GptMakerSyncResult(
                response.success(),
                response.success() ? "PUBLICADO_GPTMAKER" : "PUBLICACAO_FALHOU",
                normalizeReference(response.reference()),
                response.success() ? "Agente publicado no GPTMaker com sucesso." : "Nao foi possivel publicar o agente no GPTMaker.",
                false,
                null,
                null
            );
        } catch (RetryableException exception) {
            return failure("PUBLICACAO_FALHOU", "GPTMAKER_UNAVAILABLE", "Nao foi possivel publicar no GPTMaker agora. Tente novamente mais tarde.", exception.getMessage());
        } catch (FeignException exception) {
            return failure("PUBLICACAO_FALHOU", resolveErrorCode(exception), resolveFriendlyMessage(exception), extractDetails(exception));
        }
    }

    public GptMakerSyncResult sendIntent(String externalAgentId, String name, String description, String instructions) {
        if (externalAgentId == null || externalAgentId.isBlank()) {
            return failure("ENVIO_FALHOU", "INVALID_AGENT", "Agente GPTMaker sem identificador externo configurado.", null);
        }
        if (name == null || name.isBlank() || description == null || description.isBlank()) {
            return failure("ENVIO_FALHOU", "INVALID_INTENT", "Nome e descricao da intencao sao obrigatorios.", null);
        }
        if (properties.mockEnabled()) {
            return new GptMakerSyncResult(
                true,
                "ENVIADO_GPTMAKER_MOCK",
                "mock-intent-" + externalAgentId,
                "Publicacao simulada da intencao em ambiente de desenvolvimento.",
                true,
                null,
                null
            );
        }
        if (!properties.tokenConfigured()) {
            return failure("ENVIO_FALHOU", "MISSING_TOKEN", MISSING_TOKEN_MESSAGE, null);
        }

        try {
            var response = feignClient.createIntent(
                externalAgentId,
                buildInstructionsIntentRequest(description, instructions)
            );
            return new GptMakerSyncResult(
                response.success(),
                response.success() ? "ENVIADO_GPTMAKER" : "ENVIO_FALHOU",
                normalizeReference(response.reference()),
                response.success() ? "Intencao enviada ao GPTMaker com sucesso." : "Nao foi possivel enviar a intencao ao GPTMaker.",
                false,
                null,
                null
            );
        } catch (RetryableException exception) {
            return failure("ENVIO_FALHOU", "GPTMAKER_UNAVAILABLE", "Nao foi possivel enviar a intencao ao GPTMaker agora. Tente novamente mais tarde.", exception.getMessage());
        } catch (FeignException exception) {
            return failure("ENVIO_FALHOU", resolveErrorCode(exception), resolveFriendlyMessage(exception), extractDetails(exception));
        }
    }

    public GptMakerCreateAgentResponse createAgent(String workspaceId, GptMakerCreateAgentRequest request) {
        String endpoint = agentsEndpoint(workspaceId);
        if (workspaceId == null || workspaceId.isBlank()) {
            throw new GptMakerIntegrationException("INVALID_WORKSPACE", "Workspace GPTMaker nao informado.", null, null, endpoint, null);
        }
        if (request == null || request.name() == null || request.name().isBlank()) {
            throw new GptMakerIntegrationException("INVALID_AGENT_NAME", "Nome do agente GPTMaker nao informado.", null, null, endpoint, null);
        }
        if (properties.mockEnabled()) {
            return new GptMakerCreateAgentResponse(
                "mock-agent-created-" + workspaceId,
                request.name(),
                request.behavior(),
                request.avatar(),
                request.communicationType(),
                request.type(),
                request.jobName(),
                request.jobSite(),
                request.jobDescription()
            );
        }
        if (!properties.tokenConfigured()) {
            throw new GptMakerIntegrationException("MISSING_TOKEN", MISSING_TOKEN_MESSAGE, null, null, endpoint, null);
        }

        try {
            log.info("Calling GPTMaker POST {} name={} communicationType={} type={}", endpoint, sanitize(request.name()), sanitize(request.communicationType()), sanitize(request.type()));
            ResponseEntity<String> response = feignClient.createAgent(workspaceId, request);
            String body = response.getBody();
            JsonNode payload = parseBody(body, endpoint, response.getStatusCode().value());
            GptMakerCreateAgentResponse createdAgent = parseCreatedAgent(payload, endpoint);
            log.info("GPTMaker POST {} status={} createdAgentId={} createdAgentName={}", endpoint, response.getStatusCode().value(), sanitize(createdAgent.id()), sanitize(createdAgent.name()));
            return createdAgent;
        } catch (RetryableException exception) {
            log.warn("GPTMaker POST {} status=TIMEOUT", endpoint);
            throw new GptMakerIntegrationException("GPTMAKER_UNAVAILABLE", "Nao foi possivel criar o agente no GPTMaker agora.", sanitize(exception.getMessage()), null, endpoint, null);
        } catch (FeignException exception) {
            log.warn("GPTMaker POST {} status={}", endpoint, exception.status());
            if (isWorkspaceAgentLimitError(exception)) {
                throw new GptMakerIntegrationException(
                    "GPTMAKER_AGENT_LIMIT",
                    WORKSPACE_AGENT_LIMIT_MESSAGE,
                    extractDetails(exception),
                    exception.status() > 0 ? exception.status() : null,
                    endpoint,
                    preview(exception.contentUTF8())
                );
            }

            String message = exception.status() == 404
                ? "Workspace GPTMaker nao encontrado."
                : exception.status() == 400
                    ? "O GPTMaker rejeitou os dados do novo agente. Revise o formulario e tente novamente."
                    : exception.status() == 401 || exception.status() == 403
                        ? "Nao foi possivel autenticar na API GPTMaker. Verifique o token configurado no backend."
                        : "Nao foi possivel criar o agente no GPTMaker.";
            throw new GptMakerIntegrationException(
                resolveErrorCode(exception),
                message,
                extractDetails(exception),
                exception.status() > 0 ? exception.status() : null,
                endpoint,
                preview(exception.contentUTF8())
            );
        }
    }

    public GptMakerConversationResponse sendConversation(String externalAgentId, GptMakerConversationRequest request) {
        String endpoint = "/v2/agent/%s/conversation".formatted(externalAgentId == null ? "" : externalAgentId);
        if (externalAgentId == null || externalAgentId.isBlank()) {
            throw new GptMakerIntegrationException("INVALID_AGENT", "Agente GPTMaker nao informado.", null, null, endpoint, null);
        }
        if (request == null || request.contextId() == null || request.contextId().isBlank() || request.prompt() == null || request.prompt().isBlank()) {
            throw new GptMakerIntegrationException("INVALID_CONVERSATION", "Contexto e mensagem sao obrigatorios para testar o agente.", null, null, endpoint, null);
        }
        if (properties.mockEnabled()) {
            return new GptMakerConversationResponse(
                "mock-chat-" + sanitize(request.contextId()),
                "mock-interaction-" + sanitize(request.contextId()),
                "Resposta simulada em ambiente de desenvolvimento para: " + request.prompt(),
                List.of(),
                List.of(),
                List.of()
            );
        }
        if (!properties.tokenConfigured()) {
            throw new GptMakerIntegrationException("MISSING_TOKEN", MISSING_TOKEN_MESSAGE, null, null, endpoint, null);
        }

        try {
            log.info("Calling GPTMaker POST {} agentId={}", endpoint, sanitize(externalAgentId));
            ResponseEntity<String> response = feignClient.sendConversation(externalAgentId, request);
            String body = response.getBody();
            JsonNode payload = parseBody(body, endpoint, response.getStatusCode().value());
            GptMakerConversationResponse conversation = parseConversation(payload, endpoint);
            log.info("GPTMaker POST {} status={} chatId={} interactionId={}", endpoint, response.getStatusCode().value(), sanitize(conversation.chatId()), sanitize(conversation.interactionId()));
            return conversation;
        } catch (RetryableException exception) {
            throw new GptMakerIntegrationException("GPTMAKER_UNAVAILABLE", "Nao foi possivel testar o agente no GPTMaker agora.", sanitize(exception.getMessage()), null, endpoint, null);
        } catch (FeignException exception) {
            throw toIntegrationException(exception, "Nao foi possivel testar o agente no GPTMaker.", endpoint);
        }
    }

    public List<GptMakerConversationMessageResponse> listInteractionMessages(String interactionId) {
        String endpoint = "/v2/interaction/%s/messages".formatted(interactionId == null ? "" : interactionId);
        if (interactionId == null || interactionId.isBlank()) {
            throw new GptMakerIntegrationException("INVALID_INTERACTION", "Interaction GPTMaker nao informada.", null, null, endpoint, null);
        }
        if (properties.mockEnabled()) {
            return List.of();
        }
        if (!properties.tokenConfigured()) {
            throw new GptMakerIntegrationException("MISSING_TOKEN", MISSING_TOKEN_MESSAGE, null, null, endpoint, null);
        }
        try {
            ResponseEntity<String> response = feignClient.listInteractionMessages(interactionId);
            JsonNode payload = parseBody(response.getBody(), endpoint, response.getStatusCode().value());
            return parseConversationMessages(payload, endpoint);
        } catch (RetryableException exception) {
            throw new GptMakerIntegrationException("GPTMAKER_UNAVAILABLE", "Nao foi possivel listar as mensagens do atendimento agora.", sanitize(exception.getMessage()), null, endpoint, null);
        } catch (FeignException exception) {
            throw toIntegrationException(exception, "Nao foi possivel listar as mensagens do atendimento.", endpoint);
        }
    }

    public GptMakerStartHumanResponse startHuman(String chatId) {
        String endpoint = "/v2/chat/%s/start-human".formatted(chatId == null ? "" : chatId);
        if (chatId == null || chatId.isBlank()) {
            throw new GptMakerIntegrationException("INVALID_CHAT", "Chat GPTMaker nao informado.", null, null, endpoint, null);
        }
        if (properties.mockEnabled()) {
            return new GptMakerStartHumanResponse(true);
        }
        if (!properties.tokenConfigured()) {
            throw new GptMakerIntegrationException("MISSING_TOKEN", MISSING_TOKEN_MESSAGE, null, null, endpoint, null);
        }
        try {
            return feignClient.startHuman(chatId);
        } catch (RetryableException exception) {
            throw new GptMakerIntegrationException("GPTMAKER_UNAVAILABLE", "Nao foi possivel assumir o atendimento agora.", sanitize(exception.getMessage()), null, endpoint, null);
        } catch (FeignException exception) {
            throw toIntegrationException(exception, "Nao foi possivel assumir o atendimento no GPTMaker.", endpoint);
        }
    }

    public GptMakerSimpleSuccessResponse stopHuman(String chatId) {
        String endpoint = "/v2/chat/%s/stop-human".formatted(chatId == null ? "" : chatId);
        if (chatId == null || chatId.isBlank()) {
            throw new GptMakerIntegrationException("INVALID_CHAT", "Chat GPTMaker nao informado.", null, null, endpoint, null);
        }
        if (properties.mockEnabled()) {
            return new GptMakerSimpleSuccessResponse(true);
        }
        if (!properties.tokenConfigured()) {
            throw new GptMakerIntegrationException("MISSING_TOKEN", MISSING_TOKEN_MESSAGE, null, null, endpoint, null);
        }
        try {
            return feignClient.stopHuman(chatId);
        } catch (RetryableException exception) {
            throw new GptMakerIntegrationException("GPTMAKER_UNAVAILABLE", "Nao foi possivel encerrar o atendimento humano agora.", sanitize(exception.getMessage()), null, endpoint, null);
        } catch (FeignException exception) {
            throw toIntegrationException(exception, "Nao foi possivel encerrar o atendimento humano no GPTMaker.", endpoint);
        }
    }

    public GptMakerSimpleSuccessResponse sendChatMessage(String chatId, String message, String replyMessageId) {
        String endpoint = "/v2/chat/%s/send-message".formatted(chatId == null ? "" : chatId);
        if (chatId == null || chatId.isBlank()) {
            throw new GptMakerIntegrationException("INVALID_CHAT", "Chat GPTMaker nao informado.", null, null, endpoint, null);
        }
        if (message == null || message.isBlank()) {
            throw new GptMakerIntegrationException("INVALID_MESSAGE", "Mensagem manual nao informada.", null, null, endpoint, null);
        }
        if (properties.mockEnabled()) {
            return new GptMakerSimpleSuccessResponse(true);
        }
        if (!properties.tokenConfigured()) {
            throw new GptMakerIntegrationException("MISSING_TOKEN", MISSING_TOKEN_MESSAGE, null, null, endpoint, null);
        }
        try {
            return feignClient.sendChatMessage(chatId, new GptMakerSendChatMessageRequest(message, replyMessageId));
        } catch (RetryableException exception) {
            throw new GptMakerIntegrationException("GPTMAKER_UNAVAILABLE", "Nao foi possivel enviar mensagem manual agora.", sanitize(exception.getMessage()), null, endpoint, null);
        } catch (FeignException exception) {
            throw toIntegrationException(exception, "Nao foi possivel enviar a mensagem manual no GPTMaker.", endpoint);
        }
    }

    public List<GptMakerChannelResponse> listWorkspaceChannels(String workspaceId) {
        String endpoint = "/v2/workspace/%s/channels".formatted(workspaceId == null ? "" : workspaceId);
        if (workspaceId == null || workspaceId.isBlank()) {
            throw new GptMakerIntegrationException("INVALID_WORKSPACE", "Workspace GPTMaker nao informado.", null, null, endpoint, null);
        }
        if (properties.mockEnabled()) {
            return List.of(
                new GptMakerChannelResponse("mock-channel-webchat", "Webchat principal", "mock-agent-" + workspaceId + "-01", null, "Assistente Comercial", null, true, "webchat-" + workspaceId),
                new GptMakerChannelResponse("mock-channel-whatsapp", "WhatsApp comercial", "mock-agent-" + workspaceId + "-01", null, "Assistente Comercial", null, true, "5511999999999")
            );
        }
        if (!properties.tokenConfigured()) {
            throw new GptMakerIntegrationException("MISSING_TOKEN", MISSING_TOKEN_MESSAGE, null, null, endpoint, null);
        }
        try {
            ResponseEntity<String> response = feignClient.listWorkspaceChannels(workspaceId);
            JsonNode payload = parseBody(response.getBody(), endpoint, response.getStatusCode().value());
            return parseChannels(payload, endpoint);
        } catch (RetryableException exception) {
            throw new GptMakerIntegrationException("GPTMAKER_UNAVAILABLE", "Nao foi possivel listar canais do GPTMaker agora.", sanitize(exception.getMessage()), null, endpoint, null);
        } catch (FeignException exception) {
            throw toIntegrationException(exception, "Nao foi possivel listar os canais do GPTMaker.", endpoint);
        }
    }

    public List<GptMakerChatResponse> listChats(String workspaceId) {
        String endpoint = "/v2/workspace/%s/chats".formatted(workspaceId == null ? "" : workspaceId);
        if (workspaceId == null || workspaceId.isBlank()) {
            throw new GptMakerIntegrationException("INVALID_WORKSPACE", "Workspace GPTMaker nao informado.", null, null, endpoint, null);
        }
        if (properties.mockEnabled()) {
            return List.of();
        }
        if (!properties.tokenConfigured()) {
            throw new GptMakerIntegrationException("MISSING_TOKEN", MISSING_TOKEN_MESSAGE, null, null, endpoint, null);
        }
        try {
            ResponseEntity<String> response = feignClient.listChats(workspaceId);
            JsonNode payload = parseBody(response.getBody(), endpoint, response.getStatusCode().value());
            return parseChats(payload, endpoint);
        } catch (RetryableException exception) {
            throw new GptMakerIntegrationException("GPTMAKER_UNAVAILABLE", "Nao foi possivel listar chats do GPTMaker agora.", sanitize(exception.getMessage()), null, endpoint, null);
        } catch (FeignException exception) {
            throw toIntegrationException(exception, "Nao foi possivel listar os chats do GPTMaker.", endpoint);
        }
    }

    public List<GptMakerConversationMessageResponse> listChatMessages(String chatId) {
        String endpoint = "/v2/chat/%s/messages".formatted(chatId == null ? "" : chatId);
        if (chatId == null || chatId.isBlank()) {
            throw new GptMakerIntegrationException("INVALID_CHAT", "Chat GPTMaker nao informado.", null, null, endpoint, null);
        }
        if (properties.mockEnabled()) {
            return List.of();
        }
        if (!properties.tokenConfigured()) {
            throw new GptMakerIntegrationException("MISSING_TOKEN", MISSING_TOKEN_MESSAGE, null, null, endpoint, null);
        }
        try {
            ResponseEntity<String> response = feignClient.listChatMessages(chatId);
            JsonNode payload = parseBody(response.getBody(), endpoint, response.getStatusCode().value());
            return parseConversationMessages(payload, endpoint);
        } catch (RetryableException exception) {
            throw new GptMakerIntegrationException("GPTMAKER_UNAVAILABLE", "Nao foi possivel listar mensagens do chat agora.", sanitize(exception.getMessage()), null, endpoint, null);
        } catch (FeignException exception) {
            throw toIntegrationException(exception, "Nao foi possivel listar as mensagens do chat.", endpoint);
        }
    }

    public GptMakerHealthStatus health() {
        if (properties.mockEnabled()) {
            return new GptMakerHealthStatus(properties.baseUrl(), true, properties.tokenConfigured(), "MOCK", "Publicacao simulada em ambiente de desenvolvimento. Use /gptmaker/diagnostics para testar conexao real.");
        }
        if (!properties.tokenConfigured()) {
            return new GptMakerHealthStatus(properties.baseUrl(), false, false, "MISSING_TOKEN", MISSING_TOKEN_MESSAGE + " Use /gptmaker/diagnostics para testar conexao real.");
        }
        return new GptMakerHealthStatus(properties.baseUrl(), false, true, "READY", "Configuracao pronta. Use /gptmaker/diagnostics para testar conexao real.");
    }

    public GptMakerDiagnosticsResponse diagnostics() {
        if (properties.mockEnabled()) {
            return new GptMakerDiagnosticsResponse(
                true,
                properties.tokenConfigured(),
                properties.baseUrl(),
                "MOCK",
                0,
                "Integracao em modo mock. Nenhuma chamada real ao GPTMaker foi executada.",
                null,
                200,
                null,
                WORKSPACES_ENDPOINT,
                null
            );
        }
        if (!properties.tokenConfigured()) {
            return new GptMakerDiagnosticsResponse(
                false,
                false,
                properties.baseUrl(),
                "MISSING_TOKEN",
                0,
                MISSING_TOKEN_MESSAGE,
                null,
                null,
                "MISSING_TOKEN",
                WORKSPACES_ENDPOINT,
                null
            );
        }
        try {
            List<GptMakerWorkspaceResponse> workspaces = listWorkspaces();
            List<String> workspaceNamesList = workspaces.stream()
                .map(GptMakerWorkspaceResponse::name)
                .filter(name -> name != null && !name.isBlank())
                .toList();
            String workspaceNames = workspaceNamesList.isEmpty()
                ? null
                : "Workspaces retornados: " + String.join(", ", workspaceNamesList);
            return new GptMakerDiagnosticsResponse(
                false,
                true,
                properties.baseUrl(),
                "CONNECTED",
                workspaces.size(),
                "Conexao real com GPTMaker realizada com sucesso.",
                workspaceNames,
                200,
                null,
                WORKSPACES_ENDPOINT,
                null
            );
        } catch (GptMakerIntegrationException exception) {
            return new GptMakerDiagnosticsResponse(
                false,
                true,
                properties.baseUrl(),
                "ERROR",
                0,
                exception.getMessage(),
                exception.getDetails(),
                exception.getHttpStatus(),
                exception.getErrorCode(),
                exception.getEndpoint(),
                exception.getResponsePreview()
            );
        }
    }

    public List<GptMakerWorkspaceResponse> listWorkspaces() {
        if (properties.mockEnabled()) {
            List<GptMakerWorkspaceResponse> mockItems = List.of(
                new GptMakerWorkspaceResponse("mock-workspace-vavive", "Workspace Vavive Demo"),
                new GptMakerWorkspaceResponse("mock-workspace-sp", "Workspace Sao Paulo")
            );
            log.info("Calling GPTMaker GET {}", WORKSPACES_ENDPOINT);
            log.info("GPTMaker GET {} status=200 parsedWorkspaces={} names={}", WORKSPACES_ENDPOINT, mockItems.size(), workspaceNames(mockItems));
            return mockItems;
        }
        if (!properties.tokenConfigured()) {
            throw new GptMakerIntegrationException("MISSING_TOKEN", MISSING_TOKEN_MESSAGE, null, null, WORKSPACES_ENDPOINT, null);
        }
        try {
            log.info("Calling GPTMaker GET {}", WORKSPACES_ENDPOINT);
            ResponseEntity<String> response = feignClient.listWorkspaces();
            String body = response.getBody();
            JsonNode payload = parseBody(body, WORKSPACES_ENDPOINT, response.getStatusCode().value());
            List<GptMakerWorkspaceResponse> items = parseWorkspaces(payload, WORKSPACES_ENDPOINT);
            log.info("GPTMaker GET {} status={} bodyPreview={} parsedWorkspaces={} names={}", WORKSPACES_ENDPOINT, response.getStatusCode().value(), preview(body), items.size(), workspaceNames(items));
            return items;
        } catch (RetryableException exception) {
            log.warn("GPTMaker GET {} status=TIMEOUT parsedWorkspaces=0", WORKSPACES_ENDPOINT);
            throw new GptMakerIntegrationException("GPTMAKER_UNAVAILABLE", "Nao foi possivel listar os workspaces do GPTMaker agora.", sanitize(exception.getMessage()), null, WORKSPACES_ENDPOINT, null);
        } catch (FeignException exception) {
            log.warn("GPTMaker GET {} status={} bodyPreview={} parsedWorkspaces=0", WORKSPACES_ENDPOINT, exception.status(), preview(exception.contentUTF8()));
            throw toIntegrationException(exception, "Nao foi possivel listar os workspaces do GPTMaker.", WORKSPACES_ENDPOINT);
        }
    }

    public List<GptMakerAgentResponse> listAgents(String workspaceId) {
        String endpoint = agentsEndpoint(workspaceId);
        if (workspaceId == null || workspaceId.isBlank()) {
            throw new GptMakerIntegrationException("INVALID_WORKSPACE", "Workspace GPTMaker nao informado.", null, null, endpoint, null);
        }
        if (properties.mockEnabled()) {
            List<GptMakerAgentResponse> mockItems = List.of(
                new GptMakerAgentResponse("mock-agent-" + workspaceId + "-01", "Assistente Comercial", "Acolhedor", null, "NORMAL", "SALE", "Atendimento", "https://gptmaker.ai", "Agente comercial da franquia"),
                new GptMakerAgentResponse("mock-agent-" + workspaceId + "-02", "Assistente Operacional", "Objetivo", null, "FORMAL", "SUPPORT", "Operacao", "https://gptmaker.ai", "Agente de suporte operacional")
            );
            log.info("Calling GPTMaker GET {}", endpoint);
            log.info("GPTMaker GET {} status=200 parsedAgents={} names={}", endpoint, mockItems.size(), agentNames(mockItems));
            return mockItems;
        }
        if (!properties.tokenConfigured()) {
            throw new GptMakerIntegrationException("MISSING_TOKEN", MISSING_TOKEN_MESSAGE, null, null, endpoint, null);
        }
        try {
            log.info("Calling GPTMaker GET {}", endpoint);
            ResponseEntity<String> response = feignClient.listAgents(workspaceId);
            String body = response.getBody();
            JsonNode payload = parseBody(body, endpoint, response.getStatusCode().value());
            List<GptMakerAgentResponse> items = parseAgents(payload, endpoint);
            log.info("GPTMaker GET {} status={} bodyPreview={} parsedAgents={} names={}", endpoint, response.getStatusCode().value(), preview(body), items.size(), agentNames(items));
            return items;
        } catch (RetryableException exception) {
            log.warn("GPTMaker GET {} status=TIMEOUT parsedAgents=0", endpoint);
            throw new GptMakerIntegrationException("GPTMAKER_UNAVAILABLE", "Nao foi possivel listar os agentes do GPTMaker agora.", sanitize(exception.getMessage()), null, endpoint, null);
        } catch (FeignException exception) {
            log.warn("GPTMaker GET {} status={} bodyPreview={} parsedAgents=0", endpoint, exception.status(), preview(exception.contentUTF8()));
            throw toIntegrationException(exception, "Nao foi possivel listar os agentes do GPTMaker.", endpoint);
        }
    }

    public GptMakerRawDiagnosticsResponse rawWorkspaceDiagnostics() {
        if (properties.mockEnabled()) {
            return new GptMakerRawDiagnosticsResponse(
                WORKSPACES_ENDPOINT,
                200,
                objectMapper.valueToTree(listWorkspaces()),
                null,
                null,
                "Integracao em modo mock. Nenhuma chamada real ao GPTMaker foi executada.",
                null,
                null
            );
        }
        if (!properties.tokenConfigured()) {
            return new GptMakerRawDiagnosticsResponse(
                WORKSPACES_ENDPOINT,
                null,
                null,
                null,
                "MISSING_TOKEN",
                MISSING_TOKEN_MESSAGE,
                null,
                null
            );
        }
        try {
            log.info("Calling GPTMaker GET {}", WORKSPACES_ENDPOINT);
            ResponseEntity<String> response = feignClient.listWorkspaces();
            String body = response.getBody();
            JsonNode payload = parseBody(body, WORKSPACES_ENDPOINT, response.getStatusCode().value());
            int quantity = parseWorkspaces(payload, WORKSPACES_ENDPOINT).size();
            log.info("GPTMaker GET {} status={} bodyPreview={} parsedWorkspaces={}", WORKSPACES_ENDPOINT, response.getStatusCode().value(), preview(body), quantity);
            return new GptMakerRawDiagnosticsResponse(
                WORKSPACES_ENDPOINT,
                response.getStatusCode().value(),
                payload,
                null,
                null,
                "Payload bruto recebido com sucesso.",
                null,
                null
            );
        } catch (GptMakerIntegrationException exception) {
            return new GptMakerRawDiagnosticsResponse(
                WORKSPACES_ENDPOINT,
                exception.getHttpStatus(),
                null,
                exception.getResponsePreview(),
                exception.getErrorCode(),
                exception.getMessage(),
                exception.getResponsePreview(),
                exception.getDetails()
            );
        } catch (RetryableException exception) {
            log.warn("GPTMaker GET {} status=TIMEOUT parsedWorkspaces=0", WORKSPACES_ENDPOINT);
            return new GptMakerRawDiagnosticsResponse(
                WORKSPACES_ENDPOINT,
                null,
                null,
                null,
                "GPTMAKER_UNAVAILABLE",
                "Nao foi possivel listar os workspaces do GPTMaker agora.",
                null,
                sanitize(exception.getMessage())
            );
        } catch (FeignException exception) {
            log.warn("GPTMaker GET {} status={} parsedWorkspaces=0 responsePreview={}", WORKSPACES_ENDPOINT, exception.status(), extractDetails(exception));
            return new GptMakerRawDiagnosticsResponse(
                WORKSPACES_ENDPOINT,
                exception.status() > 0 ? exception.status() : null,
                null,
                null,
                resolveErrorCode(exception),
                resolveFriendlyMessage(exception),
                preview(exception.contentUTF8()),
                sanitize(exception.getMessage())
            );
        }
    }

    public GptMakerAgentDiagnosticsResponse agentDiagnostics(String workspaceId) {
        String endpoint = agentsEndpoint(workspaceId);
        if (properties.mockEnabled()) {
            List<GptMakerAgentResponse> agents = listAgents(workspaceId);
            return new GptMakerAgentDiagnosticsResponse(
                workspaceId,
                endpoint,
                200,
                "MOCK",
                agents.size(),
                agents.stream().map(GptMakerAgentResponse::name).filter(name -> name != null && !name.isBlank()).toList(),
                "Integracao em modo mock. Nenhuma chamada real ao GPTMaker foi executada.",
                null,
                null
            );
        }
        if (!properties.tokenConfigured()) {
            return new GptMakerAgentDiagnosticsResponse(
                workspaceId,
                endpoint,
                null,
                "MISSING_TOKEN",
                0,
                List.of(),
                MISSING_TOKEN_MESSAGE,
                "MISSING_TOKEN",
                null
            );
        }
        try {
            List<GptMakerAgentResponse> agents = listAgents(workspaceId);
            List<String> agentNames = agents.stream()
                .map(GptMakerAgentResponse::name)
                .filter(name -> name != null && !name.isBlank())
                .toList();
            return new GptMakerAgentDiagnosticsResponse(
                workspaceId,
                endpoint,
                200,
                "CONNECTED",
                agents.size(),
                agentNames,
                "Conexao real com GPTMaker para agentes realizada com sucesso.",
                null,
                null
            );
        } catch (GptMakerIntegrationException exception) {
            return new GptMakerAgentDiagnosticsResponse(
                workspaceId,
                endpoint,
                exception.getHttpStatus(),
                "ERROR",
                0,
                List.of(),
                exception.getMessage(),
                exception.getErrorCode(),
                exception.getResponsePreview()
            );
        }
    }

    public JsonNode debugListAgents(String workspaceId) {
        if (workspaceId == null || workspaceId.isBlank()) {
            throw new GptMakerIntegrationException("INVALID_WORKSPACE", "Workspace GPTMaker nao informado.");
        }
        if (properties.mockEnabled()) {
            return objectMapper.valueToTree(listAgents(workspaceId));
        }
        if (!properties.tokenConfigured()) {
            throw new GptMakerIntegrationException("MISSING_TOKEN", MISSING_TOKEN_MESSAGE);
        }
        try {
            ResponseEntity<String> response = feignClient.listAgents(workspaceId);
            String body = response.getBody();
            JsonNode payload = parseBody(body, agentsEndpoint(workspaceId), response.getStatusCode().value());
            int quantity = parseAgents(payload, agentsEndpoint(workspaceId)).size();
            log.info("GPTMaker GET {} status={} bodyPreview={} parsedAgents={}", agentsEndpoint(workspaceId), response.getStatusCode().value(), preview(body), quantity);
            return payload;
        } catch (RetryableException exception) {
            log.warn("GPTMaker debugListAgents endpoint=/v2/workspace/{}/agents status=TIMEOUT quantity=0 mockEnabled=false", workspaceId);
            throw new GptMakerIntegrationException("GPTMAKER_UNAVAILABLE", "Nao foi possivel listar os agentes do GPTMaker agora.", sanitize(exception.getMessage()));
        } catch (FeignException exception) {
            log.warn("GPTMaker GET {} status={} bodyPreview={} parsedAgents=0", agentsEndpoint(workspaceId), exception.status(), preview(exception.contentUTF8()));
            throw toIntegrationException(exception, "Nao foi possivel listar os agentes do GPTMaker.", agentsEndpoint(workspaceId));
        }
    }

    private List<GptMakerWorkspaceResponse> parseWorkspaces(JsonNode payload, String endpoint) {
        JsonNode itemsNode = extractItemsNode(payload);
        if (itemsNode == null || itemsNode.isNull()) {
            return List.of();
        }
        if (!itemsNode.isArray()) {
            throw new GptMakerIntegrationException("GPTMAKER_INVALID_PAYLOAD", "A API GPTMaker retornou um formato inesperado para workspaces.", sanitize(itemsNode.toString()), null, endpoint, sanitize(itemsNode.toString()));
        }

        List<GptMakerWorkspaceResponse> items = new ArrayList<>();
        for (JsonNode itemNode : itemsNode) {
            if (itemNode == null || itemNode.isNull() || !itemNode.isObject()) {
                continue;
            }
            String id = textValue(itemNode, "id");
            String name = textValue(itemNode, "name");
            items.add(new GptMakerWorkspaceResponse(id, name));
        }
        return items;
    }

    private List<GptMakerAgentResponse> parseAgents(JsonNode payload, String endpoint) {
        JsonNode itemsNode = extractItemsNode(payload);
        if (itemsNode == null || itemsNode.isNull()) {
            return List.of();
        }
        if (!itemsNode.isArray()) {
            throw new GptMakerIntegrationException("GPTMAKER_INVALID_PAYLOAD", "A API GPTMaker retornou um formato inesperado para agentes.", sanitize(itemsNode.toString()), null, endpoint, sanitize(itemsNode.toString()));
        }

        List<GptMakerAgentResponse> items = new ArrayList<>();
        for (JsonNode itemNode : itemsNode) {
            if (itemNode == null || itemNode.isNull() || !itemNode.isObject()) {
                continue;
            }
            items.add(new GptMakerAgentResponse(
                textValue(itemNode, "id"),
                textValue(itemNode, "name"),
                textValue(itemNode, "behavior"),
                textValue(itemNode, "avatar"),
                textValue(itemNode, "communicationType"),
                textValue(itemNode, "type"),
                textValue(itemNode, "jobName"),
                textValue(itemNode, "jobSite"),
                textValue(itemNode, "jobDescription")
            ));
        }
        return items;
    }

    private List<GptMakerChannelResponse> parseChannels(JsonNode payload, String endpoint) {
        JsonNode itemsNode = extractItemsNode(payload);
        if (itemsNode == null || itemsNode.isNull()) {
            return List.of();
        }
        if (!itemsNode.isArray()) {
            throw new GptMakerIntegrationException("GPTMAKER_INVALID_PAYLOAD", "A API GPTMaker retornou um formato inesperado para canais.", sanitize(itemsNode.toString()), null, endpoint, sanitize(itemsNode.toString()));
        }

        List<GptMakerChannelResponse> items = new ArrayList<>();
        for (JsonNode itemNode : itemsNode) {
            if (itemNode == null || itemNode.isNull() || !itemNode.isObject()) {
                continue;
            }
            items.add(new GptMakerChannelResponse(
                textValue(itemNode, "id"),
                textValue(itemNode, "name"),
                textValue(itemNode, "agentId"),
                textValue(itemNode, "agentPicture"),
                textValue(itemNode, "agentName"),
                textValue(itemNode, "facebookPageId"),
                booleanValue(itemNode, "connected"),
                firstTextValue(itemNode, "username", "phone", "identifier")
            ));
        }
        return items;
    }

    private List<GptMakerChatResponse> parseChats(JsonNode payload, String endpoint) {
        JsonNode itemsNode = extractItemsNode(payload);
        if (itemsNode == null || itemsNode.isNull()) {
            return List.of();
        }
        if (!itemsNode.isArray()) {
            throw new GptMakerIntegrationException("GPTMAKER_INVALID_PAYLOAD", "A API GPTMaker retornou um formato inesperado para chats.", sanitize(itemsNode.toString()), null, endpoint, sanitize(itemsNode.toString()));
        }

        List<GptMakerChatResponse> items = new ArrayList<>();
        for (JsonNode itemNode : itemsNode) {
            if (itemNode == null || itemNode.isNull() || !itemNode.isObject()) {
                continue;
            }
            items.add(new GptMakerChatResponse(
                textValue(itemNode, "id"),
                booleanValue(itemNode, "humanTalk"),
                booleanValue(itemNode, "read"),
                booleanValue(itemNode, "finished"),
                textValue(itemNode, "role"),
                textValue(itemNode, "agentName"),
                textValue(itemNode, "agentId"),
                textValue(itemNode, "whatsappPhone"),
                textValue(itemNode, "title"),
                textValue(itemNode, "type"),
                textValue(itemNode, "userName"),
                textValue(itemNode, "userId"),
                textValue(itemNode, "conversationType"),
                textValue(itemNode, "conversation"),
                textValue(itemNode, "messageUserName"),
                textValue(itemNode, "picture"),
                textValue(itemNode, "userPicture"),
                textValue(itemNode, "avatar"),
                textValue(itemNode, "recipient"),
                textValue(itemNode, "name"),
                longValue(itemNode, "createdAt"),
                longValue(itemNode, "time"),
                integerValue(itemNode, "unReadCount")
            ));
        }
        return items;
    }

    private GptMakerCreateAgentResponse parseCreatedAgent(JsonNode payload, String endpoint) {
        JsonNode itemNode = extractSingleItemNode(payload);
        if (itemNode == null || itemNode.isNull() || !itemNode.isObject()) {
            throw new GptMakerIntegrationException("GPTMAKER_INVALID_PAYLOAD", "A API GPTMaker retornou um formato inesperado para criacao de agente.", sanitize(payload == null ? null : payload.toString()), null, endpoint, sanitize(payload == null ? null : payload.toString()));
        }

        String id = textValue(itemNode, "id");
        if (id == null || id.isBlank()) {
            throw new GptMakerIntegrationException("GPTMAKER_INVALID_PAYLOAD", "A API GPTMaker nao retornou o identificador do agente criado.", sanitize(itemNode.toString()), null, endpoint, sanitize(itemNode.toString()));
        }

        return new GptMakerCreateAgentResponse(
            id,
            textValue(itemNode, "name"),
            textValue(itemNode, "behavior"),
            textValue(itemNode, "avatar"),
            textValue(itemNode, "communicationType"),
            textValue(itemNode, "type"),
            textValue(itemNode, "jobName"),
            textValue(itemNode, "jobSite"),
            textValue(itemNode, "jobDescription")
        );
    }

    private GptMakerConversationResponse parseConversation(JsonNode payload, String endpoint) {
        JsonNode itemNode = extractSingleItemNode(payload);
        if (itemNode == null || itemNode.isNull() || !itemNode.isObject()) {
            throw new GptMakerIntegrationException("GPTMAKER_INVALID_PAYLOAD", "A API GPTMaker retornou um formato inesperado para conversa.", sanitize(payload == null ? null : payload.toString()), null, endpoint, sanitize(payload == null ? null : payload.toString()));
        }

        String chatId = firstTextValue(itemNode, "chatId", "chat_id");
        String interactionId = firstTextValue(itemNode, "interactionId", "interaction_id");
        return new GptMakerConversationResponse(
            chatId,
            interactionId,
            firstTextValue(itemNode, "message", "text", "response"),
            textArray(itemNode.get("images")),
            textArray(itemNode.get("audios")),
            textArray(itemNode.get("documents"))
        );
    }

    private List<GptMakerConversationMessageResponse> parseConversationMessages(JsonNode payload, String endpoint) {
        JsonNode itemsNode = extractItemsNode(payload);
        if (itemsNode == null || itemsNode.isNull()) {
            return List.of();
        }
        if (!itemsNode.isArray()) {
            throw new GptMakerIntegrationException("GPTMAKER_INVALID_PAYLOAD", "A API GPTMaker retornou um formato inesperado para mensagens do atendimento.", sanitize(itemsNode.toString()), null, endpoint, sanitize(itemsNode.toString()));
        }

        List<GptMakerConversationMessageResponse> items = new ArrayList<>();
        for (JsonNode itemNode : itemsNode) {
            if (itemNode == null || itemNode.isNull() || !itemNode.isObject()) {
                continue;
            }
            items.add(new GptMakerConversationMessageResponse(
                textValue(itemNode, "id"),
                textValue(itemNode, "role"),
                textValue(itemNode, "type"),
                textValue(itemNode, "text"),
                textValue(itemNode, "userName"),
                textValue(itemNode, "userPicture"),
                textValue(itemNode, "imageUrl"),
                textValue(itemNode, "audioUrl"),
                textValue(itemNode, "documentUrl"),
                textValue(itemNode, "fileName"),
                textValue(itemNode, "midiaContent"),
                longValue(itemNode, "time"),
                integerValue(itemNode, "width"),
                integerValue(itemNode, "height")
            ));
        }
        return items;
    }

    private JsonNode extractItemsNode(JsonNode payload) {
        if (payload == null || payload.isNull()) {
            return null;
        }
        if (payload.isArray()) {
            return payload;
        }
        if (payload.isObject()) {
            for (String fieldName : List.of("data", "items", "results", "content")) {
                JsonNode candidate = payload.get(fieldName);
                if (candidate != null && !candidate.isNull()) {
                    return candidate;
                }
            }
        }
        return payload;
    }

    private JsonNode extractSingleItemNode(JsonNode payload) {
        JsonNode extracted = extractItemsNode(payload);
        if (extracted == null || extracted.isNull()) {
            return null;
        }
        if (extracted.isArray()) {
            return extracted.isEmpty() ? null : extracted.get(0);
        }
        return extracted;
    }

    private String textValue(JsonNode node, String fieldName) {
        JsonNode value = node.get(fieldName);
        if (value == null || value.isNull()) {
            return null;
        }
        return value.asText();
    }

    private String firstTextValue(JsonNode node, String... fieldNames) {
        for (String fieldName : fieldNames) {
            String value = textValue(node, fieldName);
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private List<String> textArray(JsonNode node) {
        if (node == null || node.isNull() || !node.isArray()) {
            return List.of();
        }
        List<String> values = new ArrayList<>();
        for (JsonNode item : node) {
            if (item != null && !item.isNull()) {
                values.add(item.asText());
            }
        }
        return values;
    }

    private Long longValue(JsonNode node, String fieldName) {
        JsonNode value = node.get(fieldName);
        if (value == null || value.isNull() || !value.isNumber()) {
            return null;
        }
        return value.asLong();
    }

    private Integer integerValue(JsonNode node, String fieldName) {
        JsonNode value = node.get(fieldName);
        if (value == null || value.isNull() || !value.isNumber()) {
            return null;
        }
        return value.asInt();
    }

    private boolean booleanValue(JsonNode node, String fieldName) {
        JsonNode value = node.get(fieldName);
        return value != null && !value.isNull() && value.asBoolean(false);
    }

    public GptMakerSyncResult sendRule(String externalAgentId, String title, String description) {
        if (properties.mockEnabled()) {
            return new GptMakerSyncResult(
                true,
                "ENVIADO_GPTMAKER_MOCK",
                "mock-rule-" + externalAgentId,
                "Publicacao simulada da regra em ambiente de desenvolvimento.",
                true,
                null,
                null
            );
        }
        return failure(
            "ENVIO_FALHOU",
            "NOT_IMPLEMENTED",
            "Regras ainda nao possuem integracao dedicada com o GPTMaker nesta versao do MVP.",
            null
        );
    }

    private GptMakerSyncResult failure(String status, String errorCode, String message, String details) {
        return new GptMakerSyncResult(false, status, null, message, properties.mockEnabled(), errorCode, details);
    }

    private String resolveErrorCode(FeignException exception) {
        GptMakerErrorResponse error = parseError(exception);
        if (error != null && error.code() != null && !error.code().isBlank()) {
            return error.code();
        }
        if (exception.status() == 401 || exception.status() == 403) {
            return "GPTMAKER_AUTH_ERROR";
        }
        if (exception.status() == 400) {
            return "GPTMAKER_BAD_REQUEST";
        }
        if (exception.status() == 404) {
            return "GPTMAKER_AGENT_NOT_FOUND";
        }
        if (exception.status() == 429) {
            return "GPTMAKER_RATE_LIMIT";
        }
        if (exception.status() >= 500) {
            return "GPTMAKER_UNAVAILABLE";
        }
        return "GPTMAKER_ERROR";
    }

    private String resolveFriendlyMessage(FeignException exception) {
        if (isWorkspaceAgentLimitError(exception)) {
            return WORKSPACE_AGENT_LIMIT_MESSAGE;
        }
        if (exception.status() == 401 || exception.status() == 403) {
            return "Nao foi possivel autenticar na API GPTMaker. Verifique o token configurado no backend.";
        }
        if (exception.status() == 400) {
            return "O GPTMaker rejeitou os dados enviados. Revise o conteudo e tente novamente.";
        }
        if (exception.status() == 404) {
            return "O agente informado nao foi encontrado no GPTMaker.";
        }
        if (exception.status() == 429) {
            return "O GPTMaker atingiu o limite temporario de requisicoes. Tente novamente em alguns instantes.";
        }
        if (exception.status() >= 500) {
            return "Nao foi possivel publicar no GPTMaker agora. Tente novamente mais tarde.";
        }
        return "Nao foi possivel concluir a operacao no GPTMaker.";
    }

    private String extractDetails(FeignException exception) {
        GptMakerErrorResponse error = parseError(exception);
        if (error != null) {
            if (error.message() != null && !error.message().isBlank()) {
                return sanitize(error.message());
            }
            if (error.error() != null && !error.error().isBlank()) {
                return sanitize(error.error());
            }
        }
        String content = exception.contentUTF8();
        return sanitize(content);
    }

    private JsonNode parseBody(String body, String endpoint, int httpStatus) {
        if (body == null || body.isBlank()) {
            throw new GptMakerIntegrationException("GPTMAKER_PARSE_ERROR", PARSE_ERROR_MESSAGE, "Resposta vazia recebida do GPTMaker.", httpStatus, endpoint, preview(body));
        }
        try {
            return objectMapper.readTree(body);
        } catch (Exception exception) {
            log.warn("GPTMaker GET {} status={} bodyPreview={} parseError={}", endpoint, httpStatus, preview(body), sanitize(exception.getMessage()));
            throw new GptMakerIntegrationException("GPTMAKER_PARSE_ERROR", PARSE_ERROR_MESSAGE, sanitize(exception.getMessage()), httpStatus, endpoint, preview(body));
        }
    }

    private GptMakerCreateIntentRequest buildInstructionsIntentRequest(String description, String instructions) {
        /*
         * TODO: a documentacao oficial do GPTMaker marca `httpMethod` e `url` como obrigatorios
         * inclusive para intents do tipo INSTRUCTIONS. Quando o contrato oficial diferenciar
         * esse caso de forma explicita, ajustar este payload para remover o campo `url`.
         */
        return new GptMakerCreateIntentRequest(
            description,
            "INSTRUCTIONS",
            "POST",
            properties.baseUrl(),
            false,
            false,
            description,
            instructions == null || instructions.isBlank() ? description : instructions,
            null,
            null,
            null,
            null,
            null
        );
    }

    private GptMakerErrorResponse parseError(FeignException exception) {
        String content = exception.contentUTF8();
        if (content == null || content.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readValue(content, GptMakerErrorResponse.class);
        } catch (Exception ignored) {
            return null;
        }
    }

    private boolean isWorkspaceAgentLimitError(FeignException exception) {
        String content = exception.contentUTF8();
        String message = exception.getMessage();
        return containsWorkspaceAgentLimit(content) || containsWorkspaceAgentLimit(message);
    }

    private boolean containsWorkspaceAgentLimit(String value) {
        return value != null
            && value.toLowerCase().contains("workspace already have the maximum number of assistants");
    }

    private String sanitize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String sanitized = value.replaceAll("\\s+", " ").trim();
        String token = properties.sanitizedApiToken();
        if (!token.isBlank()) {
            sanitized = sanitized.replace(token, "[REDACTED]");
        }
        return sanitized.length() > 500 ? sanitized.substring(0, 500) : sanitized;
    }

    private String preview(String value) {
        return sanitize(value);
    }

    private String normalizeReference(String reference) {
        return reference == null || reference.isBlank() ? null : reference;
    }

    private String workspaceNames(List<GptMakerWorkspaceResponse> items) {
        return String.join(", ", items.stream()
            .map(GptMakerWorkspaceResponse::name)
            .filter(name -> name != null && !name.isBlank())
            .toList());
    }

    private String agentNames(List<GptMakerAgentResponse> items) {
        return String.join(", ", items.stream()
            .map(GptMakerAgentResponse::name)
            .filter(name -> name != null && !name.isBlank())
            .toList());
    }

    public boolean isRealExternalId(String externalId) {
        if (externalId == null || externalId.isBlank()) {
            return false;
        }
        String normalized = externalId.trim().toLowerCase();
        return !normalized.startsWith("mock") && !normalized.startsWith("gptmaker-agent-auto-");
    }

    private String agentsEndpoint(String workspaceId) {
        return AGENTS_ENDPOINT_TEMPLATE.formatted(workspaceId == null ? "" : workspaceId);
    }

    private GptMakerIntegrationException toIntegrationException(FeignException exception, String fallbackMessage, String endpoint) {
        return new GptMakerIntegrationException(
            resolveErrorCode(exception),
            resolveFriendlyMessage(exception) == null ? fallbackMessage : resolveFriendlyMessage(exception),
            sanitize(exception.getMessage()),
            exception.status() > 0 ? exception.status() : null,
            endpoint,
            preview(exception.contentUTF8())
        );
    }

    public JsonNode getWorkspaceCredits(String workspaceId) {
        if (workspaceId == null || workspaceId.isBlank()) {
            throw new GptMakerIntegrationException("INVALID_WORKSPACE", "Workspace ID e obrigatorio.");
        }
        if (properties.mockEnabled()) {
            return objectMapper.createObjectNode()
                .put("credits", 1000)
                .put("used", 250)
                .put("remaining", 750);
        }
        if (!properties.tokenConfigured()) {
            throw new GptMakerIntegrationException("MISSING_TOKEN", MISSING_TOKEN_MESSAGE);
        }
        try {
            ResponseEntity<String> response = feignClient.getWorkspaceCredits(workspaceId);
            return parseResponse(response, "/v2/workspace/" + workspaceId + "/credits");
        } catch (RetryableException exception) {
            throw new GptMakerIntegrationException("GPTMAKER_UNAVAILABLE", "GPTMaker indisponivel agora.", exception.getMessage());
        } catch (FeignException exception) {
            throw mapFeignException(exception, "/v2/workspace/" + workspaceId + "/credits");
        }
    }

    public JsonNode getAgentSettings(String agentId) {
        if (agentId == null || agentId.isBlank()) {
            throw new GptMakerIntegrationException("INVALID_AGENT", "Agent ID e obrigatorio.");
        }
        if (properties.mockEnabled()) {
            return objectMapper.createObjectNode()
                .put("prefferModel", "GPT_4_O")
                .put("timezone", "America/Sao_Paulo")
                .put("enabledHumanTransfer", true)
                .put("enabledEmoji", true)
                .put("splitMessages", false)
                .put("limitSubjects", false);
        }
        if (!properties.tokenConfigured()) {
            throw new GptMakerIntegrationException("MISSING_TOKEN", MISSING_TOKEN_MESSAGE);
        }
        try {
            ResponseEntity<String> response = feignClient.getAgentSettings(agentId);
            return parseResponse(response, "/v2/agent/" + agentId + "/settings");
        } catch (RetryableException exception) {
            throw new GptMakerIntegrationException("GPTMAKER_UNAVAILABLE", "GPTMaker indisponivel agora.", exception.getMessage());
        } catch (FeignException exception) {
            throw mapFeignException(exception, "/v2/agent/" + agentId + "/settings");
        }
    }

    public JsonNode updateAgentSettings(String agentId, Object settings) {
        if (agentId == null || agentId.isBlank()) {
            throw new GptMakerIntegrationException("INVALID_AGENT", "Agent ID e obrigatorio.");
        }
        if (properties.mockEnabled()) {
            return objectMapper.createObjectNode().put("success", true);
        }
        if (!properties.tokenConfigured()) {
            throw new GptMakerIntegrationException("MISSING_TOKEN", MISSING_TOKEN_MESSAGE);
        }
        try {
            ResponseEntity<String> response = feignClient.updateAgentSettings(agentId, settings);
            return parseResponse(response, "/v2/agent/" + agentId + "/settings");
        } catch (RetryableException exception) {
            throw new GptMakerIntegrationException("GPTMAKER_UNAVAILABLE", "GPTMaker indisponivel agora.", exception.getMessage());
        } catch (FeignException exception) {
            throw mapFeignException(exception, "/v2/agent/" + agentId + "/settings");
        }
    }

    public JsonNode getAgentWebhooks(String agentId) {
        if (agentId == null || agentId.isBlank()) {
            throw new GptMakerIntegrationException("INVALID_AGENT", "Agent ID e obrigatorio.");
        }
        if (properties.mockEnabled()) {
            return objectMapper.createObjectNode();
        }
        if (!properties.tokenConfigured()) {
            throw new GptMakerIntegrationException("MISSING_TOKEN", MISSING_TOKEN_MESSAGE);
        }
        try {
            ResponseEntity<String> response = feignClient.getAgentWebhooks(agentId);
            return parseResponse(response, "/v2/agent/" + agentId + "/webhooks");
        } catch (RetryableException exception) {
            throw new GptMakerIntegrationException("GPTMAKER_UNAVAILABLE", "GPTMaker indisponivel agora.", exception.getMessage());
        } catch (FeignException exception) {
            throw mapFeignException(exception, "/v2/agent/" + agentId + "/webhooks");
        }
    }

    public JsonNode updateAgentWebhooks(String agentId, Object webhooks) {
        if (agentId == null || agentId.isBlank()) {
            throw new GptMakerIntegrationException("INVALID_AGENT", "Agent ID e obrigatorio.");
        }
        if (properties.mockEnabled()) {
            return objectMapper.createObjectNode().put("success", true);
        }
        if (!properties.tokenConfigured()) {
            throw new GptMakerIntegrationException("MISSING_TOKEN", MISSING_TOKEN_MESSAGE);
        }
        try {
            ResponseEntity<String> response = feignClient.updateAgentWebhooks(agentId, webhooks);
            return parseResponse(response, "/v2/agent/" + agentId + "/webhooks");
        } catch (RetryableException exception) {
            throw new GptMakerIntegrationException("GPTMAKER_UNAVAILABLE", "GPTMaker indisponivel agora.", exception.getMessage());
        } catch (FeignException exception) {
            throw mapFeignException(exception, "/v2/agent/" + agentId + "/webhooks");
        }
    }

    public JsonNode listIntentions(String agentId) {
        if (agentId == null || agentId.isBlank()) {
            throw new GptMakerIntegrationException("INVALID_AGENT", "Agent ID e obrigatorio.");
        }
        if (properties.mockEnabled()) {
            return objectMapper.createArrayNode();
        }
        if (!properties.tokenConfigured()) {
            throw new GptMakerIntegrationException("MISSING_TOKEN", MISSING_TOKEN_MESSAGE);
        }
        try {
            ResponseEntity<String> response = feignClient.listIntentions(agentId);
            return parseResponse(response, "/v2/agent/" + agentId + "/intentions");
        } catch (RetryableException exception) {
            throw new GptMakerIntegrationException("GPTMAKER_UNAVAILABLE", "GPTMaker indisponivel agora.", exception.getMessage());
        } catch (FeignException exception) {
            throw mapFeignException(exception, "/v2/agent/" + agentId + "/intentions");
        }
    }

    public JsonNode listTrainings(String agentId) {
        if (agentId == null || agentId.isBlank()) {
            throw new GptMakerIntegrationException("INVALID_AGENT", "Agent ID e obrigatorio.");
        }
        if (properties.mockEnabled()) {
            return objectMapper.createArrayNode();
        }
        if (!properties.tokenConfigured()) {
            throw new GptMakerIntegrationException("MISSING_TOKEN", MISSING_TOKEN_MESSAGE);
        }
        try {
            ResponseEntity<String> response = feignClient.listTrainings(agentId);
            return parseResponse(response, "/v2/agent/" + agentId + "/trainings");
        } catch (RetryableException exception) {
            throw new GptMakerIntegrationException("GPTMAKER_UNAVAILABLE", "GPTMaker indisponivel agora.", exception.getMessage());
        } catch (FeignException exception) {
            throw mapFeignException(exception, "/v2/agent/" + agentId + "/trainings");
        }
    }

    public boolean deleteTraining(String trainingId) {
        if (trainingId == null || trainingId.isBlank()) {
            throw new GptMakerIntegrationException("INVALID_TRAINING", "Training ID e obrigatorio.");
        }
        if (properties.mockEnabled()) {
            return true;
        }
        if (!properties.tokenConfigured()) {
            throw new GptMakerIntegrationException("MISSING_TOKEN", MISSING_TOKEN_MESSAGE);
        }
        try {
            feignClient.deleteTraining(trainingId);
            return true;
        } catch (RetryableException exception) {
            throw new GptMakerIntegrationException("GPTMAKER_UNAVAILABLE", "GPTMaker indisponivel agora.", exception.getMessage());
        } catch (FeignException exception) {
            throw mapFeignException(exception, "/v2/training/" + trainingId);
        }
    }

    public JsonNode createChannel(String workspaceId, String name, String type) {
        if (workspaceId == null || workspaceId.isBlank()) {
            throw new GptMakerIntegrationException("INVALID_WORKSPACE", "Workspace ID e obrigatorio.");
        }
        if (properties.mockEnabled()) {
            return objectMapper.createObjectNode()
                .put("id", "mock-channel-" + System.currentTimeMillis())
                .put("name", name)
                .put("type", type)
                .put("connected", false);
        }
        if (!properties.tokenConfigured()) {
            throw new GptMakerIntegrationException("MISSING_TOKEN", MISSING_TOKEN_MESSAGE);
        }
        try {
            ResponseEntity<String> response = feignClient.createChannel(workspaceId, new br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerCreateChannelRequest(name, type));
            return parseResponse(response, "/v2/channel/workspace/" + workspaceId);
        } catch (RetryableException exception) {
            throw new GptMakerIntegrationException("GPTMAKER_UNAVAILABLE", "GPTMaker indisponivel agora.", exception.getMessage());
        } catch (FeignException exception) {
            throw mapFeignException(exception, "/v2/channel/workspace/" + workspaceId);
        }
    }

    public JsonNode getAgent(String agentId) {
        if (agentId == null || agentId.isBlank()) {
            throw new GptMakerIntegrationException("INVALID_AGENT", "Agent ID e obrigatorio.");
        }
        if (properties.mockEnabled()) {
            return objectMapper.createObjectNode()
                .put("id", agentId)
                .put("name", "Mock Agent")
                .put("behavior", "Assistente virtual");
        }
        if (!properties.tokenConfigured()) {
            throw new GptMakerIntegrationException("MISSING_TOKEN", MISSING_TOKEN_MESSAGE);
        }
        try {
            ResponseEntity<String> response = feignClient.getAgent(agentId);
            return parseResponse(response, "/v2/agent/" + agentId);
        } catch (RetryableException exception) {
            throw new GptMakerIntegrationException("GPTMAKER_UNAVAILABLE", "GPTMaker indisponivel agora.", exception.getMessage());
        } catch (FeignException exception) {
            throw mapFeignException(exception, "/v2/agent/" + agentId);
        }
    }

    public JsonNode listTransferRules(String agentId) {
        if (agentId == null || agentId.isBlank()) {
            throw new GptMakerIntegrationException("INVALID_AGENT", "Agent ID e obrigatorio.");
        }
        if (properties.mockEnabled()) {
            return objectMapper.createArrayNode();
        }
        if (!properties.tokenConfigured()) {
            throw new GptMakerIntegrationException("MISSING_TOKEN", MISSING_TOKEN_MESSAGE);
        }
        try {
            ResponseEntity<String> response = feignClient.listTransferRules(agentId);
            return parseResponse(response, "/v2/transfer-rules/agent/" + agentId);
        } catch (RetryableException exception) {
            throw new GptMakerIntegrationException("GPTMAKER_UNAVAILABLE", "GPTMaker indisponivel agora.", exception.getMessage());
        } catch (FeignException exception) {
            throw mapFeignException(exception, "/v2/transfer-rules/agent/" + agentId);
        }
    }

    public JsonNode listIdleActions(String agentId) {
        if (agentId == null || agentId.isBlank()) {
            throw new GptMakerIntegrationException("INVALID_AGENT", "Agent ID e obrigatorio.");
        }
        if (properties.mockEnabled()) {
            return objectMapper.createArrayNode();
        }
        if (!properties.tokenConfigured()) {
            throw new GptMakerIntegrationException("MISSING_TOKEN", MISSING_TOKEN_MESSAGE);
        }
        try {
            ResponseEntity<String> response = feignClient.listIdleActions(agentId);
            return parseResponse(response, "/v2/idle-actions/agent/" + agentId);
        } catch (RetryableException exception) {
            throw new GptMakerIntegrationException("GPTMAKER_UNAVAILABLE", "GPTMaker indisponivel agora.", exception.getMessage());
        } catch (FeignException exception) {
            throw mapFeignException(exception, "/v2/idle-actions/agent/" + agentId);
        }
    }

    private JsonNode parseResponse(ResponseEntity<String> response, String endpoint) {
        try {
            return objectMapper.readTree(response.getBody());
        } catch (Exception exception) {
            throw new GptMakerIntegrationException("PARSE_ERROR", PARSE_ERROR_MESSAGE, exception.getMessage(), response.getStatusCode().value(), endpoint, preview(response.getBody()));
        }
    }

    private GptMakerIntegrationException mapFeignException(FeignException exception, String endpoint) {
        return new GptMakerIntegrationException(
            resolveErrorCode(exception),
            resolveFriendlyMessage(exception),
            extractDetails(exception),
            exception.status() > 0 ? exception.status() : null,
            endpoint,
            preview(exception.contentUTF8())
        );
    }

    public record GptMakerHealthStatus(
        String baseUrl,
        boolean mockEnabled,
        boolean tokenConfigured,
        String status,
        String message
    ) {
    }

    public static class GptMakerIntegrationException extends RuntimeException {
        private final String errorCode;
        private final String details;
        private final Integer httpStatus;
        private final String endpoint;
        private final String responsePreview;

        public GptMakerIntegrationException(String errorCode, String message) {
            this(errorCode, message, null, null, null, null);
        }

        public GptMakerIntegrationException(String errorCode, String message, String details) {
            this(errorCode, message, details, null, null, null);
        }

        public GptMakerIntegrationException(String errorCode, String message, String details, Integer httpStatus, String endpoint, String responsePreview) {
            super(message);
            this.errorCode = errorCode;
            this.details = details;
            this.httpStatus = httpStatus;
            this.endpoint = endpoint;
            this.responsePreview = responsePreview;
        }

        public String getErrorCode() {
            return errorCode;
        }

        public String getDetails() {
            return details;
        }

        public Integer getHttpStatus() {
            return httpStatus;
        }

        public String getEndpoint() {
            return endpoint;
        }

        public String getResponsePreview() {
            return responsePreview;
        }
    }
}
