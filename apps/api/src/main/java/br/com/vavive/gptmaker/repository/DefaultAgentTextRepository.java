package br.com.vavive.gptmaker.repository;

import br.com.vavive.gptmaker.domain.entity.DefaultAgentText;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DefaultAgentTextRepository extends JpaRepository<DefaultAgentText, UUID> {
    List<DefaultAgentText> findByActiveTrueOrderByCategoryAscTitleAsc();

    List<DefaultAgentText> findAllByOrderByCategoryAscTitleAsc();
}
