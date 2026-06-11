package br.com.vavive.gptmaker.domain.entity;

import br.com.vavive.gptmaker.domain.enums.LeadStatus;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
public class Lead {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String name;
    private String phone;
    private String service;
    private String source;

    @Enumerated(EnumType.STRING)
    private LeadStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "franchise_id")
    private Franchise franchise;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agent_id")
    private GptMakerAgent agent;

    private LocalDateTime createdAt;

    protected Lead() {
    }

    public Lead(String name, String phone, String service, String source, LeadStatus status, Franchise franchise, GptMakerAgent agent) {
        this.name = name;
        this.phone = phone;
        this.service = service;
        this.source = source;
        this.status = status;
        this.franchise = franchise;
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

    public String getPhone() {
        return phone;
    }

    public String getService() {
        return service;
    }

    public String getSource() {
        return source;
    }

    public LeadStatus getStatus() {
        return status;
    }

    public Franchise getFranchise() {
        return franchise;
    }

    public GptMakerAgent getAgent() {
        return agent;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
