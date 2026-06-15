package br.com.vavive.gptmaker.service;

import br.com.vavive.gptmaker.domain.entity.AgentIntent;
import br.com.vavive.gptmaker.domain.entity.AgentRule;
import br.com.vavive.gptmaker.domain.entity.AgentTraining;
import br.com.vavive.gptmaker.domain.entity.Franchise;
import br.com.vavive.gptmaker.domain.entity.GptMakerAgent;
import br.com.vavive.gptmaker.domain.entity.User;
import br.com.vavive.gptmaker.domain.enums.UserRole;
import br.com.vavive.gptmaker.dto.AgentResponse;
import br.com.vavive.gptmaker.dto.CreateIntentRequest;
import br.com.vavive.gptmaker.dto.CreateRuleRequest;
import br.com.vavive.gptmaker.dto.CreateTrainingRequest;
import br.com.vavive.gptmaker.dto.IntentResponse;
import br.com.vavive.gptmaker.dto.RuleResponse;
import br.com.vavive.gptmaker.dto.TrainingResponse;
import br.com.vavive.gptmaker.integration.gptmaker.GptMakerClient;
import br.com.vavive.gptmaker.repository.AgentIntentRepository;
import br.com.vavive.gptmaker.repository.AgentRuleRepository;
import br.com.vavive.gptmaker.repository.AgentTrainingRepository;
import br.com.vavive.gptmaker.repository.GptMakerAgentRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AgentService {
    private final GptMakerAgentRepository agentRepository;
    private final AgentTrainingRepository trainingRepository;
    private final AgentIntentRepository intentRepository;
    private final AgentRuleRepository ruleRepository;
    private final GptMakerClient gptMakerClient;
    private final CurrentUserService currentUserService;

    public AgentService(
        GptMakerAgentRepository agentRepository,
        AgentTrainingRepository trainingRepository,
        AgentIntentRepository intentRepository,
        AgentRuleRepository ruleRepository,
        GptMakerClient gptMakerClient,
        CurrentUserService currentUserService
    ) {
        this.agentRepository = agentRepository;
        this.trainingRepository = trainingRepository;
        this.intentRepository = intentRepository;
        this.ruleRepository = ruleRepository;
        this.gptMakerClient = gptMakerClient;
        this.currentUserService = currentUserService;
    }

    @Transactional(readOnly = true)
    public List<AgentResponse> list() {
        User user = currentUserService.requireCurrentUser();
        Franchise franchise = user.getRole() == UserRole.SUPER_ADMIN
            ? null
            : currentUserService.requireFranchise(user);
        List<GptMakerAgent> agents = user.getRole() == UserRole.SUPER_ADMIN
            ? agentRepository.findAll()
            : agentRepository.findByFranchiseId(franchise.getId());
        return agents.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<TrainingResponse> listTrainings(UUID agentId) {
        GptMakerAgent agent = requireAccessibleAgent(agentId);
        return trainingRepository.findByAgentIdOrderByCreatedAtDesc(agent.getId()).stream()
            .map(this::toTrainingResponse)
            .toList();
    }

    @Transactional
    public TrainingResponse addTraining(UUID agentId, CreateTrainingRequest request) {
        GptMakerAgent agent = requireAccessibleAgent(agentId);
        if (!gptMakerClient.isRealExternalId(agent.getExternalId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Para publicar no GPTMaker, este agente precisa estar vinculado a um agente real na tela da franquia.");
        }
        var result = gptMakerClient.sendTraining(agent.getExternalId(), request.title(), request.content());
        AgentTraining training = trainingRepository.save(new AgentTraining(
            request.title(),
            request.content(),
            result.status(),
            result.externalReference(),
            result.success() ? result.message() : result.message() + " O treinamento foi salvo localmente para nova tentativa.",
            agent
        ));
        return new TrainingResponse(
            training.getId(),
            training.getTitle(),
            training.getContent(),
            training.getStatus(),
            training.getExternalReference(),
            training.getResultMessage(),
            result.mockEnabled(),
            training.getCreatedAt()
        );
    }

    @Transactional
    public IntentResponse addIntent(UUID agentId, CreateIntentRequest request) {
        GptMakerAgent agent = requireAccessibleAgent(agentId);
        var result = gptMakerClient.sendIntent(agent.getExternalId(), request.name(), request.description(), request.examplePhrase());
        AgentIntent intent = intentRepository.save(new AgentIntent(
            request.name(),
            request.description(),
            request.examplePhrase(),
            result.status(),
            result.externalReference(),
            result.message(),
            agent
        ));
        return new IntentResponse(
            intent.getId(),
            intent.getName(),
            intent.getDescription(),
            intent.getExamplePhrase(),
            intent.isActive(),
            intent.getStatus(),
            intent.getExternalReference(),
            intent.getResultMessage(),
            result.mockEnabled(),
            intent.getCreatedAt()
        );
    }

    @Transactional
    public RuleResponse addRule(UUID agentId, CreateRuleRequest request) {
        GptMakerAgent agent = requireAccessibleAgent(agentId);
        gptMakerClient.sendRule(agent.getExternalId(), request.title(), request.description());
        AgentRule rule = ruleRepository.save(new AgentRule(request.title(), request.description(), request.category(), request.enabled(), agent));
        return new RuleResponse(rule.getId(), rule.getTitle(), rule.getDescription(), rule.getCategory(), rule.isEnabled(), rule.getCreatedAt());
    }

    private GptMakerAgent requireAccessibleAgent(UUID agentId) {
        User user = currentUserService.requireCurrentUser();
        GptMakerAgent agent = agentRepository.findById(agentId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Agente nao encontrado"));
        if (user.getRole() != UserRole.SUPER_ADMIN
            && !agent.getFranchise().getId().equals(currentUserService.requireFranchise(user).getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "ADMIN_FRANQUIA so pode acessar dados da propria franquia.");
        }
        return agent;
    }

    private AgentResponse toResponse(GptMakerAgent agent) {
        boolean connectedToRealGptMaker = gptMakerClient.isRealExternalId(agent.getExternalId());
        return new AgentResponse(
            agent.getId(),
            agent.getFranchise().getId(),
            agent.getExternalId(),
            agent.getName(),
            agent.getStatus(),
            agent.getToneOfVoice(),
            agent.getFranchise().getName(),
            connectedToRealGptMaker,
            connectedToRealGptMaker ? "Conectado ao GPTMaker" : "Nao conectado ao GPTMaker real",
            agent.getCreatedAt()
        );
    }

    private TrainingResponse toTrainingResponse(AgentTraining training) {
        return new TrainingResponse(
            training.getId(),
            training.getTitle(),
            training.getContent(),
            training.getStatus(),
            training.getExternalReference(),
            training.getResultMessage(),
            "PUBLICADO_GPTMAKER_MOCK".equals(training.getStatus()),
            training.getCreatedAt()
        );
    }
}
