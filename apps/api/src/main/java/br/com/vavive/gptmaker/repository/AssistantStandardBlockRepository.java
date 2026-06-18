package br.com.vavive.gptmaker.repository;

import br.com.vavive.gptmaker.domain.entity.AssistantStandardBlock;
import br.com.vavive.gptmaker.domain.entity.AssistantStandardProfile;
import br.com.vavive.gptmaker.domain.enums.AssistantBlockType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssistantStandardBlockRepository extends JpaRepository<AssistantStandardBlock, UUID> {
    List<AssistantStandardBlock> findByProfileOrderByBlockTypeAsc(AssistantStandardProfile profile);

    Optional<AssistantStandardBlock> findByProfileAndBlockType(AssistantStandardProfile profile, AssistantBlockType blockType);
}
