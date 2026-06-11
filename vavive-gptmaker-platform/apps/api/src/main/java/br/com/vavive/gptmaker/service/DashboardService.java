package br.com.vavive.gptmaker.service;

import br.com.vavive.gptmaker.domain.entity.User;
import br.com.vavive.gptmaker.domain.enums.LeadStatus;
import br.com.vavive.gptmaker.domain.enums.UserRole;
import br.com.vavive.gptmaker.dto.DashboardSummaryResponse;
import br.com.vavive.gptmaker.repository.LeadRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DashboardService {
    private final LeadRepository leadRepository;
    private final CurrentUserService currentUserService;

    public DashboardService(LeadRepository leadRepository, CurrentUserService currentUserService) {
        this.leadRepository = leadRepository;
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

        return new DashboardSummaryResponse(total, newLeads, active, finished, conversionRate);
    }

    private long count(User user, LeadStatus status) {
        if (user.getRole() == UserRole.SUPER_ADMIN) {
            return leadRepository.countByStatus(status);
        }
        return leadRepository.countByFranchiseIdAndStatus(user.getFranchise().getId(), status);
    }
}
