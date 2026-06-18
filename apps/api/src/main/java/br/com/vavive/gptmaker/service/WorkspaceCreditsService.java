package br.com.vavive.gptmaker.service;

import br.com.vavive.gptmaker.domain.entity.Franchise;
import br.com.vavive.gptmaker.dto.WorkspaceCreditsResponse;
import br.com.vavive.gptmaker.integration.gptmaker.GptMakerClient;
import br.com.vavive.gptmaker.integration.gptmaker.GptMakerClient.GptMakerIntegrationException;
import com.fasterxml.jackson.databind.JsonNode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class WorkspaceCreditsService {
    private static final Duration CACHE_TTL = Duration.ofMinutes(2);

    private final GptMakerClient gptMakerClient;
    private final Map<String, CachedCredits> creditsCache = new ConcurrentHashMap<>();

    public WorkspaceCreditsService(GptMakerClient gptMakerClient) {
        this.gptMakerClient = gptMakerClient;
    }

    public WorkspaceCreditsResponse forFranchise(Franchise franchise) {
        return resolveCredits(franchise, false);
    }

    public Map<String, WorkspaceCreditsResponse> forFranchises(List<Franchise> franchises) {
        Map<String, WorkspaceCreditsResponse> response = new HashMap<>();
        for (Franchise franchise : franchises) {
            response.put(franchise.getId().toString(), resolveCredits(franchise, true));
        }
        return response;
    }

    private WorkspaceCreditsResponse resolveCredits(Franchise franchise, boolean preferCache) {
        if (franchise.getWorkspaceId() == null || franchise.getWorkspaceId().isBlank()) {
            return new WorkspaceCreditsResponse(
                franchise.getId(),
                "NO_WORKSPACE",
                0,
                0,
                0,
                "Unidade sem canal operacional vinculado.",
                LocalDateTime.now()
            );
        }
        CachedCredits cached = creditsCache.get(franchise.getWorkspaceId());
        if (cached != null && cached.isFresh()) {
            return cached.response();
        }
        if (preferCache && cached != null) {
            return cached.response();
        }
        try {
            JsonNode payload = gptMakerClient.getWorkspaceCredits(franchise.getWorkspaceId());
            long credits = readLong(payload, "credits", "totalCredits", "total", "credit");
            long used = readLong(payload, "used", "usedCredits", "consumed", "usage");
            long remaining = readLong(payload, "remaining", "available", "availableCredits", "balance");
            if (remaining == 0 && credits > 0 && used > 0) {
                remaining = Math.max(credits - used, 0);
            }
            if (credits == 0 && remaining > 0 && used > 0) {
                credits = remaining + used;
            }
            WorkspaceCreditsResponse response = new WorkspaceCreditsResponse(
                franchise.getId(),
                "AVAILABLE",
                credits,
                used,
                remaining,
                "Saldo operacional atualizado.",
                LocalDateTime.now()
            );
            creditsCache.put(franchise.getWorkspaceId(), new CachedCredits(response, LocalDateTime.now()));
            return response;
        } catch (GptMakerIntegrationException exception) {
            if (cached != null) {
                return new WorkspaceCreditsResponse(
                    franchise.getId(),
                    "STALE",
                    cached.response().credits(),
                    cached.response().used(),
                    cached.response().remaining(),
                    "Saldo exibido a partir do ultimo snapshot valido.",
                    cached.response().checkedAt()
                );
            }
            return new WorkspaceCreditsResponse(
                franchise.getId(),
                "UNAVAILABLE",
                0,
                0,
                0,
                "Saldo indisponivel no momento.",
                LocalDateTime.now()
            );
        }
    }

    private long readLong(JsonNode payload, String... candidates) {
        for (String candidate : candidates) {
            JsonNode node = findNode(payload, candidate);
            if (node != null && node.isNumber()) {
                return node.longValue();
            }
            if (node != null && node.isTextual()) {
                try {
                    return Long.parseLong(node.asText());
                } catch (NumberFormatException ignored) {
                    // continue
                }
            }
        }
        return 0;
    }

    private JsonNode findNode(JsonNode payload, String candidate) {
        if (payload == null || payload.isNull()) {
            return null;
        }
        if (payload.has(candidate)) {
            return payload.get(candidate);
        }
        if (payload.has("data") && payload.get("data").has(candidate)) {
            return payload.get("data").get(candidate);
        }
        if (payload.has("result") && payload.get("result").has(candidate)) {
            return payload.get("result").get(candidate);
        }
        return null;
    }

    private record CachedCredits(WorkspaceCreditsResponse response, LocalDateTime fetchedAt) {
        private boolean isFresh() {
            return fetchedAt.plus(CACHE_TTL).isAfter(LocalDateTime.now());
        }
    }
}
