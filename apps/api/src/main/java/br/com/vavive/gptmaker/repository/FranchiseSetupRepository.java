package br.com.vavive.gptmaker.repository;

import br.com.vavive.gptmaker.domain.entity.FranchiseSetup;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FranchiseSetupRepository extends JpaRepository<FranchiseSetup, UUID> {
    Optional<FranchiseSetup> findByFranchiseId(UUID franchiseId);
    Optional<FranchiseSetup> findFirstBy();
}
