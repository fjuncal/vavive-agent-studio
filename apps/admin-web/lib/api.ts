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
  externalId: string;
  name: string;
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
