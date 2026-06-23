package br.com.vavive.gptmaker.service;

import br.com.vavive.gptmaker.domain.entity.AssistantStandardBlock;
import br.com.vavive.gptmaker.domain.entity.AssistantStandardBlockHistory;
import br.com.vavive.gptmaker.domain.entity.AssistantStandardProfile;
import br.com.vavive.gptmaker.domain.entity.DefaultAgentText;
import br.com.vavive.gptmaker.domain.entity.Franchise;
import br.com.vavive.gptmaker.domain.entity.FranchiseAssistantBlockConfig;
import br.com.vavive.gptmaker.domain.entity.FranchiseSetup;
import br.com.vavive.gptmaker.domain.enums.AssistantBlockMode;
import br.com.vavive.gptmaker.domain.enums.AssistantBlockType;
import br.com.vavive.gptmaker.dto.AssistantBlockResponse;
import br.com.vavive.gptmaker.dto.AssistantStandardProfileResponse;
import br.com.vavive.gptmaker.dto.FranchiseAssistantConfigurationResponse;
import br.com.vavive.gptmaker.dto.UpdateAssistantBlockRequest;
import br.com.vavive.gptmaker.integration.gptmaker.GptMakerClient;
import br.com.vavive.gptmaker.integration.gptmaker.GptMakerClient.GptMakerIntegrationException;
import br.com.vavive.gptmaker.repository.AssistantStandardBlockRepository;
import br.com.vavive.gptmaker.repository.AssistantStandardBlockHistoryRepository;
import br.com.vavive.gptmaker.repository.AssistantStandardProfileRepository;
import br.com.vavive.gptmaker.repository.DefaultAgentTextRepository;
import br.com.vavive.gptmaker.repository.FranchiseAssistantBlockConfigRepository;
import br.com.vavive.gptmaker.repository.FranchiseRepository;
import br.com.vavive.gptmaker.repository.FranchiseSetupRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AssistantStandardProfileService {
    private static final Logger log = LoggerFactory.getLogger(AssistantStandardProfileService.class);
    private final AssistantStandardProfileRepository profileRepository;
    private final AssistantStandardBlockRepository blockRepository;
    private final AssistantStandardBlockHistoryRepository historyRepository;
    private final FranchiseAssistantBlockConfigRepository configRepository;
    private final FranchiseRepository franchiseRepository;
    private final FranchiseSetupRepository franchiseSetupRepository;
    private final DefaultAgentTextRepository defaultAgentTextRepository;
    private final CurrentUserService currentUserService;
    private final GptMakerClient gptMakerClient;
    private final ObjectMapper objectMapper;

    public AssistantStandardProfileService(
        AssistantStandardProfileRepository profileRepository,
        AssistantStandardBlockRepository blockRepository,
        AssistantStandardBlockHistoryRepository historyRepository,
        FranchiseAssistantBlockConfigRepository configRepository,
        FranchiseRepository franchiseRepository,
        FranchiseSetupRepository franchiseSetupRepository,
        DefaultAgentTextRepository defaultAgentTextRepository,
        CurrentUserService currentUserService,
        GptMakerClient gptMakerClient,
        ObjectMapper objectMapper
    ) {
        this.profileRepository = profileRepository;
        this.blockRepository = blockRepository;
        this.historyRepository = historyRepository;
        this.configRepository = configRepository;
        this.franchiseRepository = franchiseRepository;
        this.franchiseSetupRepository = franchiseSetupRepository;
        this.defaultAgentTextRepository = defaultAgentTextRepository;
        this.currentUserService = currentUserService;
        this.gptMakerClient = gptMakerClient;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public AssistantStandardProfileResponse getActiveProfile() {
        currentUserService.requireSuperAdmin("Apenas SUPER_ADMIN pode acessar padroes do Assistente Vavive.");
        AssistantStandardProfile profile = ensureActiveProfile();
        List<AssistantBlockResponse> blocks = resolveProfileBlocks(profile, true).entrySet().stream()
            .sorted(Map.Entry.comparingByKey())
            .map(entry -> toResponse(entry.getKey(), entry.getValue(), AssistantBlockMode.STANDARD, true, true, profile.getVersion(), true))
            .toList();
        return new AssistantStandardProfileResponse(
            profile.getId(),
            profile.getName(),
            profile.isActive(),
            profile.getVersion(),
            profile.getUpdatedAt(),
            blocks
        );
    }

    @Transactional
    public AssistantStandardProfileResponse updateStandardBlock(String blockType, UpdateAssistantBlockRequest request) {
        currentUserService.requireSuperAdmin("Apenas SUPER_ADMIN pode editar padroes do Assistente Vavive.");
        AssistantStandardProfile profile = ensureActiveProfile();
        AssistantBlockType type = parseBlockType(blockType);
        AssistantStandardBlock block = blockRepository.findByProfileAndBlockType(profile, type)
            .orElseGet(() -> new AssistantStandardBlock(profile, type, "{}", profile.getVersion()));

        // Save history before updating
        if (block.getPayloadJson() != null && !block.getPayloadJson().equals("{}")) {
            String changedBy = currentUserService.requireCurrentUser().getName();
            historyRepository.save(new AssistantStandardBlockHistory(block, block.getVersion(), block.getPayloadJson(), changedBy));
        }

        JsonNode validatedPayload = preparePayload(type, requestPayload(type, request.payload()));
        block.setPayloadJson(writeJson(validatedPayload));
        profile.setVersion(profile.getVersion() + 1);
        block.setVersion(profile.getVersion());
        profileRepository.save(profile);
        blockRepository.save(block);
        return buildProfileResponse(profile, true);
    }

    @Transactional(readOnly = true)
    public List<AssistantStandardBlockHistory> getBlockHistory(String blockType) {
        currentUserService.requireSuperAdmin("Apenas SUPER_ADMIN pode acessar historico de padroes.");
        AssistantStandardProfile profile = ensureActiveProfile();
        AssistantBlockType type = parseBlockType(blockType);
        AssistantStandardBlock block = blockRepository.findByProfileAndBlockType(profile, type)
            .orElse(null);
        if (block == null) {
            return List.of();
        }
        return historyRepository.findByBlockIdOrderByVersionDesc(block.getId());
    }

    public AssistantStandardProfileResponse revertBlock(String blockType, int targetVersion) {
        currentUserService.requireSuperAdmin("Apenas SUPER_ADMIN pode reverter padroes do Assistente Vavive.");
        AssistantStandardProfile profile = ensureActiveProfile();
        AssistantBlockType type = parseBlockType(blockType);
        AssistantStandardBlock block = blockRepository.findByProfileAndBlockType(profile, type)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bloco nao encontrado."));

        // Find the history entry for the target version
        List<AssistantStandardBlockHistory> history = historyRepository.findByBlockIdOrderByVersionDesc(block.getId());
        AssistantStandardBlockHistory target = history.stream()
            .filter(h -> h.getVersion() == targetVersion)
            .findFirst()
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Versao nao encontrada no historico."));

        // Save current state as history before reverting
        String changedBy = currentUserService.requireCurrentUser().getName();
        historyRepository.save(new AssistantStandardBlockHistory(block, block.getVersion(), block.getPayloadJson(), changedBy));

        // Revert
        block.setPayloadJson(target.getPayloadJson());
        profile.setVersion(profile.getVersion() + 1);
        block.setVersion(profile.getVersion());
        profileRepository.save(profile);
        blockRepository.save(block);
        return getActiveProfile();
    }

    @Transactional
    public FranchiseAssistantConfigurationResponse getFranchiseConfiguration(UUID franchiseId) {
        Franchise franchise = requireAccessibleFranchise(franchiseId);
        AssistantStandardProfile profile = ensureActiveProfile();
        Map<AssistantBlockType, JsonNode> standardBlocks = resolveProfileBlocks(profile, false);
        Map<AssistantBlockType, FranchiseAssistantBlockConfig> configs = new EnumMap<>(AssistantBlockType.class);
        configRepository.findByFranchiseOrderByBlockTypeAsc(franchise).forEach(config -> configs.put(config.getBlockType(), config));
        List<AssistantBlockResponse> blocks = Arrays.stream(AssistantBlockType.values())
            .sorted(Comparator.naturalOrder())
            .map(type -> {
                FranchiseAssistantBlockConfig config = configs.get(type);
                boolean custom = config != null && config.getMode() == AssistantBlockMode.CUSTOM;
                JsonNode payload = custom
                    ? readJson(config.getCustomPayloadJson(), type)
                    : enrichFranchiseBlock(franchise, type, standardBlocks.getOrDefault(type, defaultPayload(type)));
                int standardVersion = custom && config.getStandardVersionApplied() != null
                    ? config.getStandardVersionApplied()
                    : profile.getVersion();
                return toResponse(type, payload, custom ? AssistantBlockMode.CUSTOM : AssistantBlockMode.STANDARD, !custom, !custom, standardVersion, editableInFranchiseWorkbench(type));
            })
            .toList();
        return new FranchiseAssistantConfigurationResponse(
            franchise.getId(),
            franchise.getName(),
            franchise.getAgentName() != null && !franchise.getAgentName().isBlank() ? franchise.getAgentName() : "Assistente Vavive",
            franchise.getAgentId() != null && !franchise.getAgentId().isBlank(),
            blocks
        );
    }

    @Transactional
    public FranchiseAssistantConfigurationResponse customizeFranchiseBlock(UUID franchiseId, String blockType) {
        Franchise franchise = requireAccessibleFranchise(franchiseId);
        AssistantStandardProfile profile = ensureActiveProfile();
        AssistantBlockType type = parseBlockType(blockType);
        assertEditableForFranchise(type);
        JsonNode payload = preparePayload(type, enrichFranchiseBlock(franchise, type, resolveProfileBlocks(profile, false).getOrDefault(type, defaultPayload(type))));
        FranchiseAssistantBlockConfig config = configRepository.findByFranchiseAndBlockType(franchise, type)
            .orElseGet(() -> new FranchiseAssistantBlockConfig(franchise, type, AssistantBlockMode.CUSTOM));
        config.setMode(AssistantBlockMode.CUSTOM);
        config.setStandardVersionApplied(profile.getVersion());
        config.setCustomPayloadJson(writeJson(payload));
        config.setCustomizedAt(LocalDateTime.now());
        configRepository.save(config);
        return getFranchiseConfiguration(franchiseId);
    }

    @Transactional
    public FranchiseAssistantConfigurationResponse updateFranchiseBlock(UUID franchiseId, String blockType, UpdateAssistantBlockRequest request) {
        Franchise franchise = requireAccessibleFranchise(franchiseId);
        AssistantStandardProfile profile = ensureActiveProfile();
        AssistantBlockType type = parseBlockType(blockType);
        if ("STANDARD".equalsIgnoreCase(request.mode())) {
            FranchiseAssistantBlockConfig config = configRepository.findByFranchiseAndBlockType(franchise, type)
                .orElseGet(() -> new FranchiseAssistantBlockConfig(franchise, type, AssistantBlockMode.STANDARD));
            config.setMode(AssistantBlockMode.STANDARD);
            config.setStandardVersionApplied(profile.getVersion());
            config.setCustomPayloadJson(null);
            config.setCustomizedAt(null);
            configRepository.save(config);
            return getFranchiseConfiguration(franchiseId);
        }
        assertEditableForFranchise(type);
        FranchiseAssistantBlockConfig config = configRepository.findByFranchiseAndBlockType(franchise, type)
            .orElseGet(() -> new FranchiseAssistantBlockConfig(franchise, type, AssistantBlockMode.CUSTOM));
        config.setMode(AssistantBlockMode.CUSTOM);
        config.setStandardVersionApplied(profile.getVersion());
        JsonNode validatedPayload = preparePayload(type, requestPayload(type, request.payload()));
        config.setCustomPayloadJson(writeJson(validatedPayload));
        config.setCustomizedAt(LocalDateTime.now());
        configRepository.save(config);
        syncOperationalBlock(franchise, type, validatedPayload);
        return getFranchiseConfiguration(franchiseId);
    }

    private Franchise requireAccessibleFranchise(UUID franchiseId) {
        Franchise franchise = franchiseRepository.findById(franchiseId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Franquia nao encontrada."));
        var user = currentUserService.requireCurrentUser();
        if (!"SUPER_ADMIN".equals(user.getRole().name()) && (user.getFranchise() == null || !franchise.getId().equals(user.getFranchise().getId()))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "ADMIN_FRANQUIA so pode acessar dados da propria franquia.");
        }
        return franchise;
    }

    private AssistantStandardProfile ensureActiveProfile() {
        return profileRepository.findFirstByActiveTrueOrderByUpdatedAtDesc()
            .orElseGet(this::seedProfile);
    }

    private AssistantStandardProfile seedProfile() {
        AssistantStandardProfile profile = profileRepository.save(new AssistantStandardProfile("Padrao global Assistente Vavive", true, 1));
        Map<AssistantBlockType, JsonNode> defaults = new EnumMap<>(AssistantBlockType.class);
        Arrays.stream(AssistantBlockType.values()).forEach(type -> defaults.put(type, defaultPayload(type)));
        defaults.forEach((type, payload) -> blockRepository.save(new AssistantStandardBlock(profile, type, writeJson(payload), 1)));
        return profile;
    }

    private AssistantStandardProfileResponse buildProfileResponse(AssistantStandardProfile profile, boolean persistMissingBlocks) {
        List<AssistantBlockResponse> blocks = resolveProfileBlocks(profile, persistMissingBlocks).entrySet().stream()
            .sorted(Map.Entry.comparingByKey())
            .map(entry -> toResponse(entry.getKey(), entry.getValue(), AssistantBlockMode.STANDARD, true, true, profile.getVersion(), true))
            .toList();
        return new AssistantStandardProfileResponse(
            profile.getId(),
            profile.getName(),
            profile.isActive(),
            profile.getVersion(),
            profile.getUpdatedAt(),
            blocks
        );
    }

    private Map<AssistantBlockType, JsonNode> resolveProfileBlocks(AssistantStandardProfile profile, boolean persistMissingBlocks) {
        Map<AssistantBlockType, JsonNode> blocks = new EnumMap<>(AssistantBlockType.class);
        blockRepository.findByProfileOrderByBlockTypeAsc(profile).forEach(block -> blocks.put(block.getBlockType(), readJson(block.getPayloadJson(), block.getBlockType())));
        Arrays.stream(AssistantBlockType.values()).forEach(type -> {
            if (blocks.containsKey(type)) {
                return;
            }
            JsonNode payload = defaultPayload(type);
            blocks.put(type, payload);
            if (persistMissingBlocks) {
                blockRepository.save(new AssistantStandardBlock(profile, type, writeJson(payload), profile.getVersion()));
            }
        });
        return blocks;
    }

    private JsonNode defaultPayload(AssistantBlockType type) {
        List<DefaultAgentText> texts = defaultAgentTextRepository.findByActiveTrueOrderByCategoryAscTitleAsc();
        FranchiseSetup exampleSetup = franchiseSetupRepository.findFirstBy().orElse(null);
        return switch (type) {
            case BEHAVIOR -> objectMapper.createObjectNode()
                .put("instruction", joinTexts(texts, "CONTEXTO_VAVIVE", "REGRAS_ATENDIMENTO", "TOM_DE_VOZ"))
                .put("summary", "Comportamento consultivo, claro e orientado a conversao.");
            case ROLE -> objectMapper.createObjectNode()
                .put("jobName", "Assistente Vavive")
                .put("communicationType", "NORMAL")
                .put("type", "SALE")
                .put("jobSite", "https://vavive.com.br")
                .put("description", "Atendimento comercial e operacional da unidade.");
            case BASE_DESCRIPTION -> objectMapper.createObjectNode()
                .put("text", buildBaseDescription(texts, exampleSetup));
            case TRAININGS -> {
                ArrayNode items = objectMapper.createArrayNode();
                addItem(items, "Servicos da unidade", exampleSetup == null ? "" : exampleSetup.getServices());
                addItem(items, "Perguntas frequentes", exampleSetup == null ? "" : exampleSetup.getFaq());
                addItem(items, "Regras da operacao", exampleSetup == null ? "" : exampleSetup.getRules());
                yield objectMapper.createObjectNode().set("items", items);
            }
            case INTENTIONS -> {
                ArrayNode items = objectMapper.createArrayNode();
                items.add(objectMapper.createObjectNode().put("name", "duvida-comercial").put("description", "Perguntas sobre servicos e precos").put("instructions", "Responder com foco comercial e incentivar proximo passo."));
                items.add(objectMapper.createObjectNode().put("name", "agendar-visita").put("description", "Cliente quer orcamento ou visita").put("instructions", "Coletar dados minimos e encaminhar para fechamento."));
                yield objectMapper.createObjectNode().set("items", items);
            }
            case AGENT_SETTINGS -> objectMapper.createObjectNode()
                .put("prefferModel", "GPT_4_O")
                .put("timezone", "America/Sao_Paulo")
                .put("enabledHumanTransfer", true)
                .put("enabledReminder", false)
                .put("splitMessages", false)
                .put("enabledEmoji", false)
                .put("limitSubjects", false)
                .put("messageGroupingTime", "NO_GROUP")
                .putNull("maxDailyMessages")
                .put("signMessages", false);
            case IDLE_ACTIONS, TRANSFER_RULES -> objectMapper.createObjectNode().set("items", objectMapper.createArrayNode());
        };
    }

    private void addItem(ArrayNode items, String title, String content) {
        if (content == null || content.isBlank()) {
            return;
        }
        items.add(objectMapper.createObjectNode().put("title", title).put("content", content));
    }

    private String buildBaseDescription(List<DefaultAgentText> texts, FranchiseSetup exampleSetup) {
        StringBuilder builder = new StringBuilder();
        String global = joinTexts(texts, "CONTEXTO_VAVIVE", "REGRAS_ATENDIMENTO");
        if (!global.isBlank()) {
            builder.append(global);
        }
        if (exampleSetup != null) {
            if (builder.length() > 0) {
                builder.append("\n\n");
            }
            builder.append("Tom de voz:\n").append(nullToEmpty(exampleSetup.getToneOfVoice()));
        }
        return builder.toString().trim();
    }

    private String joinTexts(List<DefaultAgentText> texts, String... categories) {
        return texts.stream()
            .filter(item -> Arrays.stream(categories).anyMatch(category -> category.equals(item.getCategory().name())))
            .map(item -> item.getTitle() + "\n" + item.getContent())
            .reduce((left, right) -> left + "\n\n" + right)
            .orElse("");
    }

    private JsonNode enrichFranchiseBlock(Franchise franchise, AssistantBlockType type, JsonNode payload) {
        JsonNode basePayload = payload == null ? defaultPayload(type) : payload.deepCopy();
        if (!(basePayload instanceof ObjectNode objectNode)) {
            return basePayload;
        }
        FranchiseSetup setup = franchiseSetupRepository.findByFranchiseId(franchise.getId()).orElse(null);
        switch (type) {
            case BEHAVIOR -> objectNode.put("franchiseName", franchise.getName());
            case ROLE -> {
                objectNode.put("jobName", franchise.getName());
                objectNode.put("assistantName", franchise.getAgentName() == null || franchise.getAgentName().isBlank() ? "Assistente Vavive" : franchise.getAgentName());
            }
            case BASE_DESCRIPTION -> {
                if (setup != null) {
                    objectNode.put("franchiseName", franchise.getName());
                    objectNode.put("services", nullToEmpty(setup.getServices()));
                    objectNode.put("faq", nullToEmpty(setup.getFaq()));
                    objectNode.put("rules", nullToEmpty(setup.getRules()));
                }
            }
            case TRAININGS -> objectNode.set("remoteItems", fetchRemote(() -> gptMakerClient.listTrainings(franchise.getAgentId())));
            case INTENTIONS -> objectNode.set("remoteItems", fetchRemote(() -> gptMakerClient.listIntentions(franchise.getAgentId())));
            case AGENT_SETTINGS -> objectNode.set("remoteState", fetchRemote(() -> gptMakerClient.getAgentSettings(franchise.getAgentId())));
            case IDLE_ACTIONS -> objectNode.set("remoteItems", fetchRemote(() -> gptMakerClient.listIdleActions(franchise.getAgentId())));
            case TRANSFER_RULES -> objectNode.set("remoteItems", fetchRemote(() -> gptMakerClient.listTransferRules(franchise.getAgentId())));
        }
        return objectNode;
    }

    private JsonNode preparePayload(AssistantBlockType type, JsonNode payload) {
        JsonNode sanitizedPayload = sanitizePayload(type, payload);
        validatePayload(type, sanitizedPayload);
        return sanitizedPayload;
    }

    private JsonNode sanitizePayload(AssistantBlockType type, JsonNode payload) {
        JsonNode source = payload == null || payload.isNull() ? defaultPayload(type) : payload.deepCopy();
        if (!(source instanceof ObjectNode objectNode)) {
            return source;
        }
        objectNode.remove(List.of("remoteItems", "remoteState"));
        return objectNode;
    }

    private JsonNode requestPayload(AssistantBlockType type, Object payload) {
        return payload == null ? defaultPayload(type) : objectMapper.valueToTree(payload);
    }

    private JsonNode fetchRemote(RemoteSupplier supplier) {
        try {
            return supplier.get();
        } catch (Exception exception) {
            return objectMapper.createObjectNode()
                .put("status", "UNAVAILABLE")
                .put("message", "Nao foi possivel carregar configuracao operacional agora.");
        }
    }

    private void syncOperationalBlock(Franchise franchise, AssistantBlockType type, JsonNode payload) {
        if (franchise.getAgentId() == null || franchise.getAgentId().isBlank() || payload == null) {
            return;
        }
        try {
            if (type == AssistantBlockType.AGENT_SETTINGS) {
                gptMakerClient.updateAgentSettings(franchise.getAgentId(), payload);
            }
        } catch (GptMakerIntegrationException exception) {
            log.warn("Falha ao sincronizar bloco {} com GPTMaker para franquia {}. Erro: {}", type, franchise.getId(), exception.getMessage());
        }
    }

    private AssistantBlockResponse toResponse(
        AssistantBlockType type,
        JsonNode payload,
        AssistantBlockMode mode,
        boolean locked,
        boolean inherited,
        int standardVersion,
        boolean editable
    ) {
        return new AssistantBlockResponse(
            type.name(),
            titleFor(type),
            descriptionFor(type),
            mode.name(),
            locked,
            inherited,
            standardVersion,
            objectMapper.convertValue(payload, Object.class),
            editable,
            syncStatusFor(type),
            syncMessageFor(type)
        );
    }

    private void assertEditableForFranchise(AssistantBlockType type) {
        if (!editableInFranchiseWorkbench(type)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Este bloco esta disponivel apenas em leitura nesta fase.");
        }
    }

    private boolean editableInFranchiseWorkbench(AssistantBlockType type) {
        return switch (type) {
            case BEHAVIOR, ROLE, BASE_DESCRIPTION, TRAININGS, INTENTIONS, AGENT_SETTINGS -> true;
            case IDLE_ACTIONS, TRANSFER_RULES -> false;
        };
    }

    private String syncStatusFor(AssistantBlockType type) {
        return switch (type) {
            case AGENT_SETTINGS -> "REMOTE_SYNC";
            case BEHAVIOR, ROLE, BASE_DESCRIPTION, TRAININGS, INTENTIONS -> "LOCAL_BLUEPRINT";
            case IDLE_ACTIONS, TRANSFER_RULES -> "READ_ONLY_REFERENCE";
        };
    }

    private String syncMessageFor(AssistantBlockType type) {
        return switch (type) {
            case AGENT_SETTINGS -> "Salvar este bloco atualiza o assistente real da unidade.";
            case BEHAVIOR, ROLE, BASE_DESCRIPTION, TRAININGS, INTENTIONS ->
                "Salvar este bloco ajusta a configuracao local da unidade, sem reprovisionar o assistente automaticamente.";
            case IDLE_ACTIONS, TRANSFER_RULES ->
                "Bloco exibido em modo leitura nesta fase. Edicao remota ainda nao esta disponivel.";
        };
    }

    private AssistantBlockType parseBlockType(String value) {
        try {
            return AssistantBlockType.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bloco do assistente invalido.");
        }
    }

    private String titleFor(AssistantBlockType type) {
        return switch (type) {
            case BEHAVIOR -> "Comportamento";
            case ROLE -> "Tipo de trabalho";
            case BASE_DESCRIPTION -> "Descricao base";
            case TRAININGS -> "Treinamentos";
            case INTENTIONS -> "Intencoes";
            case AGENT_SETTINGS -> "Configuracoes do assistente";
            case IDLE_ACTIONS -> "Acoes de inatividade";
            case TRANSFER_RULES -> "Regras de transferencia";
        };
    }

    private String descriptionFor(AssistantBlockType type) {
        return switch (type) {
            case BEHAVIOR -> "Diretrizes de comportamento e tom do Assistente Vavive.";
            case ROLE -> "Papel comercial ou operacional do assistente.";
            case BASE_DESCRIPTION -> "Base de contexto usada para montar o assistente.";
            case TRAININGS -> "Biblioteca padrao de treinamentos e itens remotos.";
            case INTENTIONS -> "Classificacoes de pedido e resposta orientada.";
            case AGENT_SETTINGS -> "Modelo, limites e politicas operacionais.";
            case IDLE_ACTIONS -> "Acionadores para inatividade e retomada.";
            case TRANSFER_RULES -> "Regras de transferencia para atendimento humano.";
        };
    }

    private JsonNode readJson(String raw, AssistantBlockType type) {
        if (raw == null || raw.isBlank()) {
            return defaultPayload(type);
        }
        try {
            return objectMapper.readTree(raw);
        } catch (Exception exception) {
            return defaultPayload(type);
        }
    }

    private String writeJson(JsonNode payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payload do bloco invalido.");
        }
    }

    private void validatePayload(AssistantBlockType type, JsonNode payload) {
        ObjectNode objectNode = requireObject(payload, "Payload do bloco deve ser um objeto JSON.");
        switch (type) {
            case BEHAVIOR -> {
                requireText(objectNode, "instruction");
                optionalText(objectNode, "summary");
            }
            case ROLE -> {
                requireText(objectNode, "jobName");
                requireText(objectNode, "communicationType");
                requireText(objectNode, "type");
                optionalText(objectNode, "jobSite");
                optionalText(objectNode, "description");
                optionalText(objectNode, "assistantName");
            }
            case BASE_DESCRIPTION -> requireText(objectNode, "text");
            case TRAININGS -> validateItems(objectNode, "items", List.of("title", "content"));
            case INTENTIONS -> validateItems(objectNode, "items", List.of("name", "description", "instructions"));
            case AGENT_SETTINGS -> {
                requireText(objectNode, "prefferModel");
                requireText(objectNode, "timezone");
                requireBoolean(objectNode, "enabledHumanTransfer");
                requireBoolean(objectNode, "enabledReminder");
                requireBoolean(objectNode, "splitMessages");
                requireBoolean(objectNode, "enabledEmoji");
                requireBoolean(objectNode, "limitSubjects");
                requireBoolean(objectNode, "signMessages");
                requireText(objectNode, "messageGroupingTime");
            }
            case IDLE_ACTIONS, TRANSFER_RULES -> validateItems(objectNode, "items", List.of());
        }
    }

    private ObjectNode requireObject(JsonNode payload, String message) {
        if (payload instanceof ObjectNode objectNode) {
            return objectNode;
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    private void validateItems(ObjectNode objectNode, String field, List<String> requiredFields) {
        JsonNode itemsNode = objectNode.get(field);
        if (!(itemsNode instanceof ArrayNode arrayNode)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Campo '" + field + "' deve ser uma lista.");
        }
        for (JsonNode item : arrayNode) {
            ObjectNode itemObject = requireObject(item, "Cada item de '" + field + "' deve ser um objeto JSON.");
            for (String requiredField : requiredFields) {
                requireText(itemObject, requiredField);
            }
        }
    }

    private void requireText(ObjectNode objectNode, String field) {
        JsonNode value = objectNode.get(field);
        if (value == null || !value.isTextual() || value.asText().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Campo '" + field + "' e obrigatorio.");
        }
    }

    private void optionalText(ObjectNode objectNode, String field) {
        JsonNode value = objectNode.get(field);
        if (value != null && !value.isNull() && !value.isTextual()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Campo '" + field + "' deve ser texto.");
        }
    }

    private void requireBoolean(ObjectNode objectNode, String field) {
        JsonNode value = objectNode.get(field);
        if (value == null || !value.isBoolean()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Campo '" + field + "' deve ser booleano.");
        }
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    @FunctionalInterface
    private interface RemoteSupplier {
        JsonNode get();
    }
}
