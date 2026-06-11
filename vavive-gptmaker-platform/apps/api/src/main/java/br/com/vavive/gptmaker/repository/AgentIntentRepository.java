package br.com.vavive.gptmaker.repository;

import br.com.vavive.gptmaker.domain.entity.AgentIntent;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AgentIntentRepository extends JpaRepository<AgentIntent, UUID> {
}
