package br.com.vavive.gptmaker.service;

import br.com.vavive.gptmaker.domain.entity.Lead;
import br.com.vavive.gptmaker.domain.entity.User;
import br.com.vavive.gptmaker.domain.entity.Franchise;
import br.com.vavive.gptmaker.domain.enums.UserRole;
import br.com.vavive.gptmaker.dto.LeadResponse;
import br.com.vavive.gptmaker.repository.LeadRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LeadService {
    private final LeadRepository leadRepository;
    private final CurrentUserService currentUserService;

    public LeadService(LeadRepository leadRepository, CurrentUserService currentUserService) {
        this.leadRepository = leadRepository;
        this.currentUserService = currentUserService;
    }

    @Transactional(readOnly = true)
    public List<LeadResponse> list() {
        User user = currentUserService.requireCurrentUser();
        Franchise franchise = user.getRole() == UserRole.SUPER_ADMIN
            ? null
            : currentUserService.requireFranchise(user);
        List<Lead> leads = user.getRole() == UserRole.SUPER_ADMIN
            ? leadRepository.findAll()
            : leadRepository.findByFranchiseId(franchise.getId());
        return leads.stream().map(this::toResponse).toList();
    }

    private LeadResponse toResponse(Lead lead) {
        return new LeadResponse(
            lead.getId(),
            lead.getName(),
            lead.getPhone(),
            lead.getService(),
            lead.getSource(),
            lead.getStatus(),
            lead.getFranchise().getName(),
            lead.getAgent() == null ? null : lead.getAgent().getName(),
            lead.getCreatedAt()
        );
    }
}
