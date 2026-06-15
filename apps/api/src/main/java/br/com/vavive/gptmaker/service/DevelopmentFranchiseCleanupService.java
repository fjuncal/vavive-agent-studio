package br.com.vavive.gptmaker.service;

import br.com.vavive.gptmaker.repository.FranchiseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DevelopmentFranchiseCleanupService {
    private final FranchiseRepository franchiseRepository;

    public DevelopmentFranchiseCleanupService(FranchiseRepository franchiseRepository) {
        this.franchiseRepository = franchiseRepository;
    }

    @Transactional
    public int inactivateFranchisesWithoutWorkspace() {
        var franchises = franchiseRepository.findByWorkspaceIdIsNull();
        franchises.forEach(franchise -> franchise.setStatus("INATIVA"));
        franchiseRepository.saveAll(franchises);
        return franchises.size();
    }
}
