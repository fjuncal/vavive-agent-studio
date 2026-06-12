package br.com.vavive.gptmaker.service;

import br.com.vavive.gptmaker.domain.entity.Franchise;
import br.com.vavive.gptmaker.domain.entity.FranchiseSetup;
import org.springframework.stereotype.Service;

@Service
public class SetupProgressService {
    public int completionPercentage(Franchise franchise, FranchiseSetup setup) {
        int completed = 0;
        if (franchise.getName() != null && !franchise.getName().isBlank()
            && franchise.getCity() != null && !franchise.getCity().isBlank()
            && franchise.getState() != null && !franchise.getState().isBlank()) {
            completed++;
        }
        if (hasValue(setup.getServices())) {
            completed++;
        }
        if (hasValue(setup.getPrices())) {
            completed++;
        }
        if (hasValue(setup.getRegions())) {
            completed++;
        }
        if (hasValue(setup.getSchedules())) {
            completed++;
        }
        if (hasValue(setup.getFaq())) {
            completed++;
        }
        if (hasValue(setup.getRules())) {
            completed++;
        }
        if (hasValue(setup.getToneOfVoice())) {
            completed++;
        }
        return Math.round((completed / 8.0f) * 100);
    }

    public String setupStatus(Franchise franchise, FranchiseSetup setup) {
        int percentage = completionPercentage(franchise, setup);
        if (percentage >= 100) {
            return "PRONTO_PARA_PUBLICAR";
        }
        if (percentage > 0) {
            return "EM_CONFIGURACAO";
        }
        return "NAO_INICIADO";
    }

    public boolean canPublish(Franchise franchise, FranchiseSetup setup) {
        return completionPercentage(franchise, setup) >= 100;
    }

    private boolean hasValue(String value) {
        return value != null && !value.isBlank();
    }
}
