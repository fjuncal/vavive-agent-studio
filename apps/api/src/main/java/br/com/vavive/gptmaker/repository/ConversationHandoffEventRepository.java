package br.com.vavive.gptmaker.repository;

import br.com.vavive.gptmaker.domain.entity.ConversationHandoffEvent;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConversationHandoffEventRepository extends JpaRepository<ConversationHandoffEvent, UUID> {
    List<ConversationHandoffEvent> findByConversationIdOrderByCreatedAtDesc(UUID conversationId);
    boolean existsByConversationIdAndOutcome(UUID conversationId, String outcome);
}
