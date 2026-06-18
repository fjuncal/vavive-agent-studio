package br.com.vavive.gptmaker.repository;

import br.com.vavive.gptmaker.domain.entity.AssistantStandardProfile;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssistantStandardProfileRepository extends JpaRepository<AssistantStandardProfile, UUID> {
    Optional<AssistantStandardProfile> findFirstByActiveTrueOrderByUpdatedAtDesc();
}
