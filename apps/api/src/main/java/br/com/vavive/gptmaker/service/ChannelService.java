package br.com.vavive.gptmaker.service;

import br.com.vavive.gptmaker.config.AppRuntimeProperties;
import br.com.vavive.gptmaker.domain.entity.Franchise;
import br.com.vavive.gptmaker.domain.entity.FranchiseChannelSnapshot;
import br.com.vavive.gptmaker.domain.entity.User;
import br.com.vavive.gptmaker.domain.enums.UserRole;
import br.com.vavive.gptmaker.dto.ChannelQrCodeResponse;
import br.com.vavive.gptmaker.dto.FranchiseChannelResponse;
import br.com.vavive.gptmaker.integration.gptmaker.GptMakerClient;
import br.com.vavive.gptmaker.integration.gptmaker.GptMakerClient.GptMakerIntegrationException;
import br.com.vavive.gptmaker.repository.FranchiseChannelSnapshotRepository;
import br.com.vavive.gptmaker.repository.FranchiseRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ChannelService {
    private static final String WHATSAPP_INTEGRATION_MISSING_MESSAGE =
        "A integracao do WhatsApp nao esta disponivel para este canal. Fale com um dos administradores.";

    private final FranchiseRepository franchiseRepository;
    private final FranchiseChannelSnapshotRepository channelRepository;
    private final CurrentUserService currentUserService;
    private final GptMakerClient gptMakerClient;
    private final ChannelConfigurationService channelConfigurationService;
    private final AppRuntimeProperties runtimeProperties;
    private final ObjectMapper objectMapper;

    public ChannelService(
        FranchiseRepository franchiseRepository,
        FranchiseChannelSnapshotRepository channelRepository,
        CurrentUserService currentUserService,
        GptMakerClient gptMakerClient,
        ChannelConfigurationService channelConfigurationService,
        AppRuntimeProperties runtimeProperties,
        ObjectMapper objectMapper
    ) {
        this.franchiseRepository = franchiseRepository;
        this.channelRepository = channelRepository;
        this.currentUserService = currentUserService;
        this.gptMakerClient = gptMakerClient;
        this.channelConfigurationService = channelConfigurationService;
        this.runtimeProperties = runtimeProperties;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public List<FranchiseChannelResponse> list(UUID franchiseId) {
        Franchise franchise = requireAccessibleFranchise(franchiseId);
        if (realChannelsEnabled()) {
            syncInternal(franchise);
        }
        return channelRepository.findByFranchiseIdOrderByNameAsc(franchise.getId()).stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional
    public List<FranchiseChannelResponse> sync(UUID franchiseId) {
        Franchise franchise = requireAccessibleFranchise(franchiseId);
        syncInternal(franchise);
        return channelRepository.findByFranchiseIdOrderByNameAsc(franchise.getId()).stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional
    public FranchiseChannelResponse create(UUID franchiseId, String name, String type) {
        Franchise franchise = requireAccessibleFranchise(franchiseId);
        if (franchise.getWorkspaceId() == null || franchise.getWorkspaceId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Franquia sem workspace vinculada. Vincule uma workspace primeiro.");
        }
        String normalizedType = normalizeRequestedType(type);
        boolean agentManagedCreation = shouldCreateViaAgent(franchise, normalizedType);
        try {
            JsonNode created = agentManagedCreation
                ? gptMakerClient.createAgentChannel(franchise.getAgentId(), name, normalizedType)
                : gptMakerClient.createChannel(franchise.getWorkspaceId(), name, normalizedType);
            FranchiseChannelSnapshot snapshot = channelRepository.findFirstByFranchiseIdAndExternalChannelId(franchise.getId(), created.path("id").asText())
                .orElseGet(() -> new FranchiseChannelSnapshot(
                    franchise,
                    created.path("id").asText(),
                    created.path("name").asText(name),
                    created.path("type").asText(normalizedType)
                ));
            snapshot.setName(created.path("name").asText(name));
            snapshot.setChannelType(created.path("type").asText(normalizedType));
            snapshot.setConnected(created.path("connected").asBoolean(false));
            snapshot.setAgentId(created.path("assistantId").isNull() ? null : created.path("assistantId").asText(null));
            snapshot.setAgentName(null);
            snapshot.setExternalUsername(null);
            snapshot.setRawPayload(buildRawPayload(
                snapshot.getAgentId(),
                snapshot.getAgentName(),
                snapshot.getExternalUsername(),
                agentManagedCreation ? "AGENT" : "WORKSPACE"
            ));
            snapshot.setLastSyncError(null);
            snapshot.setLastSyncedAt(LocalDateTime.now());
            FranchiseChannelSnapshot saved = channelRepository.save(snapshot);
            if (!agentManagedCreation) {
                try {
                    channelConfigurationService.applyStandardConfig(saved, normalizedType);
                } catch (Exception exception) {
                    saved.setLastSyncError("Canal criado, mas a configuracao padrao nao foi aplicada: " + exception.getMessage());
                    channelRepository.save(saved);
                }
            }
            return toResponse(saved);
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, exception.getMessage());
        }
    }

    public ChannelQrCodeResponse getChannelQRCode(UUID franchiseId, UUID channelId) {
        Franchise franchise = requireAccessibleFranchise(franchiseId);
        FranchiseChannelSnapshot snapshot = requireChannel(franchise, channelId);
        if (snapshot.getExternalChannelId() == null || snapshot.getExternalChannelId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Canal sem ID externo configurado.");
        }
        try {
            JsonNode qrPayload = gptMakerClient.getChannelQRCode(snapshot.getExternalChannelId());
            if (qrPayload != null && qrPayload.isObject() && qrPayload.hasNonNull("error")) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, qrPayload.get("error").asText());
            }
            String qrValue = firstTextValue(qrPayload, "value", "qrCode", "qr_code", "base64");
            boolean connected = resolveConnectedStatus(franchise, snapshot, qrPayload, qrValue);
            return new ChannelQrCodeResponse(qrValue, connected, resolveQrCodeMessage(snapshot, qrValue, connected));
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, exception.getMessage());
        }
    }

    @Transactional
    public FranchiseChannelResponse editChannel(UUID franchiseId, UUID channelId, String name, String agentId) {
        Franchise franchise = requireAccessibleFranchise(franchiseId);
        FranchiseChannelSnapshot snapshot = requireChannel(franchise, channelId);
        try {
            var updated = gptMakerClient.editChannel(snapshot.getExternalChannelId(), name, agentId);
            if (name != null) {
                snapshot.setName(updated.path("name").asText(name));
            }
            if (agentId != null) {
                String normalizedAgentId = agentId.isBlank() ? null : updated.path("agentId").asText(agentId);
                snapshot.setAgentId(normalizedAgentId);
                if (normalizedAgentId == null) {
                    snapshot.setAgentName(null);
                }
            }
            snapshot.setLastSyncError(null);
            snapshot.setLastSyncedAt(LocalDateTime.now());
            return toResponse(channelRepository.save(snapshot));
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, exception.getMessage());
        }
    }

    public void deleteChannel(UUID franchiseId, UUID channelId) {
        Franchise franchise = requireAccessibleFranchise(franchiseId);
        FranchiseChannelSnapshot snapshot = requireChannel(franchise, channelId);
        try {
            gptMakerClient.deleteChannel(snapshot.getExternalChannelId());
            channelRepository.delete(snapshot);
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, exception.getMessage());
        }
    }

    private void syncInternal(Franchise franchise) {
        if (!realChannelsEnabled()) {
            return;
        }
        if (franchise.getWorkspaceId() == null || franchise.getWorkspaceId().isBlank()) {
            return;
        }

        try {
            var channels = gptMakerClient.listWorkspaceChannels(franchise.getWorkspaceId());
            LocalDateTime now = LocalDateTime.now();
            Set<String> remoteIds = new HashSet<>();
            for (var channel : channels) {
                remoteIds.add(channel.id());
                FranchiseChannelSnapshot snapshot = channelRepository.findFirstByFranchiseIdAndExternalChannelId(franchise.getId(), channel.id())
                    .orElseGet(() -> new FranchiseChannelSnapshot(franchise, channel.id(), channel.name(), normalizeType(channel)));
                snapshot.setName(channel.name());
                snapshot.setChannelType(normalizeType(channel));
                snapshot.setConnected(channel.connected());
                snapshot.setAgentId(channel.agentId());
                snapshot.setAgentName(channel.agentName());
                snapshot.setExternalUsername(channel.username());
                snapshot.setRawPayload(buildRawPayload(channel.agentId(), channel.agentName(), channel.username(), "WORKSPACE"));
                snapshot.setLastSyncError(null);
                snapshot.setLastSyncedAt(now);
                channelRepository.save(snapshot);
            }
            if (!remoteIds.isEmpty()) {
                channelRepository.findByFranchiseIdOrderByNameAsc(franchise.getId()).stream()
                    .filter(snapshot -> snapshot.getExternalChannelId() != null && !snapshot.getExternalChannelId().isBlank())
                    .filter(snapshot -> !isAgentManaged(snapshot))
                    .filter(snapshot -> !remoteIds.contains(snapshot.getExternalChannelId()))
                    .forEach(channelRepository::delete);
            }
        } catch (GptMakerIntegrationException exception) {
            channelRepository.findByFranchiseIdOrderByNameAsc(franchise.getId()).forEach(snapshot -> {
                snapshot.setLastSyncError(exception.getMessage());
                snapshot.setLastSyncedAt(LocalDateTime.now());
                channelRepository.save(snapshot);
            });
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, exception.getMessage());
        }
    }

    private Franchise requireAccessibleFranchise(UUID franchiseId) {
        User user = currentUserService.requireCurrentUser();
        if (franchiseId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecione a franquia para listar canais.");
        }
        Franchise franchise = franchiseRepository.findById(franchiseId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Franquia nao encontrada"));
        if (user.getRole() == UserRole.ADMIN_FRANQUIA
            && !franchise.getId().equals(currentUserService.requireFranchise(user).getId())) {
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

    private FranchiseChannelResponse toResponse(FranchiseChannelSnapshot snapshot) {
        return new FranchiseChannelResponse(
            snapshot.getId(),
            snapshot.getExternalChannelId(),
            snapshot.getName(),
            snapshot.getChannelType(),
            snapshot.isConnected(),
            snapshot.getAgentId(),
            snapshot.getAgentName(),
            snapshot.getExternalUsername(),
            snapshot.getConfigUpdatedAt(),
            snapshot.getLastSyncedAt(),
            snapshot.getLastSyncError()
        );
    }

    private String buildRawPayload(String agentId, String agentName, String username, String source) {
        try {
            ObjectNode node = objectMapper.createObjectNode();
            node.put("agentId", agentId);
            node.put("agentName", agentName);
            node.put("username", username);
            node.put("source", source);
            return objectMapper.writeValueAsString(node);
        } catch (Exception e) {
            return "{}";
        }
    }

    private String normalizeType(br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerChannelResponse channel) {
        if (channel.type() != null && !channel.type().isBlank()) {
            return channel.type().toUpperCase(Locale.ROOT);
        }
        return channel.username() != null && channel.username().startsWith("55")
            ? "WHATSAPP"
            : channel.facebookPageId() != null && !channel.facebookPageId().isBlank()
                ? "MESSENGER"
                : "WIDGET";
    }

    private String normalizeRequestedType(String type) {
        if (type == null || type.isBlank()) {
            return "WHATSAPP";
        }
        return type.toUpperCase(Locale.ROOT);
    }

    private boolean realChannelsEnabled() {
        return runtimeProperties.features() == null || runtimeProperties.features().realChannelsEnabled();
    }

    private boolean shouldCreateViaAgent(Franchise franchise, String normalizedType) {
        if (!"WHATSAPP".equals(normalizedType)) {
            return false;
        }
        if (franchise.getAgentId() == null || franchise.getAgentId().isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Para criar canal WhatsApp com QR Code, a franquia precisa ter um agente GPTMaker configurado."
            );
        }
        return true;
    }

    private boolean isAgentManaged(FranchiseChannelSnapshot snapshot) {
        if (snapshot.getRawPayload() == null || snapshot.getRawPayload().isBlank()) {
            return false;
        }
        try {
            JsonNode payload = objectMapper.readTree(snapshot.getRawPayload());
            return "AGENT".equalsIgnoreCase(firstTextValue(payload, "source"));
        } catch (Exception exception) {
            return false;
        }
    }

    private boolean resolveConnectedStatus(
        Franchise franchise,
        FranchiseChannelSnapshot snapshot,
        JsonNode qrPayload,
        String qrValue
    ) {
        boolean connected = booleanValue(qrPayload, "connected", snapshot.isConnected());
        if ((qrValue == null || qrValue.isBlank())
            && franchise.getWorkspaceId() != null
            && !franchise.getWorkspaceId().isBlank()) {
            connected = gptMakerClient.listWorkspaceChannels(franchise.getWorkspaceId()).stream()
                .filter(channel -> snapshot.getExternalChannelId().equals(channel.id()))
                .map(br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerChannelResponse::connected)
                .findFirst()
                .orElse(connected);
        }
        snapshot.setConnected(connected);
        snapshot.setLastSyncError(null);
        snapshot.setLastSyncedAt(LocalDateTime.now());
        channelRepository.save(snapshot);
        return connected;
    }

    private String firstTextValue(JsonNode node, String... fieldNames) {
        if (node == null || node.isNull()) {
            return null;
        }
        if (node.isTextual()) {
            String value = node.asText(null);
            return value == null || value.isBlank() ? null : value;
        }
        for (String fieldName : fieldNames) {
            if (!node.has(fieldName) || node.get(fieldName).isNull()) {
                continue;
            }
            String value = node.get(fieldName).asText(null);
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private boolean booleanValue(JsonNode node, String fieldName, boolean fallback) {
        if (node == null || node.isNull() || !node.has(fieldName) || node.get(fieldName).isNull()) {
            return fallback;
        }
        return node.get(fieldName).asBoolean(fallback);
    }

    private String resolveQrCodeMessage(FranchiseChannelSnapshot snapshot, String qrValue, boolean connected) {
        if ("WHATSAPP".equalsIgnoreCase(snapshot.getChannelType())
            && (qrValue == null || qrValue.isBlank())
            && !connected) {
            return WHATSAPP_INTEGRATION_MISSING_MESSAGE;
        }
        return null;
    }
}
