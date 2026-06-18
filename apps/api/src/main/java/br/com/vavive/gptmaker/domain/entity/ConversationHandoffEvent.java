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
public class ConversationHandoffEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id")
    private ConversationSession conversation;

    private String outcome;
    private String deliveryStatus;
    private String responsibleUserName;
    private String recipientPhone;

    @Column(length = 3000)
    private String summary;

    @Column(length = 2000)
    private String deliveryError;

    private LocalDateTime sentAt;
    private LocalDateTime createdAt;

    protected ConversationHandoffEvent() {
    }

    public ConversationHandoffEvent(ConversationSession conversation, String outcome, String deliveryStatus, String responsibleUserName, String recipientPhone, String summary, String deliveryError, LocalDateTime sentAt) {
        this.conversation = conversation;
        this.outcome = outcome;
        this.deliveryStatus = deliveryStatus;
        this.responsibleUserName = responsibleUserName;
        this.recipientPhone = recipientPhone;
        this.summary = summary;
        this.deliveryError = deliveryError;
        this.sentAt = sentAt;
    }

    @PrePersist
    void prePersist() {
        createdAt = LocalDateTime.now();
    }

    public UUID getId() {
        return id;
    }

    public String getOutcome() {
        return outcome;
    }

    public String getDeliveryStatus() {
        return deliveryStatus;
    }

    public String getResponsibleUserName() {
        return responsibleUserName;
    }

    public String getRecipientPhone() {
        return recipientPhone;
    }

    public String getSummary() {
        return summary;
    }

    public String getDeliveryError() {
        return deliveryError;
    }

    public LocalDateTime getSentAt() {
        return sentAt;
    }
}
