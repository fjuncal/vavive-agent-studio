package br.com.vavive.gptmaker.domain.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
public class Franchise {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String name;
    private String document;
    private String city;
    private String state;
    private String status;
    private String workspaceId;
    private String workspaceName;
    private String agentId;
    private String agentName;
    private LocalDateTime gptMakerLastSyncAt;
    private LocalDateTime createdAt;

    protected Franchise() {
    }

    public Franchise(String name, String document, String city, String state, String status) {
        this.name = name;
        this.document = document;
        this.city = city;
        this.state = state;
        this.status = status;
    }

    @PrePersist
    void prePersist() {
        createdAt = LocalDateTime.now();
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDocument() {
        return document;
    }

    public void setDocument(String document) {
        this.document = document;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getWorkspaceId() {
        return workspaceId;
    }

    public void setWorkspaceId(String workspaceId) {
        this.workspaceId = workspaceId;
    }

    public String getWorkspaceName() {
        return workspaceName;
    }

    public void setWorkspaceName(String workspaceName) {
        this.workspaceName = workspaceName;
    }

    public String getAgentId() {
        return agentId;
    }

    public void setAgentId(String agentId) {
        this.agentId = agentId;
    }

    public String getAgentName() {
        return agentName;
    }

    public void setAgentName(String agentName) {
        this.agentName = agentName;
    }

    public LocalDateTime getGptMakerLastSyncAt() {
        return gptMakerLastSyncAt;
    }

    public void setGptMakerLastSyncAt(LocalDateTime gptMakerLastSyncAt) {
        this.gptMakerLastSyncAt = gptMakerLastSyncAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public String resolvedStatus() {
        if ("INATIVA".equals(status)) {
            return "INATIVA";
        }
        if (workspaceId == null || workspaceId.isBlank()) {
            return "PENDENTE_CONFIGURACAO";
        }
        if (agentId == null || agentId.isBlank()) {
            return "SEM_AGENTE";
        }
        return "ATIVA";
    }
}
