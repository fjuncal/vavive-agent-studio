package br.com.vavive.gptmaker.domain.entity;

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
public class ConversationSession {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "franchise_id")
    private Franchise franchise;

    private String externalAgentId;
    private String agentName;
    private String contextId;
    private String customerName;
    private String customerPhone;
    private String firstPrompt;
    private String lastResponse;
    private String chatId;
    private String interactionId;
    private boolean humanTakeoverActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    protected ConversationSession() {
    }

    public ConversationSession(
        Franchise franchise,
        String externalAgentId,
        String agentName,
        String contextId,
        String customerName,
        String customerPhone,
        String firstPrompt,
        String lastResponse,
        String chatId,
        String interactionId
    ) {
        this.franchise = franchise;
        this.externalAgentId = externalAgentId;
        this.agentName = agentName;
        this.contextId = contextId;
        this.customerName = customerName;
        this.customerPhone = customerPhone;
        this.firstPrompt = firstPrompt;
        this.lastResponse = lastResponse;
        this.chatId = chatId;
        this.interactionId = interactionId;
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

    public Franchise getFranchise() {
        return franchise;
    }

    public String getExternalAgentId() {
        return externalAgentId;
    }

    public String getAgentName() {
        return agentName;
    }

    public String getContextId() {
        return contextId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    public String getFirstPrompt() {
        return firstPrompt;
    }

    public String getLastResponse() {
        return lastResponse;
    }

    public void setLastResponse(String lastResponse) {
        this.lastResponse = lastResponse;
    }

    public String getChatId() {
        return chatId;
    }

    public void setChatId(String chatId) {
        this.chatId = chatId;
    }

    public String getInteractionId() {
        return interactionId;
    }

    public void setInteractionId(String interactionId) {
        this.interactionId = interactionId;
    }

    public boolean isHumanTakeoverActive() {
        return humanTakeoverActive;
    }

    public void setHumanTakeoverActive(boolean humanTakeoverActive) {
        this.humanTakeoverActive = humanTakeoverActive;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
