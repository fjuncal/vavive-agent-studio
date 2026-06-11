package br.com.vavive.gptmaker.config;

import br.com.vavive.gptmaker.domain.entity.Franchise;
import br.com.vavive.gptmaker.domain.entity.GptMakerAgent;
import br.com.vavive.gptmaker.domain.entity.Lead;
import br.com.vavive.gptmaker.domain.entity.User;
import br.com.vavive.gptmaker.domain.enums.LeadStatus;
import br.com.vavive.gptmaker.domain.enums.UserRole;
import br.com.vavive.gptmaker.repository.FranchiseRepository;
import br.com.vavive.gptmaker.repository.GptMakerAgentRepository;
import br.com.vavive.gptmaker.repository.LeadRepository;
import br.com.vavive.gptmaker.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {
    private final UserRepository userRepository;
    private final FranchiseRepository franchiseRepository;
    private final GptMakerAgentRepository agentRepository;
    private final LeadRepository leadRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(
        UserRepository userRepository,
        FranchiseRepository franchiseRepository,
        GptMakerAgentRepository agentRepository,
        LeadRepository leadRepository,
        PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.franchiseRepository = franchiseRepository;
        this.agentRepository = agentRepository;
        this.leadRepository = leadRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            return;
        }

        Franchise franchise = franchiseRepository.save(
            new Franchise("Vavive Vila Mariana", "12.345.678/0001-90", "Sao Paulo", "SP", "ATIVA")
        );

        userRepository.save(new User(
            "Admin Vavive",
            "admin@vavive.com",
            passwordEncoder.encode("admin123"),
            UserRole.SUPER_ADMIN,
            null
        ));

        userRepository.save(new User(
            "Gestora Vila Mariana",
            "franquia@vavive.com",
            passwordEncoder.encode("admin123"),
            UserRole.ADMIN_FRANQUIA,
            franchise
        ));

        GptMakerAgent agent = agentRepository.save(new GptMakerAgent(
            "gptmaker-agent-mock-vila-mariana",
            "Assistente Vavive Vila Mariana",
            "ATIVO",
            "Acolhedor, objetivo e consultivo",
            franchise
        ));

        leadRepository.save(new Lead("Mariana Alves", "+55 11 90000-1001", "Acompanhante hospitalar", "WhatsApp", LeadStatus.NOVO, franchise, agent));
        leadRepository.save(new Lead("Ricardo Lima", "+55 11 90000-1002", "Cuidador por hora", "Instagram", LeadStatus.EM_ATENDIMENTO, franchise, agent));
        leadRepository.save(new Lead("Beatriz Souza", "+55 11 90000-1003", "Cuidador noturno", "WhatsApp", LeadStatus.CONVERTIDO, franchise, agent));
        leadRepository.save(new Lead("Carlos Mendes", "+55 11 90000-1004", "Pos-cirurgico", "Site", LeadStatus.FINALIZADO, franchise, agent));
    }
}
