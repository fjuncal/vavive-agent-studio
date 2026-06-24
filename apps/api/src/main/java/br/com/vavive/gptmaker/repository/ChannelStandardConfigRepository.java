package br.com.vavive.gptmaker.repository;

import br.com.vavive.gptmaker.domain.entity.ChannelStandardConfig;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChannelStandardConfigRepository extends JpaRepository<ChannelStandardConfig, UUID> {
    Optional<ChannelStandardConfig> findFirstByChannelTypeIgnoreCase(String channelType);
}
