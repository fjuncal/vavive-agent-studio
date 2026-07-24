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
    private static final int DEFAULT_TEXT_LIMIT = 255;
    private static final int SALE_SUMMARY_LIMIT = 3000;
    private static final int HANDOFF_ERROR_LIMIT = 2000;

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
    private String channelType;
    private String operationalStatus;
    private String responsibleUserName;
    private String syncStatus;
    private String closedReason;
    private String saleOutcome;

    @jakarta.persistence.Column(length = 3000)
    private String saleSummary;

    private String handoffStatus;
    private java.time.LocalDateTime handoffSentAt;

    @jakarta.persistence.Column(length = 2000)
    private String handoffError;

    private boolean humanTakeoverActive;
    private LocalDateTime lastMessageAt;
    private LocalDateTime lastSyncedAt;
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
        this.externalAgentId = fit(externalAgentId, DEFAULT_TEXT_LIMIT);
        this.agentName = fit(agentName, DEFAULT_TEXT_LIMIT);
        this.contextId = fit(contextId, DEFAULT_TEXT_LIMIT);
        this.customerName = fit(customerName, DEFAULT_TEXT_LIMIT);
        this.customerPhone = fit(customerPhone, DEFAULT_TEXT_LIMIT);
        this.firstPrompt = fit(firstPrompt, DEFAULT_TEXT_LIMIT);
        this.lastResponse = fit(lastResponse, DEFAULT_TEXT_LIMIT);
        this.chatId = fit(chatId, DEFAULT_TEXT_LIMIT);
        this.interactionId = fit(interactionId, DEFAULT_TEXT_LIMIT);
        this.channelType = fit("WEBCHAT", DEFAULT_TEXT_LIMIT);
        this.operationalStatus = fit("aguardando_ia", DEFAULT_TEXT_LIMIT);
        this.syncStatus = fit("local", DEFAULT_TEXT_LIMIT);
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

    public void setAgentName(String agentName) {
        this.agentName = fit(agentName, DEFAULT_TEXT_LIMIT);
    }

    public String getContextId() {
        return contextId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = fit(customerName, DEFAULT_TEXT_LIMIT);
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    public void setCustomerPhone(String customerPhone) {
        this.customerPhone = fit(customerPhone, DEFAULT_TEXT_LIMIT);
    }

    public String getFirstPrompt() {
        return firstPrompt;
    }

    public String getLastResponse() {
        return lastResponse;
    }

    public void setLastResponse(String lastResponse) {
        this.lastResponse = fit(lastResponse, DEFAULT_TEXT_LIMIT);
    }

    public String getChatId() {
        return chatId;
    }

    public void setChatId(String chatId) {
        this.chatId = fit(chatId, DEFAULT_TEXT_LIMIT);
    }

    public String getInteractionId() {
        return interactionId;
    }

    public void setInteractionId(String interactionId) {
        this.interactionId = fit(interactionId, DEFAULT_TEXT_LIMIT);
    }

    public boolean isHumanTakeoverActive() {
        return humanTakeoverActive;
    }

    public void setHumanTakeoverActive(boolean humanTakeoverActive) {
        this.humanTakeoverActive = humanTakeoverActive;
    }

    public String getChannelType() {
        return channelType;
    }

    public void setChannelType(String channelType) {
        this.channelType = fit(channelType, DEFAULT_TEXT_LIMIT);
    }

    public String getOperationalStatus() {
        return operationalStatus;
    }

    public void setOperationalStatus(String operationalStatus) {
        this.operationalStatus = fit(operationalStatus, DEFAULT_TEXT_LIMIT);
    }

    public String getResponsibleUserName() {
        return responsibleUserName;
    }

    public void setResponsibleUserName(String responsibleUserName) {
        this.responsibleUserName = fit(responsibleUserName, DEFAULT_TEXT_LIMIT);
    }

    public String getSyncStatus() {
        return syncStatus;
    }

    public void setSyncStatus(String syncStatus) {
        this.syncStatus = fit(syncStatus, DEFAULT_TEXT_LIMIT);
    }

    public String getClosedReason() {
        return closedReason;
    }

    public void setClosedReason(String closedReason) {
        this.closedReason = fit(closedReason, DEFAULT_TEXT_LIMIT);
    }

    public String getSaleOutcome() {
        return saleOutcome;
    }

    public void setSaleOutcome(String saleOutcome) {
        this.saleOutcome = fit(saleOutcome, DEFAULT_TEXT_LIMIT);
    }

    public String getSaleSummary() {
        return saleSummary;
    }

    public void setSaleSummary(String saleSummary) {
        this.saleSummary = fit(saleSummary, SALE_SUMMARY_LIMIT);
    }

    public String getHandoffStatus() {
        return handoffStatus;
    }

    public void setHandoffStatus(String handoffStatus) {
        this.handoffStatus = fit(handoffStatus, DEFAULT_TEXT_LIMIT);
    }

    public LocalDateTime getHandoffSentAt() {
        return handoffSentAt;
    }

    public void setHandoffSentAt(LocalDateTime handoffSentAt) {
        this.handoffSentAt = handoffSentAt;
    }

    public String getHandoffError() {
        return handoffError;
    }

    public void setHandoffError(String handoffError) {
        this.handoffError = fit(handoffError, HANDOFF_ERROR_LIMIT);
    }

    public LocalDateTime getLastMessageAt() {
        return lastMessageAt;
    }

    public void setLastMessageAt(LocalDateTime lastMessageAt) {
        this.lastMessageAt = lastMessageAt;
    }

    public LocalDateTime getLastSyncedAt() {
        return lastSyncedAt;
    }

    public void setLastSyncedAt(LocalDateTime lastSyncedAt) {
        this.lastSyncedAt = lastSyncedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    private String fit(String value, int limit) {
        if (value == null || value.length() <= limit) {
            return value;
        }
        return value.substring(0, limit);
    }
}
