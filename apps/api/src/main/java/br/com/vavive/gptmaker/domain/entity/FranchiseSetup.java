package br.com.vavive.gptmaker.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
public class FranchiseSetup {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "franchise_id", unique = true)
    private Franchise franchise;

    private String responsibleName;

    @Column(length = 4000)
    private String services;

    @Column(length = 4000)
    private String prices;

    @Column(length = 4000)
    private String regions;

    @Column(length = 4000)
    private String schedules;

    @Column(length = 8000)
    private String faq;

    @Column(length = 8000)
    private String rules;

    @Column(length = 2000)
    private String toneOfVoice;

    @Column(length = 1000)
    private String franchiseWhatsapp;

    @Column(length = 6000)
    private String conversationExamplesSummary;

    @Column(length = 12000)
    private String lastGeneratedTraining;

    private LocalDateTime lastPublishedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    protected FranchiseSetup() {
    }

    public FranchiseSetup(Franchise franchise) {
        this.franchise = franchise;
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

    public String getResponsibleName() {
        return responsibleName;
    }

    public void setResponsibleName(String responsibleName) {
        this.responsibleName = responsibleName;
    }

    public String getServices() {
        return services;
    }

    public void setServices(String services) {
        this.services = services;
    }

    public String getPrices() {
        return prices;
    }

    public void setPrices(String prices) {
        this.prices = prices;
    }

    public String getRegions() {
        return regions;
    }

    public void setRegions(String regions) {
        this.regions = regions;
    }

    public String getSchedules() {
        return schedules;
    }

    public void setSchedules(String schedules) {
        this.schedules = schedules;
    }

    public String getFaq() {
        return faq;
    }

    public void setFaq(String faq) {
        this.faq = faq;
    }

    public String getRules() {
        return rules;
    }

    public void setRules(String rules) {
        this.rules = rules;
    }

    public String getToneOfVoice() {
        return toneOfVoice;
    }

    public void setToneOfVoice(String toneOfVoice) {
        this.toneOfVoice = toneOfVoice;
    }

    public String getFranchiseWhatsapp() {
        return franchiseWhatsapp;
    }

    public void setFranchiseWhatsapp(String franchiseWhatsapp) {
        this.franchiseWhatsapp = franchiseWhatsapp;
    }

    public String getConversationExamplesSummary() {
        return conversationExamplesSummary;
    }

    public void setConversationExamplesSummary(String conversationExamplesSummary) {
        this.conversationExamplesSummary = conversationExamplesSummary;
    }

    public String getLastGeneratedTraining() {
        return lastGeneratedTraining;
    }

    public void setLastGeneratedTraining(String lastGeneratedTraining) {
        this.lastGeneratedTraining = lastGeneratedTraining;
    }

    public LocalDateTime getLastPublishedAt() {
        return lastPublishedAt;
    }

    public void setLastPublishedAt(LocalDateTime lastPublishedAt) {
        this.lastPublishedAt = lastPublishedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
