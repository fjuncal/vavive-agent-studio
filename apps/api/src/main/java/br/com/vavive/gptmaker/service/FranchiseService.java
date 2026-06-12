package br.com.vavive.gptmaker.service;

import br.com.vavive.gptmaker.domain.entity.Franchise;
import br.com.vavive.gptmaker.domain.entity.FranchiseSetup;
import br.com.vavive.gptmaker.domain.entity.GptMakerAgent;
import br.com.vavive.gptmaker.domain.entity.User;
import br.com.vavive.gptmaker.domain.enums.UserRole;
import br.com.vavive.gptmaker.dto.CreateFranchiseRequest;
import br.com.vavive.gptmaker.dto.FranchiseResponse;
import br.com.vavive.gptmaker.dto.FranchiseGptMakerConnectionResponse;
import br.com.vavive.gptmaker.dto.FranchiseSetupResponse;
import br.com.vavive.gptmaker.dto.GptMakerAgentOptionResponse;
import br.com.vavive.gptmaker.dto.GptMakerWorkspaceOptionResponse;
import br.com.vavive.gptmaker.dto.PublishAgentResponse;
import br.com.vavive.gptmaker.dto.UpdateFranchiseSetupRequest;
import br.com.vavive.gptmaker.dto.UpdateFranchiseGptMakerConnectionRequest;
import br.com.vavive.gptmaker.integration.gptmaker.GptMakerClient;
import br.com.vavive.gptmaker.integration.gptmaker.GptMakerClient.GptMakerIntegrationException;
import br.com.vavive.gptmaker.repository.AgentTrainingRepository;
import br.com.vavive.gptmaker.repository.FranchiseRepository;
import br.com.vavive.gptmaker.repository.FranchiseSetupRepository;
import br.com.vavive.gptmaker.repository.GptMakerAgentRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class FranchiseService {
    private final FranchiseRepository franchiseRepository;
    private final FranchiseSetupRepository franchiseSetupRepository;
    private final GptMakerAgentRepository agentRepository;
    private final AgentTrainingRepository trainingRepository;
    private final TrainingGeneratorService trainingGeneratorService;
    private final SetupProgressService setupProgressService;
    private final GptMakerClient gptMakerClient;
    private final CurrentUserService currentUserService;

    public FranchiseService(
        FranchiseRepository franchiseRepository,
        FranchiseSetupRepository franchiseSetupRepository,
        GptMakerAgentRepository agentRepository,
        AgentTrainingRepository trainingRepository,
        TrainingGeneratorService trainingGeneratorService,
        SetupProgressService setupProgressService,
        GptMakerClient gptMakerClient,
        CurrentUserService currentUserService
    ) {
        this.franchiseRepository = franchiseRepository;
        this.franchiseSetupRepository = franchiseSetupRepository;
        this.agentRepository = agentRepository;
        this.trainingRepository = trainingRepository;
        this.trainingGeneratorService = trainingGeneratorService;
        this.setupProgressService = setupProgressService;
        this.gptMakerClient = gptMakerClient;
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
        return AuthService.toFranchiseResponse(requireAccessibleFranchise(id));
    }

    @Transactional(readOnly = true)
    public FranchiseSetupResponse getSetup(UUID id) {
        Franchise franchise = requireAccessibleFranchise(id);
        FranchiseSetup setup = getOrCreateSetup(franchise);
        return toSetupResponse(franchise, setup);
    }

    @Transactional(readOnly = true)
    public FranchiseGptMakerConnectionResponse getGptMakerConnection(UUID id) {
        Franchise franchise = requireAccessibleFranchise(id);
        return toGptMakerConnectionResponse(franchise);
    }

    @Transactional(readOnly = true)
    public List<GptMakerWorkspaceOptionResponse> listWorkspaces() {
        requireSuperAdmin();
        try {
            return gptMakerClient.listWorkspaces().stream()
                .map(item -> new GptMakerWorkspaceOptionResponse(item.id(), item.name()))
                .toList();
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, exception.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public List<GptMakerAgentOptionResponse> listWorkspaceAgents(String workspaceId) {
        requireSuperAdmin();
        try {
            return gptMakerClient.listAgents(workspaceId).stream()
                .map(item -> new GptMakerAgentOptionResponse(
                    item.id(),
                    item.name(),
                    item.behavior(),
                    item.avatar(),
                    item.jobName(),
                    item.jobSite(),
                    item.jobDescription()
                ))
                .toList();
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, exception.getMessage());
        }
    }

    @Transactional
    public FranchiseGptMakerConnectionResponse updateGptMakerConnection(UUID id, UpdateFranchiseGptMakerConnectionRequest request) {
        requireSuperAdmin();
        Franchise franchise = requireAccessibleFranchise(id);

        GptMakerWorkspaceOptionResponse workspace;
        GptMakerAgentOptionResponse agent;
        try {
            workspace = gptMakerClient.listWorkspaces().stream()
                .filter(item -> request.workspaceId().equals(item.id()))
                .map(item -> new GptMakerWorkspaceOptionResponse(item.id(), item.name()))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Workspace GPTMaker nao encontrado"));

            agent = gptMakerClient.listAgents(request.workspaceId()).stream()
                .filter(item -> request.agentId().equals(item.id()))
                .map(item -> new GptMakerAgentOptionResponse(
                    item.id(),
                    item.name(),
                    item.behavior(),
                    item.avatar(),
                    item.jobName(),
                    item.jobSite(),
                    item.jobDescription()
                ))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Agente GPTMaker nao encontrado neste workspace"));
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, exception.getMessage());
        }

        franchise.setWorkspaceId(workspace.id());
        franchise.setWorkspaceName(workspace.name());
        franchise.setAgentId(agent.id());
        franchise.setAgentName(agent.name());
        franchise.setGptMakerLastSyncAt(LocalDateTime.now());
        franchiseRepository.save(franchise);

        syncLocalAgent(franchise, agent);
        return toGptMakerConnectionResponse(franchise);
    }

    @Transactional
    public FranchiseSetupResponse updateSetup(UUID id, UpdateFranchiseSetupRequest request) {
        Franchise franchise = requireAccessibleFranchise(id);
        FranchiseSetup setup = getOrCreateSetup(franchise);

        if (request.franchiseName() != null) {
            franchise.setName(request.franchiseName());
        }
        if (request.document() != null) {
            franchise.setDocument(request.document());
        }
        if (request.city() != null) {
            franchise.setCity(request.city());
        }
        if (request.state() != null) {
            franchise.setState(request.state());
        }

        setup.setResponsibleName(request.responsibleName());
        setup.setServices(request.services());
        setup.setPrices(request.prices());
        setup.setRegions(request.regions());
        setup.setSchedules(request.schedules());
        setup.setFaq(request.faq());
        setup.setRules(request.rules());
        setup.setToneOfVoice(request.toneOfVoice());

        franchiseRepository.save(franchise);
        franchiseSetupRepository.save(setup);
        return toSetupResponse(franchise, setup);
    }

    @Transactional
    public PublishAgentResponse publishAgent(UUID id) {
        Franchise franchise = requireAccessibleFranchise(id);
        FranchiseSetup setup = getOrCreateSetup(franchise);
        if (!setupProgressService.canPublish(franchise, setup)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Complete todas as etapas antes de publicar o agente");
        }

        TrainingGeneratorService.GeneratedTraining generatedTraining = trainingGeneratorService.generate(franchise, setup);
        setup.setLastGeneratedTraining(generatedTraining.content());

        GptMakerAgent agent = resolveAgentForPublishing(franchise, setup);

        var syncResult = gptMakerClient.sendTraining(agent.getExternalId(), generatedTraining.title(), generatedTraining.content());
        String trainingStatus = syncResult.status();
        var training = trainingRepository.save(new br.com.vavive.gptmaker.domain.entity.AgentTraining(
            generatedTraining.title(),
            generatedTraining.content(),
            trainingStatus,
            syncResult.externalReference(),
            syncResult.message(),
            agent
        ));

        if (syncResult.success()) {
            setup.setLastPublishedAt(training.getCreatedAt());
        }
        franchiseSetupRepository.save(setup);

        return new PublishAgentResponse(
            franchise.getId(),
            agent.getId(),
            training.getId(),
            syncResult.success(),
            trainingStatus,
            syncResult.externalReference(),
            syncResult.message(),
            setup.getLastPublishedAt(),
            syncResult.mockEnabled(),
            syncResult.errorCode(),
            syncResult.details()
        );
    }

    private Franchise requireAccessibleFranchise(UUID id) {
        User user = currentUserService.requireCurrentUser();
        Franchise franchise = franchiseRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Franquia nao encontrada"));
        if (user.getRole() != UserRole.SUPER_ADMIN && !franchise.getId().equals(user.getFranchise().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sem acesso a esta franquia");
        }
        return franchise;
    }

    private void requireSuperAdmin() {
        User user = currentUserService.requireCurrentUser();
        if (user.getRole() != UserRole.SUPER_ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Apenas SUPER_ADMIN pode editar a conexao GPTMaker");
        }
    }

    private GptMakerAgent resolveAgentForPublishing(Franchise franchise, FranchiseSetup setup) {
        if (franchise.getAgentId() != null && !franchise.getAgentId().isBlank()) {
            return agentRepository.findFirstByFranchiseIdAndExternalId(franchise.getId(), franchise.getAgentId())
                .map(agent -> updateLocalAgent(agent, franchise.getAgentName(), setup.getToneOfVoice()))
                .orElseGet(() -> agentRepository.save(new GptMakerAgent(
                    franchise.getAgentId(),
                    franchise.getAgentName() != null ? franchise.getAgentName() : "Assistente " + franchise.getName(),
                    "ATIVO",
                    setup.getToneOfVoice(),
                    franchise
                )));
        }

        return agentRepository.findFirstByFranchiseIdOrderByCreatedAtAsc(franchise.getId())
            .orElseGet(() -> agentRepository.save(new GptMakerAgent(
                "gptmaker-agent-auto-" + franchise.getId().toString().substring(0, 8),
                "Assistente " + franchise.getName(),
                "ATIVO",
                setup.getToneOfVoice(),
                franchise
            )));
    }

    private void syncLocalAgent(Franchise franchise, GptMakerAgentOptionResponse agentResponse) {
        GptMakerAgent agent = agentRepository.findFirstByFranchiseIdOrderByCreatedAtAsc(franchise.getId())
            .orElseGet(() -> new GptMakerAgent(
                agentResponse.id(),
                agentResponse.name(),
                "ATIVO",
                "",
                franchise
            ));
        agent.setExternalId(agentResponse.id());
        agent.setName(agentResponse.name());
        agent.setStatus("ATIVO");
        agentRepository.save(agent);
    }

    private GptMakerAgent updateLocalAgent(GptMakerAgent agent, String agentName, String toneOfVoice) {
        if (agentName != null && !agentName.isBlank()) {
            agent.setName(agentName);
        }
        agent.setStatus("ATIVO");
        if (toneOfVoice != null) {
            agent.setToneOfVoice(toneOfVoice);
        }
        return agentRepository.save(agent);
    }

    private FranchiseSetup getOrCreateSetup(Franchise franchise) {
        return franchiseSetupRepository.findByFranchiseId(franchise.getId())
            .orElseGet(() -> franchiseSetupRepository.save(new FranchiseSetup(franchise)));
    }

    private FranchiseSetupResponse toSetupResponse(Franchise franchise, FranchiseSetup setup) {
        return new FranchiseSetupResponse(
            franchise.getId(),
            franchise.getName(),
            franchise.getDocument(),
            franchise.getCity(),
            franchise.getState(),
            setup.getResponsibleName(),
            setup.getServices(),
            setup.getPrices(),
            setup.getRegions(),
            setup.getSchedules(),
            setup.getFaq(),
            setup.getRules(),
            setup.getToneOfVoice(),
            setupProgressService.completionPercentage(franchise, setup),
            setupProgressService.setupStatus(franchise, setup),
            setup.getLastPublishedAt(),
            setup.getLastGeneratedTraining()
        );
    }

    private FranchiseGptMakerConnectionResponse toGptMakerConnectionResponse(Franchise franchise) {
        String status = franchise.getWorkspaceId() != null && franchise.getAgentId() != null ? "CONECTADO" : "NAO_CONECTADO";
        return new FranchiseGptMakerConnectionResponse(
            franchise.getId(),
            franchise.getName(),
            franchise.getWorkspaceId(),
            franchise.getWorkspaceName(),
            franchise.getAgentId(),
            franchise.getAgentName(),
            status,
            franchise.getGptMakerLastSyncAt()
        );
    }
}
