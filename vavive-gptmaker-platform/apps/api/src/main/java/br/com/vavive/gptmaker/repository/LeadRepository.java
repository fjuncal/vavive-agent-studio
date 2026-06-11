package br.com.vavive.gptmaker.repository;

import br.com.vavive.gptmaker.domain.entity.Lead;
import br.com.vavive.gptmaker.domain.enums.LeadStatus;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LeadRepository extends JpaRepository<Lead, UUID> {
    List<Lead> findByFranchiseId(UUID franchiseId);

    long countByStatus(LeadStatus status);

    long countByFranchiseIdAndStatus(UUID franchiseId, LeadStatus status);
}
