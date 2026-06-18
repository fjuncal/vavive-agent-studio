package br.com.vavive.gptmaker.domain.entity;

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
public class AssistantStandardBlock {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_id")
    private AssistantStandardProfile profile;

    @Enumerated(EnumType.STRING)
    private AssistantBlockType blockType;

    @Lob
    @Column(length = 20000)
    private String payloadJson;

    private int version;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    protected AssistantStandardBlock() {
    }

    public AssistantStandardBlock(AssistantStandardProfile profile, AssistantBlockType blockType, String payloadJson, int version) {
        this.profile = profile;
        this.blockType = blockType;
        this.payloadJson = payloadJson;
        this.version = version;
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

    public AssistantStandardProfile getProfile() {
        return profile;
    }

    public AssistantBlockType getBlockType() {
        return blockType;
    }

    public void setBlockType(AssistantBlockType blockType) {
        this.blockType = blockType;
    }

    public String getPayloadJson() {
        return payloadJson;
    }

    public void setPayloadJson(String payloadJson) {
        this.payloadJson = payloadJson;
    }

    public int getVersion() {
        return version;
    }

    public void setVersion(int version) {
        this.version = version;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
