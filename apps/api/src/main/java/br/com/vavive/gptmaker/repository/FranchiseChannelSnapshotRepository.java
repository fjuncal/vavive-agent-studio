package br.com.vavive.gptmaker.repository;

import br.com.vavive.gptmaker.domain.entity.FranchiseChannelSnapshot;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FranchiseChannelSnapshotRepository extends JpaRepository<FranchiseChannelSnapshot, UUID> {
    List<FranchiseChannelSnapshot> findByFranchiseIdOrderByNameAsc(UUID franchiseId);

    Optional<FranchiseChannelSnapshot> findFirstByFranchiseIdAndExternalChannelId(UUID franchiseId, String externalChannelId);
}
