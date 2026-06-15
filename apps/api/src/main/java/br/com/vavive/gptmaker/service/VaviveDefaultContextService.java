package br.com.vavive.gptmaker.service;

import br.com.vavive.gptmaker.domain.entity.Franchise;
import br.com.vavive.gptmaker.repository.DefaultAgentTextRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class VaviveDefaultContextService {
    private final DefaultAgentTextRepository defaultAgentTextRepository;

    public VaviveDefaultContextService(DefaultAgentTextRepository defaultAgentTextRepository) {
        this.defaultAgentTextRepository = defaultAgentTextRepository;
    }

    public String buildForFranchise(Franchise franchise) {
        String franchiseLine = franchise == null
            ? "Franquia: Vavive."
            : "Franquia: " + franchise.getName() + " - " + franchise.getCity() + "/" + franchise.getState() + ".";

        List<String> activeTexts = defaultAgentTextRepository.findByActiveTrueOrderByCategoryAscTitleAsc().stream()
            .map(text -> "[" + text.getCategory().name() + "] " + text.getTitle() + "\n" + text.getContent())
            .toList();

        if (!activeTexts.isEmpty()) {
            return String.join("\n\n", List.of(franchiseLine, String.join("\n\n", activeTexts)));
        }

        return String.join("\n",
            "A Vavive e uma empresa de servicos de limpeza e cuidados.",
            franchiseLine,
            "O agente deve atender clientes de forma educada, clara e objetiva.",
            "O agente deve coletar informacoes antes de orientar:",
            "- servico desejado",
            "- bairro/cidade/CEP",
            "- quantidade de horas, quando aplicavel",
            "- melhor data/horario",
            "- nome e telefone",
            "O agente nao deve inventar preco.",
            "O agente nao deve inventar disponibilidade.",
            "O agente nao deve inventar regiao atendida.",
            "O agente deve usar apenas informacoes configuradas para a franquia.",
            "Se houver reclamacao, urgencia ou pedido humano, direcionar para atendimento humano.",
            "Servicos comuns:",
            "- Limpeza Residencial",
            "- Limpeza Empresarial",
            "- Limpeza Pos-Obra",
            "- Passar Roupas",
            "- Cozinha",
            "- Baba",
            "- Limpeza Pesada",
            "- Eventos",
            "- Vidros",
            "- Cuidador de Idosos",
            "- Recrutamento e Selecao",
            "- Garcom/Copeiro"
        );
    }
}
