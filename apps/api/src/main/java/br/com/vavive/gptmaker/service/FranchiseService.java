package br.com.vavive.gptmaker.service;

import br.com.vavive.gptmaker.domain.entity.Franchise;
import br.com.vavive.gptmaker.domain.entity.FranchiseAssistantBlockConfig;
import br.com.vavive.gptmaker.domain.entity.FranchiseSetup;
import br.com.vavive.gptmaker.domain.entity.GptMakerAgent;
import br.com.vavive.gptmaker.domain.entity.User;
import br.com.vavive.gptmaker.domain.enums.AssistantBlockMode;
import br.com.vavive.gptmaker.domain.enums.AssistantBlockType;
import br.com.vavive.gptmaker.domain.enums.UserRole;
import br.com.vavive.gptmaker.dto.ConversationExampleResponse;
import br.com.vavive.gptmaker.dto.CreateFranchiseRequest;
import br.com.vavive.gptmaker.dto.CreateFranchiseAdminUserRequest;
import br.com.vavive.gptmaker.dto.CreateFullFranchiseRequest;
import br.com.vavive.gptmaker.dto.CreateFullFranchiseResponse;
import br.com.vavive.gptmaker.dto.FranchiseResponse;
import br.com.vavive.gptmaker.dto.FranchiseGptMakerConnectionResponse;
import br.com.vavive.gptmaker.dto.FranchiseSetupResponse;
import br.com.vavive.gptmaker.dto.FranchiseWorkspaceMappingResponse;
import br.com.vavive.gptmaker.dto.CriticalChangeRequest;
import br.com.vavive.gptmaker.dto.GptMakerAgentOptionResponse;
import br.com.vavive.gptmaker.dto.GptMakerWorkspaceOptionResponse;
import br.com.vavive.gptmaker.dto.PublishAgentResponse;
import br.com.vavive.gptmaker.dto.ProvisionFranchiseGptMakerAgentRequest;
import br.com.vavive.gptmaker.dto.UpdateFranchiseSetupRequest;
import br.com.vavive.gptmaker.dto.UpdateFranchiseGptMakerConnectionRequest;
import br.com.vavive.gptmaker.dto.UpdateFranchiseGptMakerWorkspaceRequest;
import br.com.vavive.gptmaker.dto.UserResponse;
import br.com.vavive.gptmaker.dto.VaviveDefaultContextResponse;
import br.com.vavive.gptmaker.dto.WorkspaceCreditsResponse;
import br.com.vavive.gptmaker.integration.gptmaker.GptMakerClient;
import br.com.vavive.gptmaker.integration.gptmaker.GptMakerClient.GptMakerIntegrationException;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerCreateAgentRequest;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerCreateAgentResponse;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerWorkspaceResponse;
import br.com.vavive.gptmaker.repository.AgentTrainingRepository;
import br.com.vavive.gptmaker.repository.AgentIntentRepository;
import br.com.vavive.gptmaker.repository.AgentRuleRepository;
import br.com.vavive.gptmaker.repository.AgentConversationExampleRepository;
import br.com.vavive.gptmaker.repository.FranchiseAssistantBlockConfigRepository;
import br.com.vavive.gptmaker.repository.FranchiseRepository;
import br.com.vavive.gptmaker.repository.FranchiseSetupRepository;
import br.com.vavive.gptmaker.repository.GptMakerAgentRepository;
import br.com.vavive.gptmaker.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class FranchiseService {
    private static final Logger log = LoggerFactory.getLogger(FranchiseService.class);
    private final FranchiseRepository franchiseRepository;
    private final FranchiseSetupRepository franchiseSetupRepository;
    private final GptMakerAgentRepository agentRepository;
    private final AgentTrainingRepository trainingRepository;
    private final AgentIntentRepository intentRepository;
    private final AgentRuleRepository ruleRepository;
    private final AgentConversationExampleRepository exampleRepository;
    private final FranchiseAssistantBlockConfigRepository assistantBlockConfigRepository;
    private final TrainingGeneratorService trainingGeneratorService;
    private final SetupProgressService setupProgressService;
    private final GptMakerClient gptMakerClient;
    private final CurrentUserService currentUserService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final VaviveDefaultContextService vaviveDefaultContextService;
    private final WorkspaceCreditsService workspaceCreditsService;
    private final ObjectMapper objectMapper;

    public FranchiseService(
        FranchiseRepository franchiseRepository,
        FranchiseSetupRepository franchiseSetupRepository,
        GptMakerAgentRepository agentRepository,
        AgentTrainingRepository trainingRepository,
        AgentIntentRepository intentRepository,
        AgentRuleRepository ruleRepository,
        AgentConversationExampleRepository exampleRepository,
        FranchiseAssistantBlockConfigRepository assistantBlockConfigRepository,
        TrainingGeneratorService trainingGeneratorService,
        SetupProgressService setupProgressService,
        GptMakerClient gptMakerClient,
        CurrentUserService currentUserService,
        UserRepository userRepository,
        PasswordEncoder passwordEncoder,
        VaviveDefaultContextService vaviveDefaultContextService,
        WorkspaceCreditsService workspaceCreditsService,
        ObjectMapper objectMapper
    ) {
        this.franchiseRepository = franchiseRepository;
        this.franchiseSetupRepository = franchiseSetupRepository;
        this.agentRepository = agentRepository;
        this.trainingRepository = trainingRepository;
        this.intentRepository = intentRepository;
        this.ruleRepository = ruleRepository;
        this.exampleRepository = exampleRepository;
        this.assistantBlockConfigRepository = assistantBlockConfigRepository;
        this.trainingGeneratorService = trainingGeneratorService;
        this.setupProgressService = setupProgressService;
        this.gptMakerClient = gptMakerClient;
        this.currentUserService = currentUserService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.vaviveDefaultContextService = vaviveDefaultContextService;
        this.workspaceCreditsService = workspaceCreditsService;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<FranchiseResponse> list() {
        User user = currentUserService.requireCurrentUser();
        if (user.getRole() == UserRole.SUPER_ADMIN) {
            List<Franchise> franchises = franchiseRepository.findAll();
            var creditsByFranchise = workspaceCreditsService.forFranchises(franchises);
            return franchises.stream()
                .map(franchise -> AuthService.toFranchiseResponse(franchise, creditsByFranchise.get(franchise.getId().toString())))
                .toList();
        }
        Franchise franchise = currentUserService.requireFranchise(user);
        return List.of(AuthService.toFranchiseResponse(franchise, workspaceCreditsService.forFranchise(franchise)));
    }

    @Transactional
    public FranchiseResponse create(CreateFranchiseRequest request) {
        User user = currentUserService.requireCurrentUser();
        if (user.getRole() != UserRole.SUPER_ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Apenas SUPER_ADMIN pode criar franquias");
        }
        Franchise franchise = new Franchise(request.name(), request.document(), request.city(), request.state(), "PENDENTE_CONFIGURACAO");
        if (request.workspaceId() != null && !request.workspaceId().isBlank()) {
            GptMakerWorkspaceResponse workspace = requireExistingWorkspace(request.workspaceId());
            ensureWorkspaceAvailable(workspace.id(), null);
            franchise.setWorkspaceId(workspace.id());
            franchise.setWorkspaceName(resolveProvidedWorkspaceName(request.workspaceName(), workspace));
        }
        refreshStatus(franchise);
        return AuthService.toFranchiseResponse(franchiseRepository.save(franchise));
    }

    @Transactional
    public CreateFullFranchiseResponse createFull(CreateFullFranchiseRequest request) {
        requireSuperAdmin();
        Franchise franchise = new Franchise(
            request.franchise().name(),
            request.franchise().document(),
            request.franchise().city(),
            request.franchise().state(),
            "PENDENTE_CONFIGURACAO"
        );
        if (request.franchise().workspaceId() != null && !request.franchise().workspaceId().isBlank()) {
            GptMakerWorkspaceResponse workspace = requireExistingWorkspace(request.franchise().workspaceId());
            ensureWorkspaceAvailable(workspace.id(), null);
            franchise.setWorkspaceId(workspace.id());
            franchise.setWorkspaceName(resolveProvidedWorkspaceName(request.franchise().workspaceName(), workspace));
        }
        refreshStatus(franchise);
        franchiseRepository.save(franchise);

        if (userRepository.existsByEmailIgnoreCase(request.adminUser().email())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ja existe um usuario com este email");
        }
        User admin = new User(
            request.adminUser().name(),
            request.adminUser().email(),
            passwordEncoder.encode(request.adminUser().password()),
            UserRole.ADMIN_FRANQUIA,
            franchise
        );
        userRepository.save(admin);

        return new CreateFullFranchiseResponse(
            AuthService.toFranchiseResponse(franchise),
            AuthService.toResponse(admin)
        );
    }

    @Transactional(readOnly = true)
    public FranchiseResponse get(UUID id) {
        Franchise franchise = requireAccessibleFranchise(id);
        return AuthService.toFranchiseResponse(franchise, workspaceCreditsService.forFranchise(franchise));
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

    @Transactional
    public FranchiseGptMakerConnectionResponse getGptMakerConnection(UUID id) {
        Franchise franchise = requireAccessibleFranchise(id);
        if ((franchise.getAgentId() == null || franchise.getAgentId().isBlank())
            && franchise.getWorkspaceId() != null
            && !franchise.getWorkspaceId().isBlank()) {
            List<GptMakerAgentOptionResponse> workspaceAgents = syncWorkspaceAgents(franchise);
            if (!workspaceAgents.isEmpty()) {
                bindImportedAgent(franchise, workspaceAgents.getFirst());
            }
        }
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
    public List<GptMakerWorkspaceOptionResponse> listAvailableWorkspaces() {
        requireSuperAdmin();
        try {
            Set<String> linkedWorkspaceIds = franchiseRepository.findAll().stream()
                .map(Franchise::getWorkspaceId)
                .filter(item -> item != null && !item.isBlank())
                .collect(java.util.stream.Collectors.toSet());
            return gptMakerClient.listWorkspaces().stream()
                .filter(item -> item.id() != null && !item.id().isBlank())
                .filter(item -> !linkedWorkspaceIds.contains(item.id()))
                .map(item -> new GptMakerWorkspaceOptionResponse(item.id(), item.name()))
                .toList();
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, exception.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public FranchiseWorkspaceMappingResponse workspaceMapping() {
        requireSuperAdmin();
        List<GptMakerWorkspaceResponse> workspaces;
        try {
            workspaces = gptMakerClient.listWorkspaces();
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, exception.getMessage());
        }

        List<Franchise> franchises = franchiseRepository.findAll();
        Set<String> linkedWorkspaceIds = new HashSet<>();
        List<FranchiseWorkspaceMappingResponse.LinkedWorkspaceFranchiseResponse> linked = franchises.stream()
            .filter(franchise -> franchise.getWorkspaceId() != null && !franchise.getWorkspaceId().isBlank())
            .peek(franchise -> linkedWorkspaceIds.add(franchise.getWorkspaceId()))
            .map(franchise -> new FranchiseWorkspaceMappingResponse.LinkedWorkspaceFranchiseResponse(
                franchise.getWorkspaceId(),
                franchise.getWorkspaceName(),
                franchise.getId(),
                franchise.getName(),
                franchise.getAgentId(),
                franchise.getAgentName()
            ))
            .toList();

        List<FranchiseWorkspaceMappingResponse.UnlinkedWorkspaceResponse> unlinkedWorkspaces = workspaces.stream()
            .filter(workspace -> workspace.id() != null && !workspace.id().isBlank())
            .filter(workspace -> !linkedWorkspaceIds.contains(workspace.id()))
            .map(workspace -> new FranchiseWorkspaceMappingResponse.UnlinkedWorkspaceResponse(workspace.id(), workspace.name()))
            .toList();

        List<FranchiseWorkspaceMappingResponse.FranchiseWithoutWorkspaceResponse> franchisesWithoutWorkspace = franchises.stream()
            .filter(franchise -> franchise.getWorkspaceId() == null || franchise.getWorkspaceId().isBlank())
            .map(franchise -> new FranchiseWorkspaceMappingResponse.FranchiseWithoutWorkspaceResponse(
                franchise.getId(),
                franchise.getName(),
                franchise.getCity(),
                franchise.getState()
            ))
            .toList();

        return new FranchiseWorkspaceMappingResponse(linked, unlinkedWorkspaces, franchisesWithoutWorkspace);
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
        ensureWorkspaceAvailable(request.workspaceId(), franchise.getId());
        requireCriticalAgentConfirmation(franchise, request.agentId(), request.confirmCriticalChange());

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
        refreshStatus(franchise);
        franchiseRepository.save(franchise);

        syncLocalAgent(franchise, agent);
        importAgentConfiguration(franchise, agent);
        return toGptMakerConnectionResponse(franchise);
    }

    @Transactional
    public FranchiseGptMakerConnectionResponse linkGptMakerWorkspace(UUID id, UpdateFranchiseGptMakerWorkspaceRequest request) {
        requireSuperAdmin();
        Franchise franchise = requireAccessibleFranchise(id);
        GptMakerWorkspaceResponse workspace = requireExistingWorkspace(request.workspaceId());
        ensureWorkspaceAvailable(workspace.id(), franchise.getId());
        boolean workspaceChanged = franchise.getWorkspaceId() != null
            && !franchise.getWorkspaceId().isBlank()
            && !Objects.equals(franchise.getWorkspaceId(), workspace.id());
        if (workspaceChanged && !Boolean.TRUE.equals(request.confirmCriticalChange())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trocar workspace e uma acao critica. Confirme para continuar.");
        }

        franchise.setWorkspaceId(workspace.id());
        franchise.setWorkspaceName(resolveProvidedWorkspaceName(request.workspaceName(), workspace));
        if (workspaceChanged) {
            franchise.setAgentId(null);
            franchise.setAgentName(null);
            franchise.setGptMakerLastSyncAt(null);
        }
        refreshStatus(franchise);
        franchiseRepository.save(franchise);
        List<GptMakerAgentOptionResponse> workspaceAgents = syncWorkspaceAgents(franchise);
        if ((franchise.getAgentId() == null || franchise.getAgentId().isBlank()) && !workspaceAgents.isEmpty()) {
            bindImportedAgent(franchise, workspaceAgents.getFirst());
        } else if (franchise.getAgentId() != null && !franchise.getAgentId().isBlank()) {
            workspaceAgents.stream()
                .filter(agent -> franchise.getAgentId().equals(agent.id()))
                .findFirst()
                .ifPresent(agent -> importAgentConfiguration(franchise, agent));
        }
        return toGptMakerConnectionResponse(franchise);
    }

    @Transactional
    public FranchiseGptMakerConnectionResponse unlinkGptMakerWorkspace(UUID id, CriticalChangeRequest request) {
        requireSuperAdmin();
        if (!Boolean.TRUE.equals(request.confirmCriticalChange())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Desvincular workspace e uma acao critica. Confirme para continuar.");
        }
        Franchise franchise = requireAccessibleFranchise(id);
        franchise.setWorkspaceId(null);
        franchise.setWorkspaceName(null);
        franchise.setAgentId(null);
        franchise.setAgentName(null);
        franchise.setGptMakerLastSyncAt(null);
        refreshStatus(franchise);
        franchiseRepository.save(franchise);
        return toGptMakerConnectionResponse(franchise);
    }

    @Transactional
    public FranchiseGptMakerConnectionResponse clearGptMakerAgent(UUID id, CriticalChangeRequest request) {
        requireSuperAdmin();
        if (!Boolean.TRUE.equals(request.confirmCriticalChange())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Limpar agente e uma acao critica. Confirme para continuar.");
        }
        Franchise franchise = requireAccessibleFranchise(id);
        franchise.setAgentId(null);
        franchise.setAgentName(null);
        franchise.setGptMakerLastSyncAt(null);
        refreshStatus(franchise);
        franchiseRepository.save(franchise);
        return toGptMakerConnectionResponse(franchise);
    }

    @Transactional
    public FranchiseGptMakerConnectionResponse provisionGptMakerAgent(UUID id, ProvisionFranchiseGptMakerAgentRequest request) {
        Franchise franchise = requireAccessibleFranchise(id);
        if (request.workspaceId() == null || request.workspaceId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Workspace GPTMaker nao informado");
        }
        if (request.agentName() == null || request.agentName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nome do agente GPTMaker nao informado");
        }
        ensureWorkspaceAvailable(request.workspaceId(), franchise.getId());
        requireCriticalAgentConfirmation(franchise, request.agentName(), request.confirmCriticalChange());

        String context = vaviveDefaultContextService.buildForFranchise(franchise);
        String behavior = (request.behavior() != null && !request.behavior().isBlank())
            ? request.behavior()
            : resolveBehavior(context, request.jobDescription());
        String jobDescription = mergeJobDescription(context, request.jobDescription());

        GptMakerCreateAgentResponse createdAgent;
        try {
            createdAgent = gptMakerClient.createAgent(
                request.workspaceId(),
                new GptMakerCreateAgentRequest(
                    request.agentName(),
                    request.avatar(),
                    behavior,
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
        refreshStatus(franchise);
        franchiseRepository.save(franchise);

        syncProvisionedAgent(franchise, createdAgent, request.communicationType(), context);
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
        setup.setFranchiseWhatsapp(request.franchiseWhatsapp());

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
            training.setPublishedAt(training.getCreatedAt());
            trainingRepository.save(training);
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
        agent.setAvatar(agentResponse.avatar());
        agent.setStatus("ATIVO");
        agent.setToneOfVoice(resolveToneOfVoice(agentResponse.communicationType(), franchise));
        agentRepository.save(agent);
    }

    private List<GptMakerAgentOptionResponse> syncWorkspaceAgents(Franchise franchise) {
        if (franchise.getWorkspaceId() == null || franchise.getWorkspaceId().isBlank()) {
            return List.of();
        }
        try {
            List<GptMakerAgentOptionResponse> agents = gptMakerClient.listAgents(franchise.getWorkspaceId()).stream()
                .map(agent -> new GptMakerAgentOptionResponse(
                    agent.id(),
                    agent.name(),
                    agent.behavior(),
                    agent.avatar(),
                    agent.communicationType(),
                    agent.type(),
                    agent.jobName(),
                    agent.jobSite(),
                    agent.jobDescription()
                ))
                .toList();
            agents.forEach(agent -> syncLocalAgent(
                franchise,
                agent
            ));
            return agents;
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, exception.getMessage());
        }
    }

    private void bindImportedAgent(Franchise franchise, GptMakerAgentOptionResponse agent) {
        franchise.setAgentId(agent.id());
        franchise.setAgentName(agent.name());
        franchise.setGptMakerLastSyncAt(LocalDateTime.now());
        refreshStatus(franchise);
        franchiseRepository.save(franchise);
        syncLocalAgent(franchise, agent);
        importAgentConfiguration(franchise, agent);
    }

    private void importAgentConfiguration(Franchise franchise, GptMakerAgentOptionResponse agent) {
        upsertAssistantBlock(franchise, AssistantBlockType.ROLE, buildRolePayload(franchise, agent));
        upsertAssistantBlock(franchise, AssistantBlockType.BEHAVIOR, buildBehaviorPayload(franchise, agent));
        upsertAssistantBlock(franchise, AssistantBlockType.AGENT_SETTINGS, buildAgentSettingsPayload(franchise, agent.id()));
        upsertAssistantBlock(franchise, AssistantBlockType.TRAININGS, buildTrainingsPayload(agent.id()));
        upsertAssistantBlock(franchise, AssistantBlockType.INTENTIONS, buildIntentionsPayload(agent.id()));
        upsertAssistantBlock(franchise, AssistantBlockType.IDLE_ACTIONS, buildIdleActionsPayload(agent.id()));
        upsertAssistantBlock(franchise, AssistantBlockType.TRANSFER_RULES, buildTransferRulesPayload(agent.id()));
    }

    private ObjectNode buildRolePayload(Franchise franchise, GptMakerAgentOptionResponse agent) {
        return objectMapper.createObjectNode()
            .put("assistantName", fallback(agent.name(), franchise.getAgentName(), "Assistente Vavive"))
            .put("communicationType", normalizeCommunicationType(agent.communicationType()))
            .put("type", normalizeObjectiveType(agent.type()))
            .put("jobName", fallback(agent.jobName(), franchise.getName(), "Assistente Vavive"))
            .put("jobSite", fallback(agent.jobSite(), "https://vavive.com.br"))
            .put("description", fallback(agent.jobDescription(), "Atendimento comercial e operacional da unidade."));
    }

    private ObjectNode buildBehaviorPayload(Franchise franchise, GptMakerAgentOptionResponse agent) {
        String instruction = fallback(
            agent.behavior(),
            agent.jobDescription(),
            "Assistente consultivo, claro e orientado a conversao para a franquia " + franchise.getName() + "."
        );
        return objectMapper.createObjectNode()
            .put("instruction", instruction)
            .put("summary", instruction.length() > 200 ? instruction.substring(0, 200) : instruction);
    }

    private ObjectNode buildAgentSettingsPayload(Franchise franchise, String agentId) {
        ObjectNode payload = defaultAgentSettingsPayload();
        try {
            JsonNode remoteSettings = gptMakerClient.getAgentSettings(agentId);
            if (remoteSettings != null && remoteSettings.isObject()) {
                payload.put("prefferModel", text(remoteSettings, "prefferModel", payload.path("prefferModel").asText()));
                payload.put("timezone", text(remoteSettings, "timezone", payload.path("timezone").asText()));
                payload.put("enabledHumanTransfer", bool(remoteSettings, "enabledHumanTransfer", payload.path("enabledHumanTransfer").asBoolean()));
                payload.put("enabledReminder", bool(remoteSettings, "enabledReminder", payload.path("enabledReminder").asBoolean()));
                payload.put("splitMessages", bool(remoteSettings, "splitMessages", payload.path("splitMessages").asBoolean()));
                payload.put("enabledEmoji", bool(remoteSettings, "enabledEmoji", payload.path("enabledEmoji").asBoolean()));
                payload.put("limitSubjects", bool(remoteSettings, "limitSubjects", payload.path("limitSubjects").asBoolean()));
                payload.put("signMessages", bool(remoteSettings, "signMessages", payload.path("signMessages").asBoolean()));
                payload.put("messageGroupingTime", text(remoteSettings, "messageGroupingTime", payload.path("messageGroupingTime").asText()));
                if (remoteSettings.hasNonNull("maxDailyMessages")) {
                    payload.put("maxDailyMessages", remoteSettings.get("maxDailyMessages").asInt());
                }
            }
        } catch (GptMakerIntegrationException exception) {
            log.warn("Nao foi possivel importar agent settings do GPTMaker para a franquia {}. Erro: {}", franchise.getId(), exception.getMessage());
        }
        return payload;
    }

    private ObjectNode buildTrainingsPayload(String agentId) {
        ObjectNode payload = objectMapper.createObjectNode();
        payload.set("items", mapRemoteItems(fetchRemoteList(agentId, "TRAININGS"), this::toTrainingItem));
        return payload;
    }

    private ObjectNode buildIntentionsPayload(String agentId) {
        ObjectNode payload = objectMapper.createObjectNode();
        payload.set("items", mapRemoteItems(fetchRemoteList(agentId, "INTENTIONS"), this::toIntentionItem));
        return payload;
    }

    private ObjectNode buildIdleActionsPayload(String agentId) {
        ObjectNode payload = objectMapper.createObjectNode();
        payload.set("items", mapRemoteItems(fetchRemoteList(agentId, "IDLE_ACTIONS"), this::toReferenceItem));
        return payload;
    }

    private ObjectNode buildTransferRulesPayload(String agentId) {
        ObjectNode payload = objectMapper.createObjectNode();
        payload.set("items", mapRemoteItems(fetchRemoteList(agentId, "TRANSFER_RULES"), this::toReferenceItem));
        return payload;
    }

    private JsonNode fetchRemoteList(String agentId, String blockName) {
        try {
            return switch (blockName) {
                case "TRAININGS" -> gptMakerClient.listTrainings(agentId);
                case "INTENTIONS" -> gptMakerClient.listIntentions(agentId);
                case "IDLE_ACTIONS" -> gptMakerClient.listIdleActions(agentId);
                case "TRANSFER_RULES" -> gptMakerClient.listTransferRules(agentId);
                default -> objectMapper.createArrayNode();
            };
        } catch (GptMakerIntegrationException exception) {
            log.warn("Nao foi possivel importar bloco {} do GPTMaker para o agente {}. Erro: {}", blockName, agentId, exception.getMessage());
            return objectMapper.createArrayNode();
        }
    }

    private ArrayNode mapRemoteItems(JsonNode remoteItems, java.util.function.Function<JsonNode, ObjectNode> mapper) {
        ArrayNode result = objectMapper.createArrayNode();
        for (JsonNode item : extractArray(remoteItems)) {
            if (item != null && item.isObject()) {
                result.add(mapper.apply(item));
            }
        }
        return result;
    }

    private ArrayNode extractArray(JsonNode remoteItems) {
        if (remoteItems instanceof ArrayNode arrayNode) {
            return arrayNode;
        }
        if (remoteItems != null && remoteItems.isObject()) {
            for (String field : List.of("items", "data", "content", "results")) {
                JsonNode nested = remoteItems.get(field);
                if (nested instanceof ArrayNode arrayNode) {
                    return arrayNode;
                }
            }
        }
        return objectMapper.createArrayNode();
    }

    private ObjectNode toTrainingItem(JsonNode remoteItem) {
        ObjectNode item = copyObject(remoteItem);
        ensureText(item, "title", text(remoteItem, "title", text(remoteItem, "name", "Treinamento importado")));
        ensureText(item, "content", text(remoteItem, "content", text(remoteItem, "description", text(remoteItem, "text", "Conteudo nao informado."))));
        return item;
    }

    private ObjectNode toIntentionItem(JsonNode remoteItem) {
        ObjectNode item = copyObject(remoteItem);
        ensureText(item, "name", text(remoteItem, "name", text(remoteItem, "title", "intencao-importada")));
        ensureText(item, "description", text(remoteItem, "description", text(remoteItem, "content", "Descricao nao informada.")));
        ensureText(item, "instructions", text(remoteItem, "instructions", text(remoteItem, "examplePhrase", text(remoteItem, "phrase", "Responder conforme a configuracao importada."))));
        return item;
    }

    private ObjectNode toReferenceItem(JsonNode remoteItem) {
        ObjectNode item = copyObject(remoteItem);
        if (!item.hasNonNull("name")) {
            String derivedName = text(remoteItem, "name", text(remoteItem, "title", text(remoteItem, "id", "item-importado")));
            item.put("name", derivedName);
        }
        return item;
    }

    private ObjectNode copyObject(JsonNode remoteItem) {
        return remoteItem instanceof ObjectNode objectNode
            ? objectNode.deepCopy()
            : objectMapper.createObjectNode();
    }

    private void ensureText(ObjectNode objectNode, String field, String value) {
        objectNode.put(field, value == null || value.isBlank() ? "Nao informado" : value);
    }

    private ObjectNode defaultAgentSettingsPayload() {
        return objectMapper.createObjectNode()
            .put("prefferModel", "GPT_4_O")
            .put("timezone", "America/Sao_Paulo")
            .put("enabledHumanTransfer", false)
            .put("enabledReminder", false)
            .put("splitMessages", false)
            .put("enabledEmoji", false)
            .put("limitSubjects", false)
            .put("signMessages", false)
            .put("messageGroupingTime", "NO_GROUP")
            .putNull("maxDailyMessages");
    }

    private void upsertAssistantBlock(Franchise franchise, AssistantBlockType blockType, JsonNode payload) {
        FranchiseAssistantBlockConfig config = assistantBlockConfigRepository.findByFranchiseAndBlockType(franchise, blockType)
            .orElseGet(() -> new FranchiseAssistantBlockConfig(franchise, blockType, AssistantBlockMode.CUSTOM));
        config.setMode(AssistantBlockMode.CUSTOM);
        config.setCustomPayloadJson(writeJson(payload));
        config.setCustomizedAt(LocalDateTime.now());
        assistantBlockConfigRepository.save(config);
    }

    private String writeJson(JsonNode payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nao foi possivel serializar a configuracao importada do agente.");
        }
    }

    private String normalizeCommunicationType(String communicationType) {
        if ("FORMAL".equalsIgnoreCase(communicationType) || "RELAXED".equalsIgnoreCase(communicationType)) {
            return communicationType.toUpperCase();
        }
        return "NORMAL";
    }

    private String normalizeObjectiveType(String type) {
        if ("SUPPORT".equalsIgnoreCase(type) || "PERSONAL".equalsIgnoreCase(type)) {
            return type.toUpperCase();
        }
        return "SALE";
    }

    private String text(JsonNode node, String field, String fallback) {
        if (node.hasNonNull(field) && !node.get(field).asText().isBlank()) {
            return node.get(field).asText();
        }
        return fallback;
    }

    private boolean bool(JsonNode node, String field, boolean fallback) {
        if (node.has(field) && !node.get(field).isNull()) {
            return node.get(field).asBoolean();
        }
        return fallback;
    }

    private String fallback(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return "";
    }

    private GptMakerAgent syncProvisionedAgent(Franchise franchise, GptMakerCreateAgentResponse createdAgent, String communicationType, String context) {
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
        agent.setAvatar(createdAgent.avatar());
        agent.setStatus("ATIVO");
        agent.setToneOfVoice(resolveToneOfVoice(communicationType, franchise));
        GptMakerAgent saved = agentRepository.save(agent);
        if (trainingRepository.findByAgentIdOrderByCreatedAtDesc(saved.getId()).isEmpty()) {
            createInitialLocalTraining(saved, context);
        }
        return saved;
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
        var localAgent = agentRepository.findFirstByFranchiseIdOrderByCreatedAtAsc(franchise.getId()).orElse(null);
        List<ConversationExampleResponse> examples = localAgent == null
            ? List.of()
            : exampleRepository.findByAgentIdOrderByCreatedAtDesc(localAgent.getId()).stream()
                .map(example -> new ConversationExampleResponse(
                    example.getId(),
                    example.getTitle(),
                    example.getObjective(),
                    example.getMessages(),
                    example.getStatus(),
                    example.isIncludeInTraining(),
                    example.getCreatedAt(),
                    example.getUpdatedAt()
                ))
                .toList();
        List<br.com.vavive.gptmaker.dto.TrainingResponse> recentTrainings = localAgent == null
            ? List.of()
            : trainingRepository.findByAgentIdOrderByCreatedAtDesc(localAgent.getId()).stream()
                .limit(5)
                .map(training -> new br.com.vavive.gptmaker.dto.TrainingResponse(
                    training.getId(),
                    training.getTitle(),
                    training.getContent(),
                    training.getStatus(),
                    training.getExternalReference(),
                    training.getResultMessage(),
                    training.getContentSummary(),
                    "PUBLICADO_GPTMAKER_MOCK".equals(training.getStatus()),
                    training.getPublishedAt(),
                    training.getCreatedAt()
                ))
                .toList();
        String examplesSummary = examples.isEmpty()
            ? setup.getConversationExamplesSummary()
            : examples.stream()
                .filter(ConversationExampleResponse::includeInTraining)
                .map(item -> "%s: %s".formatted(item.title(), item.objective()))
                .reduce((left, right) -> left + "\n" + right)
                .orElse(null);
        setup.setConversationExamplesSummary(examplesSummary);
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
            setup.getFranchiseWhatsapp(),
            vaviveDefaultContextService.buildForFranchise(franchise),
            examplesSummary,
            localAgent == null ? null : localAgent.getId(),
            localAgent == null ? franchise.getAgentName() : localAgent.getName(),
            setupProgressService.completionPercentage(franchise, setup),
            setupProgressService.setupStatus(franchise, setup),
            setup.getLastPublishedAt(),
            setup.getLastGeneratedTraining(),
            examples,
            recentTrainings
        );
    }

    private FranchiseGptMakerConnectionResponse toGptMakerConnectionResponse(Franchise franchise) {
        String status = resolveAgentConnectionStatus(franchise);
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

    private String resolveAgentConnectionStatus(Franchise franchise) {
        if (franchise.getAgentId() != null && !franchise.getAgentId().isBlank()) {
            return agentRepository.findFirstByFranchiseIdAndExternalId(franchise.getId(), franchise.getAgentId())
                .map(agent -> mapLocalAgentStatusToFranchiseStatus(agent.getStatus()))
                .orElseGet(() -> nonBlank(franchise.getStatus(), franchise.resolvedStatus()));
        }
        return nonBlank(franchise.getStatus(), franchise.resolvedStatus());
    }

    private String mapLocalAgentStatusToFranchiseStatus(String status) {
        if (status == null || status.isBlank()) {
            return "ATIVA";
        }
        return switch (status.toUpperCase()) {
            case "INATIVO", "INATIVA", "INACTIVE" -> "INATIVA";
            case "EM_TREINAMENTO", "TRAINING", "TREINAMENTO" -> "EM_TREINAMENTO";
            default -> "ATIVA";
        };
    }

    private String nonBlank(String value, String fallback) {
        return value != null && !value.isBlank() ? value : fallback;
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

    private GptMakerWorkspaceResponse requireExistingWorkspace(String workspaceId) {
        if (workspaceId == null || workspaceId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Workspace GPTMaker nao informado");
        }
        try {
            return gptMakerClient.listWorkspaces().stream()
                .filter(item -> workspaceId.equals(item.id()))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Workspace GPTMaker nao encontrado"));
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, exception.getMessage());
        }
    }

    private String resolveProvidedWorkspaceName(String workspaceName, GptMakerWorkspaceResponse workspace) {
        if (workspaceName != null && !workspaceName.isBlank()) {
            return workspaceName;
        }
        if (workspace.name() != null && !workspace.name().isBlank()) {
            return workspace.name();
        }
        return workspace.id();
    }

    private void ensureWorkspaceAvailable(String workspaceId, UUID currentFranchiseId) {
        franchiseRepository.findFirstByWorkspaceId(workspaceId)
            .filter(existing -> currentFranchiseId == null || !existing.getId().equals(currentFranchiseId))
            .ifPresent(existing -> {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Esta workspace GPTMaker ja esta vinculada a outra franquia.");
            });
    }

    private void requireCriticalAgentConfirmation(Franchise franchise, String nextAgentReference, Boolean confirmed) {
        boolean hasExistingAgent = franchise.getAgentId() != null && !franchise.getAgentId().isBlank();
        boolean changingAgent = hasExistingAgent
            && nextAgentReference != null
            && !nextAgentReference.isBlank()
            && !Objects.equals(franchise.getAgentId(), nextAgentReference)
            && !Objects.equals(franchise.getAgentName(), nextAgentReference);
        if (changingAgent && !Boolean.TRUE.equals(confirmed)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trocar agente e uma acao critica. Confirme para continuar.");
        }
    }

    private void refreshStatus(Franchise franchise) {
        franchise.setStatus(franchise.resolvedStatus());
    }

    private String mergeJobDescription(String context, String customJobDescription) {
        if (customJobDescription == null || customJobDescription.isBlank()) {
            return context;
        }
        return customJobDescription;
    }

    private String resolveBehavior(String context, String customJobDescription) {
        if (customJobDescription != null && !customJobDescription.isBlank()) {
            return context + "\n\nDescricao complementar da configuracao:\n" + customJobDescription;
        }
        return context;
    }

    private HttpStatus statusForGptMakerException(GptMakerIntegrationException exception) {
        if ("GPTMAKER_AGENT_LIMIT".equals(exception.getErrorCode())
            || "INVALID_WORKSPACE".equals(exception.getErrorCode())
            || "INVALID_AGENT_NAME".equals(exception.getErrorCode())) {
            return HttpStatus.BAD_REQUEST;
        }
        return HttpStatus.BAD_GATEWAY;
    }

    public WorkspaceCreditsResponse getWorkspaceCredits(UUID franchiseId) {
        return workspaceCreditsService.forFranchise(requireAccessibleFranchise(franchiseId));
    }

    public Object getAgentSettings(UUID franchiseId) {
        Franchise franchise = requireFranchise(franchiseId);
        if (franchise.getAgentId() == null || franchise.getAgentId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Franquia sem agente configurado.");
        }
        try {
            return gptMakerClient.getAgentSettings(franchise.getAgentId());
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(statusForGptMakerException(exception), exception.getMessage());
        }
    }

    public Object updateAgentSettings(UUID franchiseId, Object settings) {
        Franchise franchise = requireFranchise(franchiseId);
        if (franchise.getAgentId() == null || franchise.getAgentId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Franquia sem agente configurado.");
        }
        try {
            return gptMakerClient.updateAgentSettings(franchise.getAgentId(), settings);
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(statusForGptMakerException(exception), exception.getMessage());
        }
    }

    public Object getAgentWebhooks(UUID franchiseId) {
        Franchise franchise = requireFranchise(franchiseId);
        if (franchise.getAgentId() == null || franchise.getAgentId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Franquia sem agente configurado.");
        }
        try {
            return gptMakerClient.getAgentWebhooks(franchise.getAgentId());
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(statusForGptMakerException(exception), exception.getMessage());
        }
    }

    public Object updateAgentWebhooks(UUID franchiseId, Object webhooks) {
        Franchise franchise = requireFranchise(franchiseId);
        if (franchise.getAgentId() == null || franchise.getAgentId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Franquia sem agente configurado.");
        }
        try {
            return gptMakerClient.updateAgentWebhooks(franchise.getAgentId(), webhooks);
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(statusForGptMakerException(exception), exception.getMessage());
        }
    }

    public Object updateAgent(UUID franchiseId, Object request) {
        Franchise franchise = requireFranchise(franchiseId);
        if (franchise.getAgentId() == null || franchise.getAgentId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Franquia sem agente configurado.");
        }
        try {
            var result = gptMakerClient.updateAgent(franchise.getAgentId(), request);
            // Update local agent name if provided
            if (request instanceof java.util.Map<?, ?> map) {
                Object name = map.get("name");
                if (name instanceof String nameStr && !nameStr.isBlank()) {
                    franchise.setAgentName(nameStr);
                    franchiseRepository.save(franchise);
                    agentRepository.findFirstByFranchiseIdAndExternalId(franchise.getId(), franchise.getAgentId())
                        .ifPresent(agent -> {
                            agent.setName(nameStr);
                            agentRepository.save(agent);
                        });
                }
            }
            return result;
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(statusForGptMakerException(exception), exception.getMessage());
        }
    }

    public Object listIntentions(UUID franchiseId) {
        Franchise franchise = requireFranchise(franchiseId);
        if (franchise.getAgentId() == null || franchise.getAgentId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Franquia sem agente configurado.");
        }
        try {
            return gptMakerClient.listIntentions(franchise.getAgentId());
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(statusForGptMakerException(exception), exception.getMessage());
        }
    }

    public Object listTrainings(UUID franchiseId) {
        Franchise franchise = requireFranchise(franchiseId);
        if (franchise.getAgentId() == null || franchise.getAgentId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Franquia sem agente configurado.");
        }
        try {
            return gptMakerClient.listTrainings(franchise.getAgentId());
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(statusForGptMakerException(exception), exception.getMessage());
        }
    }

    public Object createTraining(UUID franchiseId, Object training) {
        Franchise franchise = requireFranchise(franchiseId);
        if (franchise.getAgentId() == null || franchise.getAgentId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Franquia sem agente configurado.");
        }
        try {
            return gptMakerClient.sendTrainingObject(franchise.getAgentId(), training);
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(statusForGptMakerException(exception), exception.getMessage());
        }
    }

    public Object updateTraining(UUID franchiseId, String trainingId, Object training) {
        Franchise franchise = requireFranchise(franchiseId);
        if (franchise.getAgentId() == null || franchise.getAgentId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Franquia sem agente configurado.");
        }
        try {
            return gptMakerClient.updateTraining(trainingId, training);
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(statusForGptMakerException(exception), exception.getMessage());
        }
    }

    public Object deleteTraining(UUID franchiseId, String trainingId) {
        Franchise franchise = requireFranchise(franchiseId);
        if (franchise.getAgentId() == null || franchise.getAgentId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Franquia sem agente configurado.");
        }
        try {
            gptMakerClient.deleteTraining(trainingId);
            return java.util.Map.of("success", true);
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(statusForGptMakerException(exception), exception.getMessage());
        }
    }

    public Object createIntention(UUID franchiseId, Object intention) {
        Franchise franchise = requireFranchise(franchiseId);
        if (franchise.getAgentId() == null || franchise.getAgentId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Franquia sem agente configurado.");
        }
        try {
            return gptMakerClient.createIntentionObject(franchise.getAgentId(), intention);
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(statusForGptMakerException(exception), exception.getMessage());
        }
    }

    public Object updateIntention(UUID franchiseId, String intentionId, Object intention) {
        Franchise franchise = requireFranchise(franchiseId);
        if (franchise.getAgentId() == null || franchise.getAgentId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Franquia sem agente configurado.");
        }
        try {
            return gptMakerClient.updateIntention(intentionId, intention);
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(statusForGptMakerException(exception), exception.getMessage());
        }
    }

    public Object deleteIntention(UUID franchiseId, String intentionId) {
        Franchise franchise = requireFranchise(franchiseId);
        if (franchise.getAgentId() == null || franchise.getAgentId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Franquia sem agente configurado.");
        }
        try {
            gptMakerClient.deleteIntention(intentionId);
            return java.util.Map.of("success", true);
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(statusForGptMakerException(exception), exception.getMessage());
        }
    }

    public Object listTransferRules(UUID franchiseId) {
        Franchise franchise = requireFranchise(franchiseId);
        if (franchise.getAgentId() == null || franchise.getAgentId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Franquia sem agente configurado.");
        }
        try {
            return gptMakerClient.listTransferRules(franchise.getAgentId());
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(statusForGptMakerException(exception), exception.getMessage());
        }
    }

    public Object createTransferRule(UUID franchiseId, Object rule) {
        Franchise franchise = requireFranchise(franchiseId);
        if (franchise.getAgentId() == null || franchise.getAgentId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Franquia sem agente configurado.");
        }
        try {
            return gptMakerClient.createTransferRule(franchise.getAgentId(), rule);
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(statusForGptMakerException(exception), exception.getMessage());
        }
    }

    public Object updateTransferRule(UUID franchiseId, String ruleId, Object rule) {
        Franchise franchise = requireFranchise(franchiseId);
        if (franchise.getAgentId() == null || franchise.getAgentId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Franquia sem agente configurado.");
        }
        try {
            return gptMakerClient.updateTransferRule(ruleId, rule);
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(statusForGptMakerException(exception), exception.getMessage());
        }
    }

    public Object deleteTransferRule(UUID franchiseId, String ruleId) {
        Franchise franchise = requireFranchise(franchiseId);
        if (franchise.getAgentId() == null || franchise.getAgentId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Franquia sem agente configurado.");
        }
        try {
            gptMakerClient.deleteTransferRule(ruleId);
            return java.util.Map.of("success", true);
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(statusForGptMakerException(exception), exception.getMessage());
        }
    }

    public Object listIdleActions(UUID franchiseId) {
        Franchise franchise = requireFranchise(franchiseId);
        if (franchise.getAgentId() == null || franchise.getAgentId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Franquia sem agente configurado.");
        }
        try {
            return gptMakerClient.listIdleActions(franchise.getAgentId());
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(statusForGptMakerException(exception), exception.getMessage());
        }
    }

    public Object createIdleAction(UUID franchiseId, Object action) {
        Franchise franchise = requireFranchise(franchiseId);
        if (franchise.getAgentId() == null || franchise.getAgentId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Franquia sem agente configurado.");
        }
        try {
            return gptMakerClient.createIdleAction(franchise.getAgentId(), action);
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(statusForGptMakerException(exception), exception.getMessage());
        }
    }

    public Object updateIdleAction(UUID franchiseId, String actionId, Object action) {
        Franchise franchise = requireFranchise(franchiseId);
        if (franchise.getAgentId() == null || franchise.getAgentId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Franquia sem agente configurado.");
        }
        try {
            return gptMakerClient.updateIdleAction(actionId, action);
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(statusForGptMakerException(exception), exception.getMessage());
        }
    }

    public Object deleteIdleAction(UUID franchiseId, String actionId) {
        Franchise franchise = requireFranchise(franchiseId);
        if (franchise.getAgentId() == null || franchise.getAgentId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Franquia sem agente configurado.");
        }
        try {
            gptMakerClient.deleteIdleAction(actionId);
            return java.util.Map.of("success", true);
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(statusForGptMakerException(exception), exception.getMessage());
        }
    }

    public Object activateAgent(UUID franchiseId) {
        Franchise franchise = requireFranchise(franchiseId);
        if (franchise.getAgentId() == null || franchise.getAgentId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Franquia sem agente configurado.");
        }
        try {
            var result = gptMakerClient.activateAgent(franchise.getAgentId());
            franchise.setStatus("ATIVA");
            franchiseRepository.save(franchise);
            agentRepository.findFirstByFranchiseIdAndExternalId(franchise.getId(), franchise.getAgentId())
                .ifPresent(agent -> {
                    agent.setStatus("ATIVO");
                    agentRepository.save(agent);
                });
            return result;
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(statusForGptMakerException(exception), exception.getMessage());
        }
    }

    public Object inactivateAgent(UUID franchiseId) {
        Franchise franchise = requireFranchise(franchiseId);
        if (franchise.getAgentId() == null || franchise.getAgentId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Franquia sem agente configurado.");
        }
        try {
            var result = gptMakerClient.inactivateAgent(franchise.getAgentId());
            franchise.setStatus("INATIVA");
            franchiseRepository.save(franchise);
            agentRepository.findFirstByFranchiseIdAndExternalId(franchise.getId(), franchise.getAgentId())
                .ifPresent(agent -> {
                    agent.setStatus("INATIVO");
                    agentRepository.save(agent);
                });
            return result;
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(statusForGptMakerException(exception), exception.getMessage());
        }
    }

    public Object updateAgentStatus(UUID franchiseId, Object request) {
        Franchise franchise = requireFranchise(franchiseId);
        if (franchise.getAgentId() == null || franchise.getAgentId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Franquia sem agente configurado.");
        }
        if (!(request instanceof java.util.Map<?, ?> map)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payload invalido para atualizacao de status.");
        }

        Object statusValue = map.get("status");
        if (!(statusValue instanceof String status) || status.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Campo status e obrigatorio.");
        }

        String normalizedStatus = status.trim().toUpperCase();
        return switch (normalizedStatus) {
            case "ATIVA", "ACTIVE" -> activateAgent(franchiseId);
            case "INATIVA", "INACTIVE" -> inactivateAgent(franchiseId);
            case "TRAINING", "EM_TREINAMENTO", "TREINAMENTO" -> updateAgentTrainingStatus(franchise);
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status de agente invalido: " + status);
        };
    }

    private Object updateAgentTrainingStatus(Franchise franchise) {
        try {
            var result = gptMakerClient.updateAgentStatus(franchise.getAgentId(), "TRAINING");
            franchise.setStatus("EM_TREINAMENTO");
            franchise.setGptMakerLastSyncAt(LocalDateTime.now());
            franchiseRepository.save(franchise);
            agentRepository.findFirstByFranchiseIdAndExternalId(franchise.getId(), franchise.getAgentId())
                .ifPresent(agent -> {
                    agent.setStatus("EM_TREINAMENTO");
                    agentRepository.save(agent);
                });
            return java.util.Map.of(
                "status", "EM_TREINAMENTO",
                "agentId", franchise.getAgentId(),
                "agentName", franchise.getAgentName(),
                "syncedAt", franchise.getGptMakerLastSyncAt(),
                "result", result
            );
        } catch (GptMakerIntegrationException exception) {
            throw new ResponseStatusException(statusForGptMakerException(exception), exception.getMessage());
        }
    }

    public Object deleteAgent(UUID franchiseId) {
        Franchise franchise = requireFranchise(franchiseId);
        if (franchise.getAgentId() == null || franchise.getAgentId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Franquia sem agente configurado.");
        }
        // Try to delete from GPTMaker, but don't fail if already gone
        try {
            gptMakerClient.deleteAgent(franchise.getAgentId());
        } catch (GptMakerIntegrationException exception) {
            // Agent might already be deleted in GPTMaker, continue with local cleanup
        }
        // Delete related entities first (trainings, intentions, rules, examples)
        List<GptMakerAgent> agents = agentRepository.findByFranchiseId(franchise.getId());
        for (GptMakerAgent agent : agents) {
            trainingRepository.findByAgentIdOrderByCreatedAtDesc(agent.getId()).forEach(trainingRepository::delete);
            intentRepository.findByAgentId(agent.getId()).forEach(intentRepository::delete);
            ruleRepository.findByAgentId(agent.getId()).forEach(ruleRepository::delete);
            exampleRepository.findByAgentIdOrderByCreatedAtDesc(agent.getId()).forEach(exampleRepository::delete);
        }
        // Now delete the agent entities
        agents.forEach(agentRepository::delete);
        franchise.setAgentId(null);
        franchise.setAgentName(null);
        franchise.setGptMakerLastSyncAt(null);
        franchise.setStatus("SEM_AGENTE");
        franchiseRepository.save(franchise);
        return java.util.Map.of("success", true);
    }

    public Object syncAgentStatus(UUID franchiseId) {
        Franchise franchise = requireFranchise(franchiseId);
        if (franchise.getAgentId() == null || franchise.getAgentId().isBlank()) {
            return java.util.Map.of(
                "status", "SEM_AGENTE",
                "agentId", (String) null,
                "agentName", (String) null
            );
        }
        try {
            // Fetch agent details from GPTMaker
            var agentDetails = gptMakerClient.getAgent(franchise.getAgentId());
            String gptMakerName = agentDetails.has("name") ? agentDetails.get("name").asText(null) : null;
            String gptMakerStatus = agentDetails.has("status") ? agentDetails.get("status").asText(null) : null;
            Boolean gptMakerActive = agentDetails.has("active") ? agentDetails.get("active").asBoolean(false) : null;

            log.info("GPTMaker agent sync: franchiseId={}, agentId={}, name={}, status={}, active={}",
                franchiseId, franchise.getAgentId(), gptMakerName, gptMakerStatus, gptMakerActive);

            // Determine status from GPTMaker response
            String newStatus;
            if (gptMakerStatus != null) {
                newStatus = mapGptMakerStatus(gptMakerStatus);
            } else if (gptMakerActive != null && !gptMakerActive) {
                newStatus = "INATIVA";
            } else if ("INATIVA".equalsIgnoreCase(franchise.getStatus()) || "INATIVO".equalsIgnoreCase(franchise.getStatus())) {
                newStatus = "INATIVA";
            } else if ("EM_TREINAMENTO".equalsIgnoreCase(franchise.getStatus()) || "TRAINING".equalsIgnoreCase(franchise.getStatus())) {
                newStatus = "EM_TREINAMENTO";
            } else {
                // GPTMaker doesn't return status field - try settings endpoint as proxy
                try {
                    gptMakerClient.getAgentSettings(franchise.getAgentId());
                    newStatus = "ATIVA";
                    log.info("GPTMaker agent settings fetched successfully - agent is ACTIVE");
                } catch (Exception settingsEx) {
                    // If settings fail with 403/404, agent might be inactive
                    log.warn("GPTMaker agent settings failed: {} - marking as INATIVA", settingsEx.getMessage());
                    newStatus = "INATIVA";
                }
            }

            // Update local state
            GptMakerAgent localAgent = agentRepository.findFirstByFranchiseIdAndExternalId(franchise.getId(), franchise.getAgentId())
                .orElse(null);
            if (localAgent != null && gptMakerName != null && !gptMakerName.isBlank()) {
                localAgent.setName(gptMakerName);
                localAgent.setStatus(mapStatusToLocal(newStatus));
                agentRepository.save(localAgent);
            }
            if (gptMakerName != null && !gptMakerName.isBlank()) {
                franchise.setAgentName(gptMakerName);
            }
            franchise.setStatus(newStatus);
            franchise.setGptMakerLastSyncAt(LocalDateTime.now());
            franchiseRepository.save(franchise);

            return java.util.Map.of(
                "status", newStatus,
                "agentId", franchise.getAgentId(),
                "agentName", franchise.getAgentName(),
                "syncedAt", franchise.getGptMakerLastSyncAt()
            );
        } catch (GptMakerIntegrationException exception) {
            if (exception.getHttpStatus() != null && exception.getHttpStatus() == 404) {
                log.info("GPTMaker agent not found for franchise {}: marking as INATIVA", franchiseId);
                franchise.setStatus("INATIVA");
                franchiseRepository.save(franchise);
                agentRepository.findFirstByFranchiseIdAndExternalId(franchise.getId(), franchise.getAgentId())
                    .ifPresent(agent -> {
                        agent.setStatus("INATIVO");
                        agentRepository.save(agent);
                    });
                return java.util.Map.of(
                    "status", "INATIVA",
                    "agentId", franchise.getAgentId(),
                    "agentName", franchise.getAgentName(),
                    "message", "Agente nao encontrado no GPTMaker."
                );
            }
            throw new ResponseStatusException(statusForGptMakerException(exception), exception.getMessage());
        }
    }

    private String mapGptMakerStatus(String gptMakerStatus) {
        if (gptMakerStatus == null) return "ATIVA";
        return switch (gptMakerStatus.toUpperCase()) {
            case "ACTIVE", "ATIVO", "ONLINE" -> "ATIVA";
            case "INACTIVE", "INATIVO", "OFFLINE" -> "INATIVA";
            case "TRAINING", "TREINAMENTO", "LEARNING" -> "EM_TREINAMENTO";
            default -> "ATIVA";
        };
    }

    private String mapStatusToLocal(String status) {
        if (status == null) return "ATIVO";
        return switch (status) {
            case "ATIVA" -> "ATIVO";
            case "INATIVA" -> "INATIVO";
            case "EM_TREINAMENTO" -> "EM_TREINAMENTO";
            default -> "ATIVO";
        };
    }

    private Franchise requireFranchise(UUID id) {
        return franchiseRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Franquia nao encontrada."));
    }
}
