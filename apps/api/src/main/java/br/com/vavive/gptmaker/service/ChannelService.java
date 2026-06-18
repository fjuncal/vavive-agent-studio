package br.com.vavive.gptmaker.service;

import br.com.vavive.gptmaker.config.AppRuntimeProperties;
import br.com.vavive.gptmaker.domain.entity.Franchise;
import br.com.vavive.gptmaker.domain.entity.FranchiseChannelSnapshot;
import br.com.vavive.gptmaker.domain.entity.User;
import br.com.vavive.gptmaker.domain.enums.UserRole;
import br.com.vavive.gptmaker.dto.FranchiseChannelResponse;
import br.com.vavive.gptmaker.integration.gptmaker.GptMakerClient;
import br.com.vavive.gptmaker.integration.gptmaker.GptMakerClient.GptMakerIntegrationException;
import br.com.vavive.gptmaker.repository.FranchiseChannelSnapshotRepository;
import br.com.vavive.gptmaker.repository.FranchiseRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ChannelService {
    private final FranchiseRepository franchiseRepository;
    private final FranchiseChannelSnapshotRepository channelRepository;
    private final CurrentUserService currentUserService;
    private final GptMakerClient gptMakerClient;
    private final AppRuntimeProperties runtimeProperties;
    private final ObjectMapper objectMapper;

    public ChannelService(
        FranchiseRepository franchiseRepository,
        FranchiseChannelSnapshotRepository channelRepository,
        CurrentUserService currentUserService,
        GptMakerClient gptMakerClient,
        AppRuntimeProperties runtimeProperties,
        ObjectMapper objectMapper
    ) {
        this.franchiseRepository = franchiseRepository;
        this.channelRepository = channelRepository;
        this.currentUserService = currentUserService;
        this.gptMakerClient = gptMakerClient;
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

    public Object create(UUID franchiseId, String name, String type) {
        Franchise franchise = requireAccessibleFranchise(franchiseId);
        if (franchise.getWorkspaceId() == null || franchise.getWorkspaceId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Franquia sem workspace vinculada. Vincule uma workspace primeiro.");
        }
        try {
            return gptMakerClient.createChannel(franchise.getWorkspaceId(), name, type);
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, exception.getMessage());
        }
    }

    public Object getChannelQRCode(UUID franchiseId, UUID channelId) {
        requireAccessibleFranchise(franchiseId);
        FranchiseChannelSnapshot snapshot = channelRepository.findById(channelId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Canal nao encontrado."));
        if (snapshot.getExternalChannelId() == null || snapshot.getExternalChannelId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Canal sem ID externo configurado.");
        }
        try {
            return gptMakerClient.getChannelQRCode(snapshot.getExternalChannelId());
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, exception.getMessage());
        }
    }

    public void editChannel(UUID franchiseId, UUID channelId, String name, String agentId) {
        requireAccessibleFranchise(franchiseId);
        FranchiseChannelSnapshot snapshot = channelRepository.findById(channelId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Canal nao encontrado."));
        try {
            gptMakerClient.editChannel(snapshot.getExternalChannelId(), name, agentId);
            if (name != null) {
                snapshot.setName(name);
                channelRepository.save(snapshot);
            }
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, exception.getMessage());
        }
    }

    public void deleteChannel(UUID franchiseId, UUID channelId) {
        requireAccessibleFranchise(franchiseId);
        FranchiseChannelSnapshot snapshot = channelRepository.findById(channelId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Canal nao encontrado."));
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
            for (var channel : channels) {
                FranchiseChannelSnapshot snapshot = channelRepository.findFirstByFranchiseIdAndExternalChannelId(franchise.getId(), channel.id())
                    .orElseGet(() -> new FranchiseChannelSnapshot(franchise, channel.id(), channel.name(), normalizeType(channel)));
                snapshot.setName(channel.name());
                snapshot.setChannelType(normalizeType(channel));
                snapshot.setConnected(channel.connected());
                snapshot.setAgentId(channel.agentId());
                snapshot.setAgentName(channel.agentName());
                snapshot.setExternalUsername(channel.username());
                snapshot.setRawPayload(buildRawPayload(channel.agentId(), channel.agentName(), channel.username()));
                snapshot.setLastSyncError(null);
                snapshot.setLastSyncedAt(now);
                channelRepository.save(snapshot);
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

    private FranchiseChannelResponse toResponse(FranchiseChannelSnapshot snapshot) {
        return new FranchiseChannelResponse(
            snapshot.getId(),
            snapshot.getExternalChannelId(),
            snapshot.getName(),
            snapshot.getChannelType(),
            snapshot.isConnected(),
            snapshot.getAgentName(),
            snapshot.getExternalUsername(),
            snapshot.getLastSyncedAt(),
            snapshot.getLastSyncError()
        );
    }

    private String buildRawPayload(String agentId, String agentName, String username) {
        try {
            ObjectNode node = objectMapper.createObjectNode();
            node.put("agentId", agentId);
            node.put("agentName", agentName);
            node.put("username", username);
            return objectMapper.writeValueAsString(node);
        } catch (Exception e) {
            return "{}";
        }
    }

    private String normalizeType(br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerChannelResponse channel) {
        String source = channel.username() != null && channel.username().startsWith("55")
            ? "WHATSAPP"
            : channel.facebookPageId() != null && !channel.facebookPageId().isBlank()
                ? "FACEBOOK"
                : "WEBCHAT";
        return source;
    }

    private boolean realChannelsEnabled() {
        return runtimeProperties.features() == null || runtimeProperties.features().realChannelsEnabled();
    }
}
