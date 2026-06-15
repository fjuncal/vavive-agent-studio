package br.com.vavive.gptmaker.service;

import br.com.vavive.gptmaker.domain.entity.Franchise;
import br.com.vavive.gptmaker.domain.entity.FranchiseSetup;
import br.com.vavive.gptmaker.domain.entity.GptMakerAgent;
import br.com.vavive.gptmaker.domain.entity.User;
import br.com.vavive.gptmaker.domain.enums.UserRole;
import br.com.vavive.gptmaker.dto.CreateFranchiseRequest;
import br.com.vavive.gptmaker.dto.CreateFranchiseAdminUserRequest;
import br.com.vavive.gptmaker.dto.FranchiseResponse;
import br.com.vavive.gptmaker.dto.FranchiseGptMakerConnectionResponse;
import br.com.vavive.gptmaker.dto.FranchiseSetupResponse;
import br.com.vavive.gptmaker.dto.GptMakerAgentOptionResponse;
import br.com.vavive.gptmaker.dto.GptMakerWorkspaceOptionResponse;
import br.com.vavive.gptmaker.dto.PublishAgentResponse;
import br.com.vavive.gptmaker.dto.ProvisionFranchiseGptMakerAgentRequest;
import br.com.vavive.gptmaker.dto.UpdateFranchiseSetupRequest;
import br.com.vavive.gptmaker.dto.UpdateFranchiseGptMakerConnectionRequest;
import br.com.vavive.gptmaker.dto.UserResponse;
import br.com.vavive.gptmaker.dto.VaviveDefaultContextResponse;
import br.com.vavive.gptmaker.integration.gptmaker.GptMakerClient;
import br.com.vavive.gptmaker.integration.gptmaker.GptMakerClient.GptMakerIntegrationException;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerCreateAgentRequest;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerCreateAgentResponse;
import br.com.vavive.gptmaker.repository.AgentTrainingRepository;
import br.com.vavive.gptmaker.repository.FranchiseRepository;
import br.com.vavive.gptmaker.repository.FranchiseSetupRepository;
import br.com.vavive.gptmaker.repository.GptMakerAgentRepository;
import br.com.vavive.gptmaker.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
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
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final VaviveDefaultContextService vaviveDefaultContextService;

    public FranchiseService(
        FranchiseRepository franchiseRepository,
        FranchiseSetupRepository franchiseSetupRepository,
        GptMakerAgentRepository agentRepository,
        AgentTrainingRepository trainingRepository,
        TrainingGeneratorService trainingGeneratorService,
        SetupProgressService setupProgressService,
        GptMakerClient gptMakerClient,
        CurrentUserService currentUserService,
        UserRepository userRepository,
        PasswordEncoder passwordEncoder,
        VaviveDefaultContextService vaviveDefaultContextService
    ) {
        this.franchiseRepository = franchiseRepository;
        this.franchiseSetupRepository = franchiseSetupRepository;
        this.agentRepository = agentRepository;
        this.trainingRepository = trainingRepository;
        this.trainingGeneratorService = trainingGeneratorService;
        this.setupProgressService = setupProgressService;
        this.gptMakerClient = gptMakerClient;
        this.currentUserService = currentUserService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.vaviveDefaultContextService = vaviveDefaultContextService;
    }

    @Transactional(readOnly = true)
    public List<FranchiseResponse> list() {
        User user = currentUserService.requireCurrentUser();
        if (user.getRole() == UserRole.SUPER_ADMIN) {
            return franchiseRepository.findAll().stream().map(AuthService::toFranchiseResponse).toList();
        }
        return List.of(AuthService.toFranchiseResponse(currentUserService.requireFranchise(user)));
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
    public UserResponse getAdminUser(UUID id) {
        Franchise franchise = requireAccessibleFranchise(id);
        return userRepository.findFirstByFranchiseIdAndRole(franchise.getId(), UserRole.ADMIN_FRANQUIA)
            .map(AuthService::toResponse)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Administrador da franquia ainda nao cadastrado"));
    }

    @Transactional
    public UserResponse createAdminUser(UUID id, CreateFranchiseAdminUserRequest request) {
        requireSuperAdmin();
        Franchise franchise = requireAccessibleFranchise(id);
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ja existe um usuario com este email");
        }
        if (userRepository.findFirstByFranchiseIdAndRole(franchise.getId(), UserRole.ADMIN_FRANQUIA).isPresent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Esta franquia ja possui um administrador cadastrado");
        }

        User user = new User(
            request.name(),
            request.email(),
            passwordEncoder.encode(request.password()),
            UserRole.ADMIN_FRANQUIA,
            franchise
        );
        return AuthService.toResponse(userRepository.save(user));
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
    public VaviveDefaultContextResponse getDefaultContext(UUID id) {
        Franchise franchise = requireAccessibleFranchise(id);
        return new VaviveDefaultContextResponse(
            franchise.getId(),
            franchise.getName(),
            vaviveDefaultContextService.buildForFranchise(franchise)
        );
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
                    item.communicationType(),
                    item.type(),
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
        if (request.workspaceId() == null || request.workspaceId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Workspace GPTMaker nao informado");
        }
        if (request.agentId() == null || request.agentId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Agente GPTMaker nao informado");
        }
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
                    item.communicationType(),
                    item.type(),
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
    public FranchiseGptMakerConnectionResponse provisionGptMakerAgent(UUID id, ProvisionFranchiseGptMakerAgentRequest request) {
        requireSuperAdmin();
        Franchise franchise = requireAccessibleFranchise(id);
        if (request.workspaceId() == null || request.workspaceId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Workspace GPTMaker nao informado");
        }
        if (request.agentName() == null || request.agentName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nome do agente GPTMaker nao informado");
        }

        String context = vaviveDefaultContextService.buildForFranchise(franchise);
        String jobDescription = mergeJobDescription(context, request.jobDescription());

        GptMakerCreateAgentResponse createdAgent;
        try {
            createdAgent = gptMakerClient.createAgent(
                request.workspaceId(),
                new GptMakerCreateAgentRequest(
                    request.agentName(),
                    null,
                    context,
                    request.communicationType(),
                    request.type(),
                    request.jobName(),
                    request.jobSite(),
                    jobDescription
                )
            );
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(statusForGptMakerException(exception), exception.getMessage());
        }

        franchise.setWorkspaceId(request.workspaceId());
        franchise.setWorkspaceName(resolveWorkspaceName(request.workspaceName(), franchise));
        franchise.setAgentId(createdAgent.id());
        franchise.setAgentName(createdAgent.name() != null && !createdAgent.name().isBlank() ? createdAgent.name() : request.agentName());
        franchise.setGptMakerLastSyncAt(LocalDateTime.now());
        franchiseRepository.save(franchise);

        GptMakerAgent localAgent = syncProvisionedAgent(franchise, createdAgent, request.communicationType());
        createInitialLocalTraining(localAgent, context);
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
        if (user.getRole() != UserRole.SUPER_ADMIN
            && !franchise.getId().equals(currentUserService.requireFranchise(user).getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "ADMIN_FRANQUIA so pode acessar dados da propria franquia.");
        }
        return franchise;
    }

    private void requireSuperAdmin() {
        currentUserService.requireSuperAdmin("Apenas SUPER_ADMIN pode acessar esta configuracao GPTMaker.");
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
        GptMakerAgent agent = agentRepository.findFirstByFranchiseIdAndExternalId(franchise.getId(), agentResponse.id())
            .or(() -> agentRepository.findFirstByFranchiseIdAndName(franchise.getId(), agentResponse.name()))
            .or(() -> agentRepository.findFirstByFranchiseIdOrderByCreatedAtAsc(franchise.getId()))
            .orElseGet(() -> new GptMakerAgent(
                agentResponse.id(),
                agentResponse.name(),
                "ATIVO",
                defaultToneOfVoice(franchise),
                franchise
            ));
        agent.setExternalId(agentResponse.id());
        agent.setName(agentResponse.name());
        agent.setStatus("ATIVO");
        if (agent.getToneOfVoice() == null || agent.getToneOfVoice().isBlank()) {
            agent.setToneOfVoice(defaultToneOfVoice(franchise));
        }
        agentRepository.save(agent);
    }

    private GptMakerAgent syncProvisionedAgent(Franchise franchise, GptMakerCreateAgentResponse createdAgent, String communicationType) {
        GptMakerAgent agent = agentRepository.findFirstByFranchiseIdAndExternalId(franchise.getId(), createdAgent.id())
            .or(() -> agentRepository.findFirstByFranchiseIdAndName(franchise.getId(), franchise.getAgentName()))
            .or(() -> agentRepository.findFirstByFranchiseIdOrderByCreatedAtAsc(franchise.getId()))
            .orElseGet(() -> new GptMakerAgent(
                createdAgent.id(),
                franchise.getAgentName(),
                "ATIVO",
                defaultToneOfVoice(franchise),
                franchise
            ));
        agent.setExternalId(createdAgent.id());
        agent.setName(franchise.getAgentName());
        agent.setStatus("ATIVO");
        agent.setToneOfVoice(resolveToneOfVoice(communicationType, franchise));
        return agentRepository.save(agent);
    }

    private void createInitialLocalTraining(GptMakerAgent agent, String context) {
        trainingRepository.save(new br.com.vavive.gptmaker.domain.entity.AgentTraining(
            "Contexto inicial Vavive",
            context,
            "SALVO_LOCALMENTE",
            null,
            "Treinamento inicial salvo localmente apos o provisionamento do agente GPTMaker.",
            agent
        ));
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

    private String defaultToneOfVoice(Franchise franchise) {
        return "Acolhedor, claro e consultivo para a franquia " + franchise.getName();
    }

    private String resolveToneOfVoice(String communicationType, Franchise franchise) {
        if (communicationType == null || communicationType.isBlank()) {
            return defaultToneOfVoice(franchise);
        }
        return communicationType;
    }

    private String resolveWorkspaceName(String workspaceName, Franchise franchise) {
        if (workspaceName != null && !workspaceName.isBlank()) {
            return workspaceName;
        }
        try {
            return gptMakerClient.listWorkspaces().stream()
                .filter(item -> franchise.getWorkspaceId().equals(item.id()))
                .map(item -> item.name())
                .findFirst()
                .orElse(franchise.getWorkspaceId());
        } catch (GptMakerIntegrationException exception) {
            return franchise.getWorkspaceId();
        }
    }

    private String mergeJobDescription(String context, String customJobDescription) {
        if (customJobDescription == null || customJobDescription.isBlank()) {
            return context;
        }
        return customJobDescription;
    }

    private HttpStatus statusForGptMakerException(GptMakerIntegrationException exception) {
        if ("GPTMAKER_AGENT_LIMIT".equals(exception.getErrorCode())
            || "INVALID_WORKSPACE".equals(exception.getErrorCode())
            || "INVALID_AGENT_NAME".equals(exception.getErrorCode())) {
            return HttpStatus.BAD_REQUEST;
        }
        return HttpStatus.BAD_GATEWAY;
    }
}
