package br.com.vavive.gptmaker.repository;

import br.com.vavive.gptmaker.domain.entity.WhatsAppNotificationContact;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WhatsAppNotificationContactRepository extends JpaRepository<WhatsAppNotificationContact, UUID> {
    List<WhatsAppNotificationContact> findByFranchiseIdOrderByNameAsc(UUID franchiseId);

    List<WhatsAppNotificationContact> findByFranchiseIdAndActiveTrueOrderByNameAsc(UUID franchiseId);

    Optional<WhatsAppNotificationContact> findByIdAndFranchiseId(UUID id, UUID franchiseId);
}
