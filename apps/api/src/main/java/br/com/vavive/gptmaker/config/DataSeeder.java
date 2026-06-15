package br.com.vavive.gptmaker.config;

import br.com.vavive.gptmaker.domain.entity.Franchise;
import br.com.vavive.gptmaker.domain.entity.User;
import br.com.vavive.gptmaker.domain.enums.UserRole;
import br.com.vavive.gptmaker.repository.FranchiseRepository;
import br.com.vavive.gptmaker.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {
    private final UserRepository userRepository;
    private final FranchiseRepository franchiseRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(
        UserRepository userRepository,
        FranchiseRepository franchiseRepository,
        PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.franchiseRepository = franchiseRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (userRepository.findByEmailIgnoreCase("admin@vavive.com").isEmpty()) {
            userRepository.save(new User(
                "Admin Vavive",
                "admin@vavive.com",
                passwordEncoder.encode("admin123"),
                UserRole.SUPER_ADMIN,
                null
            ));
        }

        if (userRepository.findByEmailIgnoreCase("franquia@vavive.com").isPresent()) {
            return;
        }

        franchiseRepository.findAll().stream()
            .filter(franchise -> franchise.getWorkspaceId() != null && !franchise.getWorkspaceId().isBlank())
            .findFirst()
            .ifPresent(franchise -> userRepository.save(new User(
                "Gestora da Franquia",
                "franquia@vavive.com",
                passwordEncoder.encode("admin123"),
                UserRole.ADMIN_FRANQUIA,
                franchise
            )));
    }
}
