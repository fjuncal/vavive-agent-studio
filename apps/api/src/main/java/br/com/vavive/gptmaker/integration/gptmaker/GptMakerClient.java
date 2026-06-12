package br.com.vavive.gptmaker.integration.gptmaker;

import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerCreateIntentRequest;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerCreateTrainingRequest;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerAgentResponse;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerErrorResponse;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerWorkspaceResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import feign.FeignException;
import feign.RetryableException;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class GptMakerClient {
    private static final String MISSING_TOKEN_MESSAGE = "Token da API GPTMaker nao configurado no backend.";

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

    public GptMakerHealthStatus health() {
        if (properties.mockEnabled()) {
            return new GptMakerHealthStatus(properties.baseUrl(), true, properties.tokenConfigured(), "MOCK", "Publicacao simulada em ambiente de desenvolvimento.");
        }
        if (!properties.tokenConfigured()) {
            return new GptMakerHealthStatus(properties.baseUrl(), false, false, "MISSING_TOKEN", MISSING_TOKEN_MESSAGE);
        }
        return new GptMakerHealthStatus(properties.baseUrl(), false, true, "READY", "Integracao pronta para usar a API real do GPTMaker.");
    }

    public List<GptMakerWorkspaceResponse> listWorkspaces() {
        if (properties.mockEnabled()) {
            return List.of(
                new GptMakerWorkspaceResponse("mock-workspace-vavive", "Workspace Vavive Demo"),
                new GptMakerWorkspaceResponse("mock-workspace-sp", "Workspace Sao Paulo")
            );
        }
        if (!properties.tokenConfigured()) {
            throw new GptMakerIntegrationException("MISSING_TOKEN", MISSING_TOKEN_MESSAGE);
        }
        try {
            return List.of(feignClient.listWorkspaces());
        } catch (RetryableException exception) {
            throw new GptMakerIntegrationException("GPTMAKER_UNAVAILABLE", "Nao foi possivel listar os workspaces do GPTMaker agora.", sanitize(exception.getMessage()));
        } catch (FeignException exception) {
            throw toIntegrationException(exception, "Nao foi possivel listar os workspaces do GPTMaker.");
        }
    }

    public List<GptMakerAgentResponse> listAgents(String workspaceId) {
        if (workspaceId == null || workspaceId.isBlank()) {
            throw new GptMakerIntegrationException("INVALID_WORKSPACE", "Workspace GPTMaker nao informado.");
        }
        if (properties.mockEnabled()) {
            return List.of(
                new GptMakerAgentResponse("mock-agent-" + workspaceId + "-01", "Assistente Comercial", "Acolhedor", null, "Atendimento", "https://gptmaker.ai", "Agente comercial da franquia"),
                new GptMakerAgentResponse("mock-agent-" + workspaceId + "-02", "Assistente Operacional", "Objetivo", null, "Operacao", "https://gptmaker.ai", "Agente de suporte operacional")
            );
        }
        if (!properties.tokenConfigured()) {
            throw new GptMakerIntegrationException("MISSING_TOKEN", MISSING_TOKEN_MESSAGE);
        }
        try {
            return List.of(feignClient.listAgents(workspaceId));
        } catch (RetryableException exception) {
            throw new GptMakerIntegrationException("GPTMAKER_UNAVAILABLE", "Nao foi possivel listar os agentes do GPTMaker agora.", sanitize(exception.getMessage()));
        } catch (FeignException exception) {
            throw toIntegrationException(exception, "Nao foi possivel listar os agentes do GPTMaker.");
        }
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

    private String sanitize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String sanitized = value.replaceAll("\\s+", " ").trim();
        return sanitized.length() > 300 ? sanitized.substring(0, 300) : sanitized;
    }

    private String normalizeReference(String reference) {
        return reference == null || reference.isBlank() ? null : reference;
    }

    private GptMakerIntegrationException toIntegrationException(FeignException exception, String fallbackMessage) {
        return new GptMakerIntegrationException(
            resolveErrorCode(exception),
            resolveFriendlyMessage(exception) == null ? fallbackMessage : resolveFriendlyMessage(exception),
            extractDetails(exception)
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

        public GptMakerIntegrationException(String errorCode, String message) {
            this(errorCode, message, null);
        }

        public GptMakerIntegrationException(String errorCode, String message, String details) {
            super(message);
            this.errorCode = errorCode;
            this.details = details;
        }

        public String getErrorCode() {
            return errorCode;
        }

        public String getDetails() {
            return details;
        }
    }
}
