package br.com.vavive.gptmaker.domain.entity;

import br.com.vavive.gptmaker.domain.enums.AssistantBlockType;
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
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
public class AssistantStandardBlockHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "block_id")
    private AssistantStandardBlock block;

    @Enumerated(EnumType.STRING)
    private AssistantBlockType blockType;

    private int version;

    @Lob
    private String payloadJson;

    private String changedBy;
    private LocalDateTime changedAt;

    protected AssistantStandardBlockHistory() {
    }

    public AssistantStandardBlockHistory(AssistantStandardBlock block, int version, String payloadJson, String changedBy) {
        this.block = block;
        this.blockType = block.getBlockType();
        this.version = version;
        this.payloadJson = payloadJson;
        this.changedBy = changedBy;
    }

    @PrePersist
    void prePersist() {
        changedAt = LocalDateTime.now();
    }

    public UUID getId() {
        return id;
    }

    public AssistantStandardBlock getBlock() {
        return block;
    }

    public AssistantBlockType getBlockType() {
        return blockType;
    }

    public int getVersion() {
        return version;
    }

    public String getPayloadJson() {
        return payloadJson;
    }

    public String getChangedBy() {
        return changedBy;
    }

    public LocalDateTime getChangedAt() {
        return changedAt;
    }
}
