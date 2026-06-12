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
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
public class AgentTraining {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String title;

    @Column(length = 6000)
    private String content;

    private String status;
    private String externalReference;

    @Column(length = 2000)
    private String resultMessage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agent_id")
    private GptMakerAgent agent;

    private LocalDateTime createdAt;

    protected AgentTraining() {
    }

    public AgentTraining(String title, String content, String status, String externalReference, String resultMessage, GptMakerAgent agent) {
        this.title = title;
        this.content = content;
        this.status = status;
        this.externalReference = externalReference;
        this.resultMessage = resultMessage;
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

    public String getContent() {
        return content;
    }

    public String getStatus() {
        return status;
    }

    public String getExternalReference() {
        return externalReference;
    }

    public String getResultMessage() {
        return resultMessage;
    }

    public GptMakerAgent getAgent() {
        return agent;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
