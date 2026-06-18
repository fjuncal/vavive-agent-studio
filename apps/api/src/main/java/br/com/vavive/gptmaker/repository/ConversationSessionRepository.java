package br.com.vavive.gptmaker.repository;

import br.com.vavive.gptmaker.domain.entity.ConversationSession;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConversationSessionRepository extends JpaRepository<ConversationSession, UUID> {
    List<ConversationSession> findByFranchiseIdOrderByUpdatedAtDesc(UUID franchiseId);

    Optional<ConversationSession> findByIdAndFranchiseId(UUID id, UUID franchiseId);

    Optional<ConversationSession> findFirstByFranchiseIdAndChatId(UUID franchiseId, String chatId);
}
