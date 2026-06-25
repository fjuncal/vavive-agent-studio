package br.com.vavive.gptmaker.service;

import br.com.vavive.gptmaker.config.VaviveWebhookProperties;
import br.com.vavive.gptmaker.domain.entity.Franchise;
import br.com.vavive.gptmaker.domain.entity.ScheduledServiceRequest;
import br.com.vavive.gptmaker.dto.NotificationDispatchSummaryResponse;
import br.com.vavive.gptmaker.dto.ScheduledServiceWebhookResponse;
import br.com.vavive.gptmaker.repository.FranchiseRepository;
import br.com.vavive.gptmaker.repository.GptMakerAgentRepository;
import br.com.vavive.gptmaker.repository.ScheduledServiceRequestRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ScheduledServiceWebhookService {
    private static final Logger log = LoggerFactory.getLogger(ScheduledServiceWebhookService.class);
    private static final String FRIENDLY_MESSAGE = "Perfeito! Seu pedido de agendamento foi registrado. A equipe da Vavive vai acompanhar e confirmar os detalhes em breve.";

    private final ObjectMapper objectMapper;
    private final VaviveWebhookProperties webhookProperties;
    private final FranchiseRepository franchiseRepository;
    private final GptMakerAgentRepository gptMakerAgentRepository;
    private final ScheduledServiceRequestRepository scheduledServiceRequestRepository;
    private final WhatsAppNotificationService notificationService;

    public ScheduledServiceWebhookService(
        ObjectMapper objectMapper,
        VaviveWebhookProperties webhookProperties,
        FranchiseRepository franchiseRepository,
        GptMakerAgentRepository gptMakerAgentRepository,
        ScheduledServiceRequestRepository scheduledServiceRequestRepository,
        WhatsAppNotificationService notificationService
    ) {
        this.objectMapper = objectMapper;
        this.webhookProperties = webhookProperties;
        this.franchiseRepository = franchiseRepository;
        this.gptMakerAgentRepository = gptMakerAgentRepository;
        this.scheduledServiceRequestRepository = scheduledServiceRequestRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public ScheduledServiceWebhookResponse registerScheduledService(Map<String, Object> payload, String providedSecret) {
        validateSecret(providedSecret);
        try {
            Map<String, Object> safePayload = payload == null ? Map.of() : payload;
            ScheduledServiceRequest request = new ScheduledServiceRequest();
            request.setAgentExternalId(readString(safePayload, "agentId", "agentExternalId"));
            request.setCustomerName(readString(safePayload, "nome", "nomeCompleto", "Nomecompleto", "customerName"));
            request.setCustomerPhone(normalizePhone(readString(safePayload, "telefone", "Telefone", "customerPhone")));
            request.setCpfOrCnpj(readString(safePayload, "cpf", "CPF", "CPFouCNPJ"));
            request.setEmail(readString(safePayload, "email", "Email"));
            request.setCep(readString(safePayload, "cep", "CEP"));
            request.setAddress(readString(safePayload, "endereco", "Endereco", "EnderecoComBairro"));
            request.setReferencePoint(readString(safePayload, "pontoDeReferencia", "PontoDeReferencia"));
            request.setRequestedDatetime(readString(safePayload, "dataHora", "Dataehorasdoservico", "requestedDateTime"));
            request.setPlan(readString(safePayload, "plano", "Plano"));
            request.setServiceType(readString(safePayload, "tipoServico", "Tipodeservico"));
            request.setDuration(readString(safePayload, "duracao", "Duracaodoatendimento"));
            request.setRawPayload(objectMapper.writeValueAsString(safePayload));

            resolveFranchise(safePayload, request.getAgentExternalId()).ifPresent(request::setFranchise);

            ScheduledServiceRequest saved = scheduledServiceRequestRepository.save(request);
            NotificationDispatchSummaryResponse summary = notificationService.notifyScheduledService(saved);
            return new ScheduledServiceWebhookResponse(true, FRIENDLY_MESSAGE, saved.getId(), summary);
        } catch (Exception exception) {
            log.error("Failed to register scheduled service webhook", exception);
            return new ScheduledServiceWebhookResponse(
                true,
                FRIENDLY_MESSAGE,
                null,
                new NotificationDispatchSummaryResponse(0, 0, 0, 0, "unavailable")
            );
        }
    }

    private void validateSecret(String providedSecret) {
        if (!webhookProperties.secretConfigured()) {
            log.warn("Webhook /api/webhooks/vavive-agent/scheduled-service called without configured secret.");
            return;
        }
        if (providedSecret == null || !webhookProperties.secret().equals(providedSecret)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Webhook nao autorizado.");
        }
    }

    private Optional<Franchise> resolveFranchise(Map<String, Object> payload, String agentExternalId) {
        String franchiseId = readString(payload, "franchiseId", "franquiaId");
        if (franchiseId != null) {
            try {
                return franchiseRepository.findById(UUID.fromString(franchiseId.trim()));
            } catch (IllegalArgumentException ignored) {
                log.warn("Invalid franchise id in scheduled service webhook: {}", franchiseId);
            }
        }
        if (agentExternalId == null || agentExternalId.isBlank()) {
            return Optional.empty();
        }
        return franchiseRepository.findFirstByAgentId(agentExternalId)
            .or(() -> gptMakerAgentRepository.findAll().stream()
                .filter(agent -> agentExternalId.equals(agent.getExternalId()))
                .map(agent -> agent.getFranchise())
                .findFirst());
    }

    private String readString(Map<String, Object> payload, String... aliases) {
        for (String alias : aliases) {
            Object value = payload.get(alias);
            if (value instanceof String text && !text.isBlank()) {
                return text.trim();
            }
            if (value != null) {
                String normalized = String.valueOf(value).trim();
                if (!normalized.isBlank() && !"null".equalsIgnoreCase(normalized)) {
                    return normalized;
                }
            }
        }
        return null;
    }

    private String normalizePhone(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.replaceAll("[^0-9]", "");
        return normalized.isBlank() ? null : normalized;
    }
}
