package br.com.vavive.gptmaker.repository;

import br.com.vavive.gptmaker.domain.entity.AgentTraining;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AgentTrainingRepository extends JpaRepository<AgentTraining, UUID> {
}
