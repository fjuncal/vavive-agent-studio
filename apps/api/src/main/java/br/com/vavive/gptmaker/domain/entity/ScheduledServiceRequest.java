package br.com.vavive.gptmaker.domain.entity;

import br.com.vavive.gptmaker.domain.enums.ScheduledRequestStatus;
import jakarta.persistence.Column;
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
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "scheduled_service_requests")
public class ScheduledServiceRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "franchise_id")
    private Franchise franchise;

    private String agentExternalId;
    private String customerName;
    private String customerPhone;
    private String cpfOrCnpj;
    private String email;
    private String cep;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(columnDefinition = "TEXT")
    private String referencePoint;

    private String serviceType;
    private String plan;
    private String duration;
    private String requestedDatetime;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String rawPayload;

    @Enumerated(EnumType.STRING)
    private ScheduledRequestStatus status = ScheduledRequestStatus.RECEIVED;

    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        createdAt = LocalDateTime.now();
    }

    public UUID getId() { return id; }
    public Franchise getFranchise() { return franchise; }
    public void setFranchise(Franchise franchise) { this.franchise = franchise; }
    public String getAgentExternalId() { return agentExternalId; }
    public void setAgentExternalId(String agentExternalId) { this.agentExternalId = agentExternalId; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }
    public String getCpfOrCnpj() { return cpfOrCnpj; }
    public void setCpfOrCnpj(String cpfOrCnpj) { this.cpfOrCnpj = cpfOrCnpj; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getCep() { return cep; }
    public void setCep(String cep) { this.cep = cep; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getReferencePoint() { return referencePoint; }
    public void setReferencePoint(String referencePoint) { this.referencePoint = referencePoint; }
    public String getServiceType() { return serviceType; }
    public void setServiceType(String serviceType) { this.serviceType = serviceType; }
    public String getPlan() { return plan; }
    public void setPlan(String plan) { this.plan = plan; }
    public String getDuration() { return duration; }
    public void setDuration(String duration) { this.duration = duration; }
    public String getRequestedDatetime() { return requestedDatetime; }
    public void setRequestedDatetime(String requestedDatetime) { this.requestedDatetime = requestedDatetime; }
    public String getRawPayload() { return rawPayload; }
    public void setRawPayload(String rawPayload) { this.rawPayload = rawPayload; }
    public ScheduledRequestStatus getStatus() { return status; }
    public void setStatus(ScheduledRequestStatus status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
