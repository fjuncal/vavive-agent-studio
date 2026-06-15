package br.com.vavive.gptmaker.domain.entity;

import br.com.vavive.gptmaker.domain.enums.DefaultAgentTextCategory;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
public class DefaultAgentText {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String title;

    @Enumerated(EnumType.STRING)
    private DefaultAgentTextCategory category;

    @Lob
    private String content;

    private boolean active = true;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    protected DefaultAgentText() {
    }

    public DefaultAgentText(String title, DefaultAgentTextCategory category, String content, boolean active) {
        this.title = title;
        this.category = category;
        this.content = content;
        this.active = active;
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

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public DefaultAgentTextCategory getCategory() {
        return category;
    }

    public void setCategory(DefaultAgentTextCategory category) {
        this.category = category;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
