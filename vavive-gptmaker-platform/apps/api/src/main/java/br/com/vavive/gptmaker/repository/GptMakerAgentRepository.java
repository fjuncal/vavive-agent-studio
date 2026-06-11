package br.com.vavive.gptmaker.repository;

import br.com.vavive.gptmaker.domain.entity.GptMakerAgent;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GptMakerAgentRepository extends JpaRepository<GptMakerAgent, UUID> {
    List<GptMakerAgent> findByFranchiseId(UUID franchiseId);
}
