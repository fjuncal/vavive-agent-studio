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
  externalId: string;
  name: string;
  status: string;
  toneOfVoice: string;
  franchiseName: string;
  connectedToRealGptMaker: boolean;
  connectionStatus: string;
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
  completionPercentage: number;
  setupStatus: string;
  lastPublishedAt?: string | null;
  lastGeneratedTraining?: string | null;
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
};

export type PublishAgentResult = {
  franchiseId: string;
  agentId: string;
  trainingId: string;
  success: boolean;
  status: string;
  externalReference?: string | null;
  message: string;
  publishedAt?: string | null;
  mockEnabled: boolean;
  errorCode?: string | null;
  details?: string | null;
};

export type GptMakerHealth = {
  baseUrl: string;
  mockEnabled: boolean;
  tokenConfigured: boolean;
  status: "MOCK" | "READY" | "MISSING_TOKEN";
  message: string;
};

export type GptMakerDiagnostics = {
  baseUrl: string;
  mockEnabled: boolean;
  tokenConfigured: boolean;
  status: "CONNECTED" | "MISSING_TOKEN" | "ERROR" | "MOCK";
  workspaceCount: number;
  message: string;
  details?: string | null;
  httpStatus?: number | null;
  errorCode?: string | null;
  endpoint?: string | null;
  responsePreview?: string | null;
};

export type GptMakerAgentDiagnostics = {
  workspaceId: string;
  endpoint: string;
  httpStatus?: number | null;
  status: "CONNECTED" | "ERROR" | "MISSING_TOKEN" | "MOCK";
  agentCount: number;
  agentNames: string[];
  message: string;
  errorCode?: string | null;
  responsePreview?: string | null;
};

export type TrainingSummary = {
  id: string;
  title: string;
  content: string;
  status: string;
  externalReference?: string | null;
  message?: string | null;
  mockEnabled: boolean;
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

  return response.json() as Promise<T>;
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

export function getLeads() {
  return apiFetch<LeadSummary[]>("/leads");
}

export function getAgents() {
  return apiFetch<AgentSummary[]>("/agents");
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

export function getGptMakerHealth() {
  return apiFetch<GptMakerHealth>("/gptmaker/health");
}

export function getGptMakerDiagnostics() {
  return apiFetch<GptMakerDiagnostics>("/gptmaker/diagnostics");
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

export function linkFranchiseWorkspace(id: string, payload: { workspaceId: string; workspaceName?: string }) {
  return apiFetch<FranchiseGptMakerConnection>(`/franchises/${id}/gptmaker/workspace`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateFranchiseGptMakerConnection(id: string, payload: { workspaceId: string; agentId: string }) {
  return apiFetch<FranchiseGptMakerConnection>(`/franchises/${id}/gptmaker-connection`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getGptMakerWorkspaces() {
  return apiFetch<GptMakerWorkspaceOption[]>("/franchises/gptmaker/workspaces");
}

export function getGptMakerWorkspaceAgents(workspaceId: string) {
  return apiFetch<GptMakerAgentOption[]>(`/franchises/gptmaker/workspaces/${workspaceId}/agents`);
}

export function getGptMakerWorkspaceAgentDiagnostics(workspaceId: string) {
  return apiFetch<GptMakerAgentDiagnostics>(`/gptmaker/diagnostics/workspaces/${workspaceId}/agents`);
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
