package br.com.vavive.gptmaker.repository;

import br.com.vavive.gptmaker.domain.entity.Franchise;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FranchiseRepository extends JpaRepository<Franchise, UUID> {
    Optional<Franchise> findFirstByWorkspaceId(String workspaceId);

    Optional<Franchise> findFirstByAgentId(String agentId);

    boolean existsByWorkspaceId(String workspaceId);

    List<Franchise> findByWorkspaceIdIsNull();
}
