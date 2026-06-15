package br.com.vavive.gptmaker.service;

import br.com.vavive.gptmaker.domain.entity.Franchise;
import br.com.vavive.gptmaker.domain.entity.User;
import br.com.vavive.gptmaker.domain.enums.UserRole;
import br.com.vavive.gptmaker.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
public class CurrentUserService {
    private final UserRepository userRepository;

    public CurrentUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User requireCurrentUser() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario nao autenticado");
        }
        return userRepository.findByEmailIgnoreCaseWithFranchise(authentication.getName())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario nao encontrado"));
    }

    public Franchise requireFranchise(User user) {
        if (user.getRole() == UserRole.ADMIN_FRANQUIA && user.getFranchise() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Usuario ADMIN_FRANQUIA nao possui franquia associada.");
        }
        return user.getFranchise();
    }

    public Franchise requireCurrentFranchise() {
        return requireFranchise(requireCurrentUser());
    }

    public void requireSuperAdmin(String message) {
        if (requireCurrentUser().getRole() != UserRole.SUPER_ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, message);
        }
    }
}
