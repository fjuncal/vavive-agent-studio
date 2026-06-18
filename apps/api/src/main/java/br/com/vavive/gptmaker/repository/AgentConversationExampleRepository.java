package br.com.vavive.gptmaker.repository;

import br.com.vavive.gptmaker.domain.entity.AgentConversationExample;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AgentConversationExampleRepository extends JpaRepository<AgentConversationExample, UUID> {
    List<AgentConversationExample> findByAgentIdOrderByCreatedAtDesc(UUID agentId);

    Optional<AgentConversationExample> findByIdAndAgentId(UUID id, UUID agentId);
}
