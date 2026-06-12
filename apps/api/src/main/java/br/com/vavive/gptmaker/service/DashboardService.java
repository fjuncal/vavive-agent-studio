package br.com.vavive.gptmaker.service;

import br.com.vavive.gptmaker.domain.entity.User;
import br.com.vavive.gptmaker.dto.DashboardSummaryResponse;
import br.com.vavive.gptmaker.domain.enums.LeadStatus;
import br.com.vavive.gptmaker.domain.enums.UserRole;
import br.com.vavive.gptmaker.repository.AgentTrainingRepository;
import br.com.vavive.gptmaker.repository.FranchiseRepository;
import br.com.vavive.gptmaker.repository.FranchiseSetupRepository;
import br.com.vavive.gptmaker.repository.LeadRepository;
import java.time.LocalDateTime;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DashboardService {
    private final LeadRepository leadRepository;
    private final FranchiseRepository franchiseRepository;
    private final FranchiseSetupRepository franchiseSetupRepository;
    private final AgentTrainingRepository trainingRepository;
    private final SetupProgressService setupProgressService;
    private final CurrentUserService currentUserService;

    public DashboardService(
        LeadRepository leadRepository,
        FranchiseRepository franchiseRepository,
        FranchiseSetupRepository franchiseSetupRepository,
        AgentTrainingRepository trainingRepository,
        SetupProgressService setupProgressService,
        CurrentUserService currentUserService
    ) {
        this.leadRepository = leadRepository;
        this.franchiseRepository = franchiseRepository;
        this.franchiseSetupRepository = franchiseSetupRepository;
        this.trainingRepository = trainingRepository;
        this.setupProgressService = setupProgressService;
        this.currentUserService = currentUserService;
    }

    @Transactional(readOnly = true)
    public DashboardSummaryResponse summary() {
        User user = currentUserService.requireCurrentUser();
        long total = user.getRole() == UserRole.SUPER_ADMIN
            ? leadRepository.count()
            : leadRepository.findByFranchiseId(user.getFranchise().getId()).size();
        long newLeads = count(user, LeadStatus.NOVO);
        long active = count(user, LeadStatus.EM_ATENDIMENTO);
        long finished = count(user, LeadStatus.FINALIZADO);
        long converted = count(user, LeadStatus.CONVERTIDO);
        double conversionRate = total == 0 ? 0 : Math.round(((double) converted / total) * 1000.0) / 10.0;
        String setupStatus = "NAO_INICIADO";
        int completionPercentage = 0;
        LocalDateTime lastPublicationAt = null;
        String lastTrainingTitle = null;

        var franchise = user.getRole() == UserRole.SUPER_ADMIN
            ? franchiseRepository.findAll().stream().findFirst().orElse(null)
            : user.getFranchise();
        if (franchise != null) {
            var setup = franchiseSetupRepository.findByFranchiseId(franchise.getId()).orElse(null);
            if (setup != null) {
                setupStatus = setupProgressService.setupStatus(franchise, setup);
                completionPercentage = setupProgressService.completionPercentage(franchise, setup);
                lastPublicationAt = setup.getLastPublishedAt();
            }
            lastTrainingTitle = trainingRepository.findTopByAgentFranchiseIdOrderByCreatedAtDesc(franchise.getId())
                .map(training -> training.getTitle())
                .orElse(null);
        }

        return new DashboardSummaryResponse(total, newLeads, active, finished, conversionRate, setupStatus, completionPercentage, lastPublicationAt, lastTrainingTitle);
    }

    private long count(User user, LeadStatus status) {
        if (user.getRole() == UserRole.SUPER_ADMIN) {
            return leadRepository.countByStatus(status);
        }
        return leadRepository.countByFranchiseIdAndStatus(user.getFranchise().getId(), status);
    }
}
