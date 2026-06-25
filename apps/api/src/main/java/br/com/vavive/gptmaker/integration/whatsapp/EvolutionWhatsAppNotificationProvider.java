package br.com.vavive.gptmaker.integration.whatsapp;

import br.com.vavive.gptmaker.config.VaviveWhatsAppProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

@Component
@Primary
public class EvolutionWhatsAppNotificationProvider implements WhatsAppNotificationProvider {
    private static final Logger log = LoggerFactory.getLogger(EvolutionWhatsAppNotificationProvider.class);

    private final VaviveWhatsAppProperties properties;
    private final DryRunWhatsAppNotificationProvider dryRunProvider;
    private final ObjectMapper objectMapper;
    private final RestClient restClient;

    public EvolutionWhatsAppNotificationProvider(
        VaviveWhatsAppProperties properties,
        DryRunWhatsAppNotificationProvider dryRunProvider,
        ObjectMapper objectMapper
    ) {
        this.properties = properties;
        this.dryRunProvider = dryRunProvider;
        this.objectMapper = objectMapper;
        this.restClient = RestClient.builder().build();
    }

    @Override
    public WhatsAppSendResult sendText(String phone, String message) {
        if (properties.isDryRunPreferred() || properties.evolution() == null || !properties.evolution().isConfigured()) {
            return dryRunProvider.sendText(phone, message);
        }

        String url = buildUrl();
        try {
            String response = post(url, buildRootTextPayload(phone, message), "root-text");
            return WhatsAppSendResult.success(response);
        } catch (RestClientResponseException exception) {
            if (requiresNestedTextMessage(exception.getResponseBodyAsString())) {
                try {
                    log.info("Evolution API sendText retrying with textMessage payload.");
                    String retryResponse = post(url, buildNestedTextPayload(phone, message), "text-message");
                    return WhatsAppSendResult.success(retryResponse);
                } catch (RestClientResponseException retryException) {
                    log.warn("Evolution API sendText retry failed status={} body={}", retryException.getStatusCode().value(), retryException.getResponseBodyAsString());
                    return WhatsAppSendResult.failed(resolveMessage(retryException.getResponseBodyAsString()), retryException.getResponseBodyAsString());
                } catch (Exception retryException) {
                    log.warn("Evolution API sendText retry failed: {}", retryException.getMessage());
                    return WhatsAppSendResult.failed(retryException.getMessage(), null);
                }
            }
            log.warn("Evolution API sendText failed status={} body={}", exception.getStatusCode().value(), exception.getResponseBodyAsString());
            return WhatsAppSendResult.failed(resolveMessage(exception.getResponseBodyAsString()), exception.getResponseBodyAsString());
        } catch (Exception exception) {
            log.warn("Evolution API sendText failed: {}", exception.getMessage());
            return WhatsAppSendResult.failed(exception.getMessage(), null);
        }
    }

    @Override
    public String providerName() {
        if (properties.isDryRunPreferred() || properties.evolution() == null || !properties.evolution().isConfigured()) {
            return dryRunProvider.providerName();
        }
        return "evolution";
    }

    private String buildUrl() {
        String baseUrl = properties.evolution().baseUrl().endsWith("/")
            ? properties.evolution().baseUrl().substring(0, properties.evolution().baseUrl().length() - 1)
            : properties.evolution().baseUrl();
        String path = properties.evolution().resolvedSendPath().replace("{instance}", properties.evolution().instance());
        return baseUrl + (path.startsWith("/") ? path : "/" + path);
    }

    private String post(String url, ObjectNode payload, String payloadFormat) {
        log.info("Evolution API sendText payload format={} keys={}", payloadFormat, payload.properties().stream().map(java.util.Map.Entry::getKey).toList());
        return restClient.post()
            .uri(url)
            .contentType(MediaType.APPLICATION_JSON)
            .header("apikey", properties.evolution().apiKey())
            .body(payload.toString())
            .retrieve()
            .onStatus(HttpStatusCode::isError, (request, clientResponse) -> {
                throw new RestClientResponseException(
                    "Evolution API error",
                    clientResponse.getStatusCode().value(),
                    clientResponse.getStatusText(),
                    clientResponse.getHeaders(),
                    clientResponse.getBody().readAllBytes(),
                    null
                );
            })
            .body(String.class);
    }

    private ObjectNode buildNestedTextPayload(String phone, String message) {
        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("number", phone);

        ObjectNode textMessage = objectMapper.createObjectNode();
        textMessage.put("text", message);
        payload.set("textMessage", textMessage);

        return payload;
    }

    private ObjectNode buildRootTextPayload(String phone, String message) {
        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("number", phone);
        payload.put("text", message);
        return payload;
    }

    private boolean requiresNestedTextMessage(String responseBody) {
        return responseBody != null
            && (responseBody.contains("textMessage")
                || responseBody.contains("requires property \"textMessage\"")
                || responseBody.contains("requires property \\\"textMessage\\\""));
    }

    private String resolveMessage(String responseBody) {
        if (responseBody == null || responseBody.isBlank()) {
            return "Falha ao enviar mensagem via Evolution API.";
        }
        try {
            JsonNode body = objectMapper.readTree(responseBody);
            if (body.hasNonNull("message")) {
                return body.get("message").asText();
            }
            JsonNode nestedResponse = body.get("response");
            if (nestedResponse != null) {
                JsonNode nestedMessage = nestedResponse.get("message");
                if (nestedMessage != null && !nestedMessage.isNull()) {
                    return nestedMessage.toString();
                }
            }
        } catch (Exception ignored) {
        }
        return responseBody;
    }
}
