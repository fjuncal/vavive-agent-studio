package br.com.vavive.gptmaker;

import br.com.vavive.gptmaker.repository.FranchiseRepository;
import br.com.vavive.gptmaker.repository.GptMakerAgentRepository;
import br.com.vavive.gptmaker.repository.LeadRepository;
import br.com.vavive.gptmaker.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class DataSeederIntegrationTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FranchiseRepository franchiseRepository;

    @Autowired
    private GptMakerAgentRepository agentRepository;

    @Autowired
    private LeadRepository leadRepository;

    @Test
    void dataSeederCreatesOnlySuperAdminWhenThereIsNoRealFranchiseWithWorkspace() {
        assertThat(userRepository.findByEmailIgnoreCase("admin@vavive.com")).isPresent();
        assertThat(userRepository.findByEmailIgnoreCase("franquia@vavive.com")).isEmpty();
        assertThat(franchiseRepository.count()).isZero();
        assertThat(agentRepository.count()).isZero();
        assertThat(leadRepository.count()).isZero();
    }
}
