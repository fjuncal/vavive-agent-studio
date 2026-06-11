package br.com.vavive.gptmaker.repository;

import br.com.vavive.gptmaker.domain.entity.AgentRule;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AgentRuleRepository extends JpaRepository<AgentRule, UUID> {
}
