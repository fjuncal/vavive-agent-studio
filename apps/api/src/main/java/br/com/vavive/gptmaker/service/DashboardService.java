package br.com.vavive.gptmaker.service;

import br.com.vavive.gptmaker.domain.entity.User;
import br.com.vavive.gptmaker.domain.entity.Franchise;
import br.com.vavive.gptmaker.domain.entity.FranchiseSetup;
import br.com.vavive.gptmaker.dto.DashboardSummaryResponse;
import br.com.vavive.gptmaker.domain.enums.LeadStatus;
import br.com.vavive.gptmaker.domain.enums.UserRole;
import br.com.vavive.gptmaker.repository.AgentTrainingRepository;
import br.com.vavive.gptmaker.repository.FranchiseRepository;
import br.com.vavive.gptmaker.repository.FranchiseSetupRepository;
import br.com.vavive.gptmaker.repository.LeadRepository;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
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
        Franchise franchise = user.getRole() == UserRole.SUPER_ADMIN
            ? null
            : currentUserService.requireFranchise(user);

        long total = user.getRole() == UserRole.SUPER_ADMIN
            ? leadRepository.count()
            : leadRepository.findByFranchiseId(franchise.getId()).size();
        long newLeads = count(user, LeadStatus.NOVO);
        long active = count(user, LeadStatus.EM_ATENDIMENTO);
        long finished = count(user, LeadStatus.FINALIZADO);
        long converted = count(user, LeadStatus.CONVERTIDO);
        double conversionRate = total == 0 ? 0 : Math.round(((double) converted / total) * 1000.0) / 10.0;
        DashboardSetupSnapshot setupSnapshot = user.getRole() == UserRole.SUPER_ADMIN
            ? buildSuperAdminSetupSnapshot()
            : buildFranchiseSetupSnapshot(franchise);

        return new DashboardSummaryResponse(
            total,
            newLeads,
            active,
            finished,
            conversionRate,
            setupSnapshot.setupStatus(),
            setupSnapshot.completionPercentage(),
            setupSnapshot.lastPublicationAt(),
            setupSnapshot.lastTrainingTitle()
        );
    }

    private long count(User user, LeadStatus status) {
        if (user.getRole() == UserRole.SUPER_ADMIN) {
            return leadRepository.countByStatus(status);
        }
        return leadRepository.countByFranchiseIdAndStatus(currentUserService.requireFranchise(user).getId(), status);
    }

    private DashboardSetupSnapshot buildSuperAdminSetupSnapshot() {
        List<Franchise> franchises = franchiseRepository.findAll();
        if (franchises.isEmpty()) {
            return new DashboardSetupSnapshot("VISAO_GERAL", 0, null, null);
        }

        int completionPercentage = (int) Math.round(
            franchises.stream()
                .mapToInt(this::completionPercentage)
                .average()
                .orElse(0)
        );
        LocalDateTime lastPublicationAt = franchises.stream()
            .map(franchise -> franchiseSetupRepository.findByFranchiseId(franchise.getId()).orElse(null))
            .filter(setup -> setup != null && setup.getLastPublishedAt() != null)
            .map(FranchiseSetup::getLastPublishedAt)
            .max(Comparator.naturalOrder())
            .orElse(null);
        String lastTrainingTitle = franchises.stream()
            .map(franchise -> trainingRepository.findTopByAgentFranchiseIdOrderByCreatedAtDesc(franchise.getId()).orElse(null))
            .filter(training -> training != null)
            .max(Comparator.comparing(training -> training.getCreatedAt()))
            .map(training -> training.getTitle())
            .orElse(null);

        return new DashboardSetupSnapshot("VISAO_GERAL", completionPercentage, lastPublicationAt, lastTrainingTitle);
    }

    private DashboardSetupSnapshot buildFranchiseSetupSnapshot(Franchise franchise) {
        String setupStatus = "NAO_INICIADO";
        int completionPercentage = 0;
        LocalDateTime lastPublicationAt = null;
        String lastTrainingTitle = trainingRepository.findTopByAgentFranchiseIdOrderByCreatedAtDesc(franchise.getId())
            .map(training -> training.getTitle())
            .orElse(null);

        var setup = franchiseSetupRepository.findByFranchiseId(franchise.getId()).orElse(null);
        if (setup != null) {
            setupStatus = setupProgressService.setupStatus(franchise, setup);
            completionPercentage = setupProgressService.completionPercentage(franchise, setup);
            lastPublicationAt = setup.getLastPublishedAt();
        }

        return new DashboardSetupSnapshot(setupStatus, completionPercentage, lastPublicationAt, lastTrainingTitle);
    }

    private int completionPercentage(Franchise franchise) {
        return franchiseSetupRepository.findByFranchiseId(franchise.getId())
            .map(setup -> setupProgressService.completionPercentage(franchise, setup))
            .orElse(0);
    }

    private record DashboardSetupSnapshot(
        String setupStatus,
        int completionPercentage,
        LocalDateTime lastPublicationAt,
        String lastTrainingTitle
    ) {
    }
}
