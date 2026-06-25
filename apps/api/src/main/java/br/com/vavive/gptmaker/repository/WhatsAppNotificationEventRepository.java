package br.com.vavive.gptmaker.repository;

import br.com.vavive.gptmaker.domain.entity.WhatsAppNotificationEvent;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WhatsAppNotificationEventRepository extends JpaRepository<WhatsAppNotificationEvent, UUID> {
}
