package br.com.vavive.gptmaker.domain.entity;

import br.com.vavive.gptmaker.domain.enums.AssistantBlockMode;
import br.com.vavive.gptmaker.domain.enums.AssistantBlockType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
public class FranchiseAssistantBlockConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "franchise_id")
    private Franchise franchise;

    @Enumerated(EnumType.STRING)
    private AssistantBlockType blockType;

    @Enumerated(EnumType.STRING)
    private AssistantBlockMode mode;

    private Integer standardVersionApplied;

    @Lob
    @Column(length = 20000)
    private String customPayloadJson;

    private LocalDateTime customizedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    protected FranchiseAssistantBlockConfig() {
    }

    public FranchiseAssistantBlockConfig(Franchise franchise, AssistantBlockType blockType, AssistantBlockMode mode) {
        this.franchise = franchise;
        this.blockType = blockType;
        this.mode = mode;
    }

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
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

    public AssistantBlockType getBlockType() {
        return blockType;
    }

    public AssistantBlockMode getMode() {
        return mode;
    }

    public void setMode(AssistantBlockMode mode) {
        this.mode = mode;
    }

    public Integer getStandardVersionApplied() {
        return standardVersionApplied;
    }

    public void setStandardVersionApplied(Integer standardVersionApplied) {
        this.standardVersionApplied = standardVersionApplied;
    }

    public String getCustomPayloadJson() {
        return customPayloadJson;
    }

    public void setCustomPayloadJson(String customPayloadJson) {
        this.customPayloadJson = customPayloadJson;
    }

    public LocalDateTime getCustomizedAt() {
        return customizedAt;
    }

    public void setCustomizedAt(LocalDateTime customizedAt) {
        this.customizedAt = customizedAt;
    }
}
