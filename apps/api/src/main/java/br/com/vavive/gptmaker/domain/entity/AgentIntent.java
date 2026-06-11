package br.com.vavive.gptmaker.domain.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
public class AgentIntent {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String name;
    private String description;
    private String examplePhrase;
    private boolean active = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agent_id")
    private GptMakerAgent agent;

    private LocalDateTime createdAt;

    protected AgentIntent() {
    }

    public AgentIntent(String name, String description, String examplePhrase, GptMakerAgent agent) {
        this.name = name;
        this.description = description;
        this.examplePhrase = examplePhrase;
        this.agent = agent;
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

    public String getDescription() {
        return description;
    }

    public String getExamplePhrase() {
        return examplePhrase;
    }

    public boolean isActive() {
        return active;
    }

    public GptMakerAgent getAgent() {
        return agent;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
