package br.com.vavive.gptmaker.service;

import br.com.vavive.gptmaker.domain.entity.Franchise;
import br.com.vavive.gptmaker.domain.entity.FranchiseSetup;
import org.springframework.stereotype.Service;

@Service
public class TrainingGeneratorService {
    public GeneratedTraining generate(Franchise franchise, FranchiseSetup setup) {
        String title = "Treinamento Vavive - " + franchise.getName();
        String content = """
            Franquia: %s
            Documento: %s
            Cidade/Estado: %s / %s
            Responsavel: %s

            Servicos:
            %s

            Precos:
            %s

            Regioes atendidas:
            %s

            Horarios:
            %s

            FAQ:
            %s

            Regras:
            %s

            Tom de voz:
            %s
            """.formatted(
            franchise.getName(),
            safe(franchise.getDocument()),
            safe(franchise.getCity()),
            safe(franchise.getState()),
            safe(setup.getResponsibleName()),
            safe(setup.getServices()),
            safe(setup.getPrices()),
            safe(setup.getRegions()),
            safe(setup.getSchedules()),
            safe(setup.getFaq()),
            safe(setup.getRules()),
            safe(setup.getToneOfVoice())
        ).trim();

        return new GeneratedTraining(title, content);
    }

    private String safe(String value) {
        return value == null || value.isBlank() ? "-" : value.trim();
    }

    public record GeneratedTraining(String title, String content) {
    }
}
