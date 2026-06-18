package br.com.vavive.gptmaker.service;

import br.com.vavive.gptmaker.domain.entity.Franchise;
import br.com.vavive.gptmaker.domain.entity.User;
import br.com.vavive.gptmaker.dto.FranchiseResponse;
import br.com.vavive.gptmaker.dto.LoginRequest;
import br.com.vavive.gptmaker.dto.LoginResponse;
import br.com.vavive.gptmaker.dto.UserResponse;
import br.com.vavive.gptmaker.repository.UserRepository;
import br.com.vavive.gptmaker.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final CurrentUserService currentUserService;

    public AuthService(
        UserRepository userRepository,
        PasswordEncoder passwordEncoder,
        JwtService jwtService,
        CurrentUserService currentUserService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.currentUserService = currentUserService;
    }

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCaseWithFranchise(request.email())
            .filter(User::isActive)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciais invalidas"));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciais invalidas");
        }
        currentUserService.requireFranchise(user);
        return new LoginResponse(jwtService.generateToken(user), toResponse(user));
    }

    public UserResponse me() {
        return toResponse(currentUserService.requireCurrentUser());
    }

    public static UserResponse toResponse(User user) {
        return new UserResponse(
            user.getId(),
            user.getName(),
            user.getEmail(),
            user.getRole(),
            toFranchiseResponse(user.getFranchise())
        );
    }

    public static FranchiseResponse toFranchiseResponse(Franchise franchise) {
        return toFranchiseResponse(franchise, null);
    }

    public static FranchiseResponse toFranchiseResponse(Franchise franchise, br.com.vavive.gptmaker.dto.WorkspaceCreditsResponse workspaceCredits) {
        if (franchise == null) {
            return null;
        }
        return new FranchiseResponse(
            franchise.getId(),
            franchise.getName(),
            franchise.getDocument(),
            franchise.getCity(),
            franchise.getState(),
            franchise.resolvedStatus(),
            franchise.getWorkspaceId(),
            franchise.getWorkspaceName(),
            franchise.getAgentId(),
            franchise.getAgentName(),
            workspaceCredits,
            franchise.getGptMakerLastSyncAt(),
            franchise.getCreatedAt()
        );
    }
}
