package br.com.vavive.gptmaker.repository;

import br.com.vavive.gptmaker.domain.entity.AssistantStandardBlockHistory;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssistantStandardBlockHistoryRepository extends JpaRepository<AssistantStandardBlockHistory, UUID> {
    List<AssistantStandardBlockHistory> findByBlockIdOrderByVersionDesc(UUID blockId);
}
