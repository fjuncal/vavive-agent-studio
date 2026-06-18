package br.com.vavive.gptmaker.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
public class AgentConversationExample {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agent_id")
    private GptMakerAgent agent;

    private String title;
    private String objective;

    @Column(length = 8000)
    private String messages;

    private String status;
    private boolean includeInTraining;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    protected AgentConversationExample() {
    }

    public AgentConversationExample(GptMakerAgent agent, String title, String objective, String messages, String status, boolean includeInTraining) {
        this.agent = agent;
        this.title = title;
        this.objective = objective;
        this.messages = messages;
        this.status = status;
        this.includeInTraining = includeInTraining;
    }

    @PrePersist
    void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public UUID getId() {
        return id;
    }

    public GptMakerAgent getAgent() {
        return agent;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getObjective() {
        return objective;
    }

    public void setObjective(String objective) {
        this.objective = objective;
    }

    public String getMessages() {
        return messages;
    }

    public void setMessages(String messages) {
        this.messages = messages;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public boolean isIncludeInTraining() {
        return includeInTraining;
    }

    public void setIncludeInTraining(boolean includeInTraining) {
        this.includeInTraining = includeInTraining;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
