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
public class AgentRule {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String title;
    private String description;
    private String category;
    private boolean enabled;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agent_id")
    private GptMakerAgent agent;

    private LocalDateTime createdAt;

    protected AgentRule() {
    }

    public AgentRule(String title, String description, String category, boolean enabled, GptMakerAgent agent) {
        this.title = title;
        this.description = description;
        this.category = category;
        this.enabled = enabled;
        this.agent = agent;
    }

    @PrePersist
    void prePersist() {
        createdAt = LocalDateTime.now();
    }

    public UUID getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public String getCategory() {
        return category;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public GptMakerAgent getAgent() {
        return agent;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
