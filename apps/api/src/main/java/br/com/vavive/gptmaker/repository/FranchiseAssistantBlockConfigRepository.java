package br.com.vavive.gptmaker.repository;

import br.com.vavive.gptmaker.domain.entity.Franchise;
import br.com.vavive.gptmaker.domain.entity.FranchiseAssistantBlockConfig;
import br.com.vavive.gptmaker.domain.enums.AssistantBlockType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FranchiseAssistantBlockConfigRepository extends JpaRepository<FranchiseAssistantBlockConfig, UUID> {
    List<FranchiseAssistantBlockConfig> findByFranchiseOrderByBlockTypeAsc(Franchise franchise);

    Optional<FranchiseAssistantBlockConfig> findByFranchiseAndBlockType(Franchise franchise, AssistantBlockType blockType);
}
