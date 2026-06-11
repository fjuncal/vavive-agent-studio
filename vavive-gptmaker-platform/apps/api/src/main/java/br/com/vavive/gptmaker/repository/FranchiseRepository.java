package br.com.vavive.gptmaker.repository;

import br.com.vavive.gptmaker.domain.entity.Franchise;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FranchiseRepository extends JpaRepository<Franchise, UUID> {
}
