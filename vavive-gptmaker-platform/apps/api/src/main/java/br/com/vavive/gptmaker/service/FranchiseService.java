package br.com.vavive.gptmaker.service;

import br.com.vavive.gptmaker.domain.entity.Franchise;
import br.com.vavive.gptmaker.domain.entity.User;
import br.com.vavive.gptmaker.domain.enums.UserRole;
import br.com.vavive.gptmaker.dto.CreateFranchiseRequest;
import br.com.vavive.gptmaker.dto.FranchiseResponse;
import br.com.vavive.gptmaker.repository.FranchiseRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class FranchiseService {
    private final FranchiseRepository franchiseRepository;
    private final CurrentUserService currentUserService;

    public FranchiseService(FranchiseRepository franchiseRepository, CurrentUserService currentUserService) {
        this.franchiseRepository = franchiseRepository;
        this.currentUserService = currentUserService;
    }

    @Transactional(readOnly = true)
    public List<FranchiseResponse> list() {
        User user = currentUserService.requireCurrentUser();
        if (user.getRole() == UserRole.SUPER_ADMIN) {
            return franchiseRepository.findAll().stream().map(AuthService::toFranchiseResponse).toList();
        }
        return List.of(AuthService.toFranchiseResponse(user.getFranchise()));
    }

    @Transactional
    public FranchiseResponse create(CreateFranchiseRequest request) {
        User user = currentUserService.requireCurrentUser();
        if (user.getRole() != UserRole.SUPER_ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Apenas SUPER_ADMIN pode criar franquias");
        }
        Franchise franchise = new Franchise(request.name(), request.document(), request.city(), request.state(), "ATIVA");
        return AuthService.toFranchiseResponse(franchiseRepository.save(franchise));
    }

    @Transactional(readOnly = true)
    public FranchiseResponse get(UUID id) {
        User user = currentUserService.requireCurrentUser();
        Franchise franchise = franchiseRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Franquia nao encontrada"));
        if (user.getRole() != UserRole.SUPER_ADMIN && !franchise.getId().equals(user.getFranchise().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sem acesso a esta franquia");
        }
        return AuthService.toFranchiseResponse(franchise);
    }
}
