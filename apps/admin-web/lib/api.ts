"use client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export type ApiError = Error & {
  status?: number;
};

export type FranchiseSummary = {
  id: string;
  name: string;
  document?: string | null;
  city: string;
  state: string;
  status: string;
  workspaceId?: string | null;
  workspaceName?: string | null;
  agentId?: string | null;
  agentName?: string | null;
  workspaceCredits?: WorkspaceCredits | null;
  gptMakerLastSyncAt?: string | null;
  createdAt?: string;
};

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN_FRANQUIA";
  franchise?: FranchiseSummary | null;
};

export type LoginResponse = {
  token: string;
  user: UserProfile;
};

export type DashboardSummary = {
  totalLeads: number;
  newLeads: number;
  activeLeads: number;
  finishedChats: number;
  conversionRate: number;
  setupStatus: string;
  completionPercentage: number;
  lastPublicationAt?: string | null;
  lastTrainingTitle?: string | null;
  blockedFranchises: number;
  franchisesWithoutAgent: number;
  franchisesReadyToPublish: number;
  waitingHumanConversations: number;
  syncedChannels: number;
  lastNetworkActionAt?: string | null;
  workspaceCredits?: WorkspaceCredits | null;
};

export type WorkspaceCredits = {
  franchiseId?: string;
  status: "AVAILABLE" | "UNAVAILABLE" | "NO_WORKSPACE" | "STALE";
  credits: number;
  used: number;
  remaining: number;
  message?: string | null;
  checkedAt?: string | null;
};

export type LeadSummary = {
  id: string;
  name: string;
  phone: string;
  service: string;
  source: string;
  status: string;
  franchiseName: string;
  agentName?: string | null;
  createdAt: string;
};

export type AgentSummary = {
  id: string;
  franchiseId: string;
  name: string;
  avatar?: string | null;
  status: string;
  toneOfVoice: string;
  franchiseName: string;
  createdAt: string;
};

export type CreateFranchisePayload = {
  name: string;
  document?: string;
  city: string;
  state: string;
  workspaceId?: string;
  workspaceName?: string;
};

export type CreateFullFranchisePayload = {
  franchise: {
    name: string;
    document?: string;
    city: string;
    state: string;
    workspaceId?: string;
    workspaceName?: string;
  };
  adminUser: {
    name: string;
    email: string;
    password: string;
  };
};

export type CreateFullFranchiseResult = {
  franchise: FranchiseSummary;
  adminUser: FranchiseAdminUser;
};

export type FranchiseSetup = {
  franchiseId: string;
  franchiseName: string;
  document?: string | null;
  city: string;
  state: string;
  responsibleName?: string | null;
  services?: string | null;
  prices?: string | null;
  regions?: string | null;
  schedules?: string | null;
  faq?: string | null;
  rules?: string | null;
  toneOfVoice?: string | null;
  franchiseWhatsapp?: string | null;
  defaultContext?: string | null;
  conversationExamplesSummary?: string | null;
  agentId?: string | null;
  agentName?: string | null;
  completionPercentage: number;
  setupStatus: string;
  lastPublishedAt?: string | null;
  lastGeneratedTraining?: string | null;
  examples: ConversationExample[];
  recentTrainings: TrainingSummary[];
};

export type UpdateFranchiseSetupPayload = {
  franchiseName?: string;
  document?: string;
  city?: string;
  state?: string;
  responsibleName?: string;
  services?: string;
  prices?: string;
  regions?: string;
  schedules?: string;
  faq?: string;
  rules?: string;
  toneOfVoice?: string;
  franchiseWhatsapp?: string;
};

export type PublishAgentResult = {
  franchiseId: string;
  agentId: string;
  trainingId: string;
  success: boolean;
  status: string;
  message: string;
  publishedAt?: string | null;
  details?: string | null;
};

export type GptMakerDiagnostics = {
  baseUrl: string;
  tokenConfigured: boolean;
  status: "CONNECTED" | "MISSING_TOKEN" | "ERROR" | "MOCK";
  workspaceCount: number;
  message: string;
  details?: string | null;
};

export type TrainingSummary = {
  id: string;
  title: string;
  content: string;
  status: string;
  message?: string | null;
  contentSummary?: string | null;
  publishedAt?: string | null;
  createdAt: string;
};

export type GptMakerWorkspaceOption = {
  id: string;
  name: string;
};

export type GptMakerAgentOption = {
  id: string;
  name: string;
  behavior?: string | null;
  avatar?: string | null;
  communicationType?: string | null;
  type?: string | null;
  jobName?: string | null;
  jobSite?: string | null;
  jobDescription?: string | null;
};

export type FranchiseGptMakerConnection = {
  franchiseId: string;
  franchiseName: string;
  workspaceId?: string | null;
  workspaceName?: string | null;
  agentId?: string | null;
  agentName?: string | null;
  status: string;
  lastSyncAt?: string | null;
};

export type WorkspaceMappingLinked = {
  workspaceId: string;
  workspaceName?: string | null;
  franchiseId: string;
  franchiseName: string;
  agentId?: string | null;
  agentName?: string | null;
};

export type WorkspaceMappingUnlinkedWorkspace = {
  workspaceId: string;
  workspaceName?: string | null;
};

export type WorkspaceMappingFranchiseWithoutWorkspace = {
  franchiseId: string;
  franchiseName: string;
  city: string;
  state: string;
};

export type WorkspaceMapping = {
  linked: WorkspaceMappingLinked[];
  unlinkedWorkspaces: WorkspaceMappingUnlinkedWorkspace[];
  franchisesWithoutWorkspace: WorkspaceMappingFranchiseWithoutWorkspace[];
};

export type FranchiseAdminUser = {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN_FRANQUIA";
  franchise?: FranchiseSummary | null;
};

export type CreateFranchiseAdminUserPayload = {
  name: string;
  email: string;
  password: string;
};

export type VaviveDefaultContext = {
  franchiseId: string;
  franchiseName: string;
  context: string;
};

export type ProvisionFranchiseGptMakerAgentPayload = {
  workspaceId: string;
  workspaceName?: string;
  agentName: string;
  avatar?: string;
  communicationType: "FORMAL" | "NORMAL" | "RELAXED";
  type: "SUPPORT" | "SALE" | "PERSONAL";
  confirmCriticalChange?: boolean;
  jobName?: string;
  jobSite?: string;
  jobDescription?: string;
};

export type DefaultAgentTextCategory =
  | "CONTEXTO_VAVIVE"
  | "REGRAS_ATENDIMENTO"
  | "TOM_DE_VOZ"
  | "SERVICOS"
  | "FAQ"
  | "RESTRICOES";

export type DefaultAgentText = {
  id: string;
  title: string;
  category: DefaultAgentTextCategory;
  content: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type DefaultAgentTextPayload = {
  title: string;
  category: DefaultAgentTextCategory;
  content: string;
  active?: boolean;
};

export type AssistantBlockType =
  | "BEHAVIOR"
  | "ROLE"
  | "BASE_DESCRIPTION"
  | "TRAININGS"
  | "INTENTIONS"
  | "AGENT_SETTINGS"
  | "IDLE_ACTIONS"
  | "TRANSFER_RULES";

export type AssistantBlock = {
  blockType: AssistantBlockType;
  title: string;
  description: string;
  mode: "STANDARD" | "CUSTOM";
  locked: boolean;
  inherited: boolean;
  standardVersion: number;
  payload: Record<string, unknown>;
  editable: boolean;
  syncStatus: "REMOTE_SYNC" | "LOCAL_BLUEPRINT" | "READ_ONLY_REFERENCE";
  syncMessage: string;
};

export type AssistantStandardProfile = {
  id: string;
  name: string;
  active: boolean;
  version: number;
  updatedAt?: string | null;
  blocks: AssistantBlock[];
};

export type FranchiseAssistantConfiguration = {
  franchiseId: string;
  franchiseName: string;
  assistantName: string;
  assistantConfigured: boolean;
  blocks: AssistantBlock[];
};

export type ConversationSummary = {
  id: string;
  franchiseId: string;
  franchiseName: string;
  agentName?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  firstPrompt?: string | null;
  lastResponse?: string | null;
  channelType?: string | null;
  operationalStatus: string;
  responsibleUserName?: string | null;
  syncStatus?: string | null;
  closedReason?: string | null;
  saleOutcome?: string | null;
  handoffStatus?: string | null;
  humanTakeoverActive: boolean;
  lastMessageAt?: string | null;
  lastSyncedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ConversationMessage = {
  id: string;
  role?: string | null;
  type?: string | null;
  text?: string | null;
  userName?: string | null;
  userPicture?: string | null;
  imageUrl?: string | null;
  audioUrl?: string | null;
  documentUrl?: string | null;
  fileName?: string | null;
  mediaContent?: string | null;
  time?: number | null;
  width?: number | null;
  height?: number | null;
};

export type StartHumanTakeoverResult = {
  conversationId: string;
  success: boolean;
  message: string;
};

export type ConversationActionResult = {
  conversationId: string;
  success: boolean;
  status: string;
  message: string;
  processedAt: string;
};

export type ConversationCompletePayload = {
  outcome: string;
  closedReason: string;
  saleSummary?: string;
};

export type ConversationManualMessagePayload = {
  message: string;
  replyMessageId?: string;
};

export type ConversationHandoffEvent = {
  id: string;
  outcome: string;
  deliveryStatus: string;
  responsibleUserName?: string | null;
  recipientPhone?: string | null;
  summary?: string | null;
  deliveryError?: string | null;
  sentAt?: string | null;
};

export type FranchiseChannel = {
  id: string;
  externalChannelId?: string | null;
  name: string;
  channelType: string;
  connected: boolean;
  agentName?: string | null;
  externalUsername?: string | null;
  lastSyncedAt?: string | null;
  lastSyncError?: string | null;
};

export type ConversationExample = {
  id: string;
  title: string;
  objective?: string | null;
  messages: string;
  status: string;
  includeInTraining: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ConversationExamplePayload = {
  title: string;
  objective?: string;
  messages: string;
  status?: string;
  includeInTraining?: boolean;
};

export type TestAgentConversationPayload = {
  franchiseId?: string;
  prompt: string;
  contextId: string;
  customerName?: string;
  phone?: string;
  chatPicture?: string;
};

export type TestAgentConversationResult = {
  conversationId: string;
  franchiseId: string;
  franchiseName: string;
  agentName?: string | null;
  message?: string | null;
};

function getStoredToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem("vavive_token");
}

async function parseError(response: Response): Promise<ApiError> {
  let message = "Nao foi possivel concluir a solicitacao.";
  try {
    const body = await response.json();
    if (typeof body?.message === "string" && body.message.trim()) {
      message = body.message;
    } else if (typeof body?.error === "string" && body.error.trim()) {
      message = body.error;
    }
  } catch {
    if (response.status === 401) {
      message = "Sessao invalida ou expirada. Entre novamente.";
    } else if (response.status === 403) {
      message = "Voce nao tem permissao para acessar este recurso.";
    } else if (response.status >= 500) {
      message = "O backend da Vavive nao respondeu corretamente.";
    }
  }

  const error = new Error(message) as ApiError;
  error.status = response.status;
  return error;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = getStoredToken();

  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers
  });

  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      window.localStorage.removeItem("vavive_token");
      window.localStorage.removeItem("vavive_user");
      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    }
    throw await parseError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  const contentLength = response.headers.get("content-length");
  if (contentLength === "0") {
    return undefined as T;
  }
  try {
    return await response.json() as T;
  } catch {
    return undefined as T;
  }
}

export function login(email: string, password: string) {
  return apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}

export function getMe() {
  return apiFetch<UserProfile>("/me");
}

export function getDashboardSummary() {
  return apiFetch<DashboardSummary>("/dashboard/summary");
}

export function getFranchises() {
  return apiFetch<FranchiseSummary[]>("/franchises");
}

export function getFranchiseById(id: string) {
  return apiFetch<FranchiseSummary>(`/franchises/${id}`);
}

export function createFranchise(payload: CreateFranchisePayload) {
  return apiFetch<FranchiseSummary>("/franchises", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function createFullFranchise(payload: CreateFullFranchisePayload) {
  return apiFetch<CreateFullFranchiseResult>("/franchises/full", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getLeads() {
  return apiFetch<LeadSummary[]>("/leads");
}

export function getAgents() {
  return apiFetch<AgentSummary[]>("/agents");
}

export function getAgent(id: string) {
  return apiFetch<AgentSummary>(`/agents/${id}`);
}

export function getFranchiseSetup(id: string) {
  return apiFetch<FranchiseSetup>(`/franchises/${id}/setup`);
}

export function saveFranchiseSetup(id: string, payload: UpdateFranchiseSetupPayload) {
  return apiFetch<FranchiseSetup>(`/franchises/${id}/setup`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function publishFranchiseAgent(id: string) {
  return apiFetch<PublishAgentResult>(`/franchises/${id}/publish-agent`, {
    method: "POST"
  });
}

export function getAgentTrainings(id: string) {
  return apiFetch<TrainingSummary[]>(`/agents/${id}/trainings`);
}

export function createAgentTraining(id: string, payload: { title: string; content: string }) {
  return apiFetch<TrainingSummary>(`/agents/${id}/trainings`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getFranchiseGptMakerConnection(id: string) {
  return apiFetch<FranchiseGptMakerConnection>(`/franchises/${id}/gptmaker-connection`);
}

export function getFranchiseAdminUser(id: string) {
  return apiFetch<FranchiseAdminUser>(`/franchises/${id}/admin-user`);
}

export function createFranchiseAdminUser(id: string, payload: CreateFranchiseAdminUserPayload) {
  return apiFetch<FranchiseAdminUser>(`/franchises/${id}/admin-user`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getFranchiseDefaultContext(id: string) {
  return apiFetch<VaviveDefaultContext>(`/franchises/${id}/gptmaker/default-context`);
}

export function provisionFranchiseGptMakerAgent(id: string, payload: ProvisionFranchiseGptMakerAgentPayload) {
  return apiFetch<FranchiseGptMakerConnection>(`/franchises/${id}/gptmaker/agent`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function linkFranchiseWorkspace(id: string, payload: { workspaceId: string; workspaceName?: string; confirmCriticalChange?: boolean }) {
  return apiFetch<FranchiseGptMakerConnection>(`/franchises/${id}/gptmaker/workspace`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function unlinkFranchiseWorkspace(id: string, payload: { confirmCriticalChange: boolean }) {
  return apiFetch<FranchiseGptMakerConnection>(`/franchises/${id}/gptmaker/workspace`, {
    method: "DELETE",
    body: JSON.stringify(payload)
  });
}

export function clearFranchiseAgent(id: string, payload: { confirmCriticalChange: boolean }) {
  return apiFetch<FranchiseGptMakerConnection>(`/franchises/${id}/gptmaker/agent`, {
    method: "DELETE",
    body: JSON.stringify(payload)
  });
}

export function updateFranchiseGptMakerConnection(id: string, payload: { workspaceId: string; agentId: string; confirmCriticalChange?: boolean }) {
  return apiFetch<FranchiseGptMakerConnection>(`/franchises/${id}/gptmaker-connection`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getGptMakerWorkspaces() {
  return apiFetch<GptMakerWorkspaceOption[]>("/franchises/gptmaker/workspaces");
}

export function getAvailableGptMakerWorkspaces() {
  return apiFetch<GptMakerWorkspaceOption[]>("/franchises/gptmaker/available-workspaces");
}

export function getGptMakerWorkspaceAgents(workspaceId: string) {
  return apiFetch<GptMakerAgentOption[]>(`/franchises/gptmaker/workspaces/${workspaceId}/agents`);
}

export function getWorkspaceMapping() {
  return apiFetch<WorkspaceMapping>("/franchises/gptmaker/workspace-mapping");
}

export function getDefaultAgentTexts() {
  return apiFetch<DefaultAgentText[]>("/default-agent-texts");
}

export function createDefaultAgentText(payload: DefaultAgentTextPayload) {
  return apiFetch<DefaultAgentText>("/default-agent-texts", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateDefaultAgentText(id: string, payload: DefaultAgentTextPayload) {
  return apiFetch<DefaultAgentText>(`/default-agent-texts/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function toggleDefaultAgentText(id: string) {
  return apiFetch<DefaultAgentText>(`/default-agent-texts/${id}/toggle`, {
    method: "PATCH"
  });
}

export function getAssistantStandardProfile() {
  return apiFetch<AssistantStandardProfile>("/assistant-standards/profile");
}

export function updateAssistantStandardBlock(blockType: AssistantBlockType, payload: Record<string, unknown>) {
  return apiFetch<AssistantStandardProfile>(`/assistant-standards/profile/blocks/${blockType}`, {
    method: "POST",
    body: JSON.stringify({ payload })
  });
}

export function getFranchiseAssistantConfiguration(id: string) {
  return apiFetch<FranchiseAssistantConfiguration>(`/franchises/${id}/assistant-configuration`);
}

export function customizeFranchiseAssistantBlock(id: string, blockType: AssistantBlockType) {
  return apiFetch<FranchiseAssistantConfiguration>(`/franchises/${id}/assistant-configuration/blocks/${blockType}/customize`, {
    method: "POST"
  });
}

export function updateFranchiseAssistantBlock(
  id: string,
  blockType: AssistantBlockType,
  mode: "STANDARD" | "CUSTOM",
  payload?: Record<string, unknown>
) {
  return apiFetch<FranchiseAssistantConfiguration>(`/franchises/${id}/assistant-configuration/blocks/${blockType}`, {
    method: "POST",
    body: JSON.stringify({ mode, payload })
  });
}

export function getConversations(filters: { franchiseId?: string; status?: string; channel?: string; responsible?: string } = {}) {
  const params = new URLSearchParams();
  if (filters.franchiseId) params.set("franchiseId", filters.franchiseId);
  if (filters.status) params.set("status", filters.status);
  if (filters.channel) params.set("channel", filters.channel);
  if (filters.responsible) params.set("responsible", filters.responsible);
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return apiFetch<ConversationSummary[]>(`/conversations${suffix}`);
}

export function getConversationMessages(id: string) {
  return apiFetch<ConversationMessage[]>(`/conversations/${id}/messages`);
}

export function startHumanTakeover(id: string) {
  return apiFetch<StartHumanTakeoverResult>(`/conversations/${id}/start-human`, {
    method: "PUT"
  });
}

export function stopHumanTakeover(id: string) {
  return apiFetch<ConversationActionResult>(`/conversations/${id}/stop-human`, {
    method: "PUT"
  });
}

export function sendConversationManualMessage(id: string, payload: ConversationManualMessagePayload) {
  return apiFetch<ConversationActionResult>(`/conversations/${id}/messages`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function completeConversation(id: string, payload: ConversationCompletePayload) {
  return apiFetch<ConversationActionResult>(`/conversations/${id}/complete`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getConversationHandoffs(id: string) {
  return apiFetch<ConversationHandoffEvent[]>(`/conversations/${id}/handoffs`);
}

export function testAgentConversation(payload: Omit<TestAgentConversationPayload, "contextId"> & { contextId?: string }) {
  return apiFetch<TestAgentConversationResult>("/conversations/test-agent", {
    method: "POST",
    body: JSON.stringify({
      ...payload,
      contextId: payload.contextId || `ctx-${crypto.randomUUID()}`
    })
  });
}

export function getFranchiseChannels(id: string) {
  return apiFetch<FranchiseChannel[]>(`/franchises/${id}/channels`);
}

export function syncFranchiseChannels(id: string) {
  return apiFetch<FranchiseChannel[]>(`/franchises/${id}/channels/sync`, {
    method: "POST"
  });
}

export function getConversationExamples(agentId: string) {
  return apiFetch<ConversationExample[]>(`/agents/${agentId}/conversation-examples`);
}

export function createConversationExample(agentId: string, payload: ConversationExamplePayload) {
  return apiFetch<ConversationExample>(`/agents/${agentId}/conversation-examples`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateConversationExample(agentId: string, exampleId: string, payload: ConversationExamplePayload) {
  return apiFetch<ConversationExample>(`/agents/${agentId}/conversation-examples/${exampleId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function getWorkspaceCredits(franchiseId: string) {
  return apiFetch<WorkspaceCredits>(`/franchises/${franchiseId}/credits`);
}

const DEFAULT_AGENT_SETTINGS: Record<string, unknown> = {
  prefferModel: "GPT_4_O",
  timezone: "America/Sao_Paulo",
  enabledHumanTransfer: false,
  enabledReminder: false,
  splitMessages: false,
  enabledEmoji: false,
  limitSubjects: false,
  signMessages: false,
  messageGroupingTime: "NO_GROUP",
};

export async function getAgentSettings(franchiseId: string): Promise<Record<string, unknown>> {
  const remote = await apiFetch<Record<string, unknown>>(`/franchises/${franchiseId}/gptmaker/agent-settings`);
  return { ...DEFAULT_AGENT_SETTINGS, ...remote };
}

export function updateAgentSettings(franchiseId: string, settings: Record<string, unknown>) {
  const merged = { ...DEFAULT_AGENT_SETTINGS, ...settings };
  return apiFetch<{ success: boolean }>(`/franchises/${franchiseId}/gptmaker/agent-settings`, {
    method: "POST",
    body: JSON.stringify(merged)
  });
}

export function getAgentWebhooks(franchiseId: string) {
  return apiFetch<Record<string, unknown>>(`/franchises/${franchiseId}/gptmaker/agent-webhooks`);
}

export function updateAgentWebhooks(franchiseId: string, webhooks: Record<string, unknown>) {
  return apiFetch<{ success: boolean }>(`/franchises/${franchiseId}/gptmaker/agent-webhooks`, {
    method: "POST",
    body: JSON.stringify(webhooks)
  });
}

export type GptMakerIntention = {
  id: string;
  description: string;
  type: string;
  instructions: string;
  details?: string;
  active: boolean;
};

export function getGptMakerIntentions(franchiseId: string) {
  return apiFetch<GptMakerIntention[]>(`/franchises/${franchiseId}/gptmaker/intentions`);
}

export function createGptMakerIntention(franchiseId: string, payload: { name: string; description: string; instructions: string }) {
  return apiFetch<GptMakerIntention>(`/franchises/${franchiseId}/gptmaker/intentions`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getGptMakerTrainings(franchiseId: string) {
  return apiFetch<unknown[]>(`/franchises/${franchiseId}/gptmaker/trainings`);
}

export function deleteGptMakerTraining(franchiseId: string, trainingId: string) {
  return apiFetch<{ success: boolean }>(`/franchises/${franchiseId}/gptmaker/trainings/${trainingId}`, {
    method: "DELETE"
  });
}

export function getTransferRules(franchiseId: string) {
  return apiFetch<unknown[]>(`/franchises/${franchiseId}/gptmaker/transfer-rules`);
}

export function getIdleActions(franchiseId: string) {
  return apiFetch<unknown[]>(`/franchises/${franchiseId}/gptmaker/idle-actions`);
}

export function createFranchiseChannel(franchiseId: string, name: string, type: string) {
  return apiFetch<FranchiseChannel>(`/franchises/${franchiseId}/channels`, {
    method: "POST",
    body: JSON.stringify({ name, type })
  });
}

export type ChannelQRCodeResponse = {
  value?: string;
  connected?: boolean;
};

export function getChannelQRCode(franchiseId: string, channelId: string) {
  return apiFetch<ChannelQRCodeResponse>(`/franchises/${franchiseId}/channels/${channelId}/qr-code`);
}

export function updateFranchiseChannel(franchiseId: string, channelId: string, payload: { name?: string; agentId?: string }) {
  return apiFetch<FranchiseChannel>(`/franchises/${franchiseId}/channels/${channelId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function deleteFranchiseChannel(franchiseId: string, channelId: string) {
  return apiFetch<{ success: boolean }>(`/franchises/${franchiseId}/channels/${channelId}`, {
    method: "DELETE"
  });
}
