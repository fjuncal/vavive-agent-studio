package br.com.vavive.gptmaker.service;

import br.com.vavive.gptmaker.domain.entity.ChannelStandardConfig;
import br.com.vavive.gptmaker.domain.entity.Franchise;
import br.com.vavive.gptmaker.domain.entity.FranchiseChannelSnapshot;
import br.com.vavive.gptmaker.domain.entity.User;
import br.com.vavive.gptmaker.domain.enums.UserRole;
import br.com.vavive.gptmaker.dto.ChannelConfigurationResponse;
import br.com.vavive.gptmaker.dto.UpdateChannelConfigurationRequest;
import br.com.vavive.gptmaker.integration.gptmaker.GptMakerClient;
import br.com.vavive.gptmaker.integration.gptmaker.GptMakerClient.GptMakerIntegrationException;
import br.com.vavive.gptmaker.repository.ChannelStandardConfigRepository;
import br.com.vavive.gptmaker.repository.FranchiseChannelSnapshotRepository;
import br.com.vavive.gptmaker.repository.FranchiseRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ChannelConfigurationService {
    private final ChannelStandardConfigRepository standardConfigRepository;
    private final FranchiseRepository franchiseRepository;
    private final FranchiseChannelSnapshotRepository channelRepository;
    private final CurrentUserService currentUserService;
    private final GptMakerClient gptMakerClient;
    private final ObjectMapper objectMapper;

    public ChannelConfigurationService(
        ChannelStandardConfigRepository standardConfigRepository,
        FranchiseRepository franchiseRepository,
        FranchiseChannelSnapshotRepository channelRepository,
        CurrentUserService currentUserService,
        GptMakerClient gptMakerClient,
        ObjectMapper objectMapper
    ) {
        this.standardConfigRepository = standardConfigRepository;
        this.franchiseRepository = franchiseRepository;
        this.channelRepository = channelRepository;
        this.currentUserService = currentUserService;
        this.gptMakerClient = gptMakerClient;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public ChannelConfigurationResponse getStandard(String channelType) {
        currentUserService.requireSuperAdmin("Apenas SUPER_ADMIN pode editar configuracoes padrao de canais.");
        String normalizedType = normalizeChannelType(channelType);
        ChannelStandardConfig config = standardConfigRepository.findFirstByChannelTypeIgnoreCase(normalizedType).orElse(null);
        JsonNode payload = config == null
            ? defaultPayload(normalizedType)
            : normalizePayload(normalizedType, readJson(config.getPayloadJson(), normalizedType));
        return new ChannelConfigurationResponse(normalizedType, objectMapper.convertValue(payload, Object.class), config == null ? null : config.getUpdatedAt(), true);
    }

    @Transactional
    public ChannelConfigurationResponse updateStandard(String channelType, UpdateChannelConfigurationRequest request) {
        currentUserService.requireSuperAdmin("Apenas SUPER_ADMIN pode editar configuracoes padrao de canais.");
        String normalizedType = normalizeChannelType(channelType);
        JsonNode payload = normalizePayload(normalizedType, request == null ? null : objectMapper.valueToTree(request.payload()));
        ChannelStandardConfig config = standardConfigRepository.findFirstByChannelTypeIgnoreCase(normalizedType)
            .orElseGet(() -> new ChannelStandardConfig(normalizedType, writeJson(defaultPayload(normalizedType))));
        config.setChannelType(normalizedType);
        config.setPayloadJson(writeJson(payload));
        ChannelStandardConfig saved = standardConfigRepository.save(config);
        return new ChannelConfigurationResponse(normalizedType, objectMapper.convertValue(payload, Object.class), saved.getUpdatedAt(), true);
    }

    @Transactional
    public ChannelConfigurationResponse getChannelConfig(UUID franchiseId, UUID channelId) {
        Franchise franchise = requireAccessibleFranchise(franchiseId);
        FranchiseChannelSnapshot snapshot = requireChannel(franchise, channelId);
        String channelType = normalizeChannelType(snapshot.getChannelType());
        JsonNode cachedPayload = normalizePayload(channelType, readJson(snapshot.getConfigPayloadJson(), channelType));
        JsonNode payload;
        if (snapshot.getExternalChannelId() != null && !snapshot.getExternalChannelId().isBlank()) {
            try {
                payload = chooseEffectivePayload(channelType, gptMakerClient.getChannelConfig(snapshot.getExternalChannelId()), cachedPayload);
                snapshot.setConfigPayloadJson(writeJson(payload));
                snapshot.setConfigUpdatedAt(LocalDateTime.now());
                snapshot.setLastSyncError(null);
                channelRepository.save(snapshot);
            } catch (GptMakerIntegrationException exception) {
                payload = cachedPayload;
                snapshot.setLastSyncError(exception.getMessage());
                channelRepository.save(snapshot);
            }
        } else {
            payload = cachedPayload;
        }
        return new ChannelConfigurationResponse(channelType, objectMapper.convertValue(payload, Object.class), snapshot.getConfigUpdatedAt(), false);
    }

    @Transactional
    public ChannelConfigurationResponse updateChannelConfig(UUID franchiseId, UUID channelId, UpdateChannelConfigurationRequest request) {
        Franchise franchise = requireAccessibleFranchise(franchiseId);
        FranchiseChannelSnapshot snapshot = requireChannel(franchise, channelId);
        if (snapshot.getExternalChannelId() == null || snapshot.getExternalChannelId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Canal sem ID externo configurado.");
        }
        String channelType = normalizeChannelType(snapshot.getChannelType());
        JsonNode payload = normalizePayload(channelType, request == null ? null : objectMapper.valueToTree(request.payload()));
        try {
            JsonNode updated = chooseEffectivePayload(channelType, gptMakerClient.updateChannelConfig(snapshot.getExternalChannelId(), payload), payload);
            snapshot.setConfigPayloadJson(writeJson(updated));
            snapshot.setConfigUpdatedAt(LocalDateTime.now());
            snapshot.setLastSyncError(null);
            channelRepository.save(snapshot);
            return new ChannelConfigurationResponse(channelType, objectMapper.convertValue(updated, Object.class), snapshot.getConfigUpdatedAt(), false);
        } catch (GptMakerIntegrationException exception) {
            snapshot.setConfigPayloadJson(writeJson(payload));
            snapshot.setLastSyncError(exception.getMessage());
            channelRepository.save(snapshot);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, exception.getMessage());
        }
    }

    public JsonNode applyStandardConfig(FranchiseChannelSnapshot snapshot, String requestedChannelType) {
        String channelType = normalizeChannelType(requestedChannelType);
        JsonNode payload = resolveStandardPayload(channelType);
        JsonNode updated = chooseEffectivePayload(channelType, gptMakerClient.updateChannelConfig(snapshot.getExternalChannelId(), payload), payload);
        snapshot.setConfigPayloadJson(writeJson(updated));
        snapshot.setConfigUpdatedAt(LocalDateTime.now());
        snapshot.setLastSyncError(null);
        channelRepository.save(snapshot);
        return updated;
    }

    public JsonNode resolveStandardPayload(String channelType) {
        String normalizedType = normalizeChannelType(channelType);
        return standardConfigRepository.findFirstByChannelTypeIgnoreCase(normalizedType)
            .map(ChannelStandardConfig::getPayloadJson)
            .map(raw -> normalizePayload(normalizedType, readJson(raw, normalizedType)))
            .orElseGet(() -> defaultPayload(normalizedType));
    }

    private Franchise requireAccessibleFranchise(UUID franchiseId) {
        User user = currentUserService.requireCurrentUser();
        Franchise franchise = franchiseRepository.findById(franchiseId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Franquia nao encontrada."));
        if (user.getRole() == UserRole.ADMIN_FRANQUIA
            && (user.getFranchise() == null || !franchise.getId().equals(user.getFranchise().getId()))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "ADMIN_FRANQUIA so pode acessar dados da propria franquia.");
        }
        return franchise;
    }

    private FranchiseChannelSnapshot requireChannel(Franchise franchise, UUID channelId) {
        FranchiseChannelSnapshot snapshot = channelRepository.findById(channelId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Canal nao encontrado."));
        if (!snapshot.getFranchise().getId().equals(franchise.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Canal nao pertence a franquia informada.");
        }
        return snapshot;
    }

    private JsonNode defaultPayload(String channelType) {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("type", normalizeChannelType(channelType));
        node.put("enabledTyping", false);
        node.put("autoReadMessages", false);
        node.put("audioAction", "RESPOND");
        node.put("startTrigger", "ALWAYS");
        node.put("endTrigger", "NEVER");
        node.put("enableGroupsResponse", false);
        node.put("replyGroupsType", "IGNORE");
        node.put("enablePrivateChatResponse", true);
        node.put("callRejectAuto", true);
        node.put("callRejectMessage", "Desculpe, mas este canal nao aceita chamadas telefonicas, apenas comunicacoes por meio de texto.");
        node.put("takeOutsideService", false);
        node.put("takeOutsideServiceCommandReturn", false);
        node.put("waitingMessageEnabled", false);
        node.put("waitingMessageText", "oi");
        return node;
    }

    private JsonNode normalizePayload(String channelType, JsonNode source) {
        ObjectNode defaults = (ObjectNode) defaultPayload(channelType);
        ObjectNode normalized = source instanceof ObjectNode objectNode ? objectNode.deepCopy() : defaults.deepCopy();
        defaults.fields().forEachRemaining(entry -> {
            if (!normalized.has(entry.getKey()) || normalized.get(entry.getKey()).isNull()) {
                normalized.set(entry.getKey(), entry.getValue());
            }
        });
        normalized.put("type", normalizeChannelType(channelType));
        return normalized;
    }

    private JsonNode chooseEffectivePayload(String channelType, JsonNode candidate, JsonNode fallback) {
        if (hasConfigFields(candidate)) {
            return normalizePayload(channelType, candidate);
        }
        return normalizePayload(channelType, fallback);
    }

    private boolean hasConfigFields(JsonNode candidate) {
        if (candidate == null || !candidate.isObject()) {
            return false;
        }
        for (String field : new String[] {
            "enabledTyping",
            "autoReadMessages",
            "audioAction",
            "startTrigger",
            "endTrigger",
            "enableGroupsResponse",
            "replyGroupsType",
            "enablePrivateChatResponse",
            "callRejectAuto",
            "callRejectMessage",
            "takeOutsideService",
            "takeOutsideServiceCommandReturn",
            "waitingMessageEnabled",
            "waitingMessageText"
        }) {
            if (candidate.has(field)) {
                return true;
            }
        }
        return false;
    }

    private JsonNode readJson(String raw, String channelType) {
        if (raw == null || raw.isBlank()) {
            return defaultPayload(channelType);
        }
        try {
            return objectMapper.readTree(raw);
        } catch (Exception exception) {
            return defaultPayload(channelType);
        }
    }

    private String writeJson(JsonNode payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payload de configuracao do canal invalido.");
        }
    }

    private String normalizeChannelType(String channelType) {
        if (channelType == null || channelType.isBlank()) {
            return "WHATSAPP";
        }
        return channelType.toUpperCase(Locale.ROOT);
    }
}
