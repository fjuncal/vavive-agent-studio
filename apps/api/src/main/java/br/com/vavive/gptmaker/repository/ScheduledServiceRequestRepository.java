package br.com.vavive.gptmaker.repository;

import br.com.vavive.gptmaker.domain.entity.ScheduledServiceRequest;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ScheduledServiceRequestRepository extends JpaRepository<ScheduledServiceRequest, UUID> {
}
