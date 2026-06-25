"use client";

import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/lib/auth";
import { createFullFranchise, getAvailableGptMakerWorkspaces, type GptMakerWorkspaceOption } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Check,
  Loader2,
  PlugZap,
  UserRound,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  MapPin,
  FileText,
  Mail,
  Lock,
  User
} from "lucide-react";

type Step = {
  id: string;
  label: string;
  description: string;
  icon: typeof Building2;
};

const steps: Step[] = [
  { id: "franchise", label: "Dados da franquia", description: "Informações da unidade", icon: Building2 },
  { id: "connection", label: "Conexão", description: "Integração do agente", icon: PlugZap },
  { id: "admin", label: "Administrador", description: "Acesso da franquia", icon: UserRound },
  { id: "review", label: "Revisão", description: "Confirmar dados", icon: Check }
];

function StepIndicator({ steps, currentStep, completedSteps }: { steps: Step[]; currentStep: number; completedSteps: number[] }) {
  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isActive = index === currentStep;
        const isCompleted = completedSteps.includes(index);
        const isPast = index < currentStep;

        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <div
                className={`
                  relative flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300
                  ${isActive
                    ? "bg-brand-600 text-white shadow-glow scale-110"
                    : isCompleted || isPast
                      ? "bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400"
                      : "bg-gray-100 dark:bg-gray-800"
                  }
                `}
                style={!isActive && !isCompleted && !isPast ? { color: "var(--color-text-tertiary)" } : undefined}
              >
                {isCompleted || isPast ? (
                  <Check size={20} className="text-brand-700 dark:text-brand-400" />
                ) : (
                  <Icon size={20} />
                )}
                {isActive && (
                  <div className="absolute inset-0 rounded-2xl animate-pulse-soft bg-brand-400/20" />
                )}
              </div>
              <div className="text-center hidden sm:block">
                <p className={`text-xs font-semibold ${isActive ? "text-brand-700 dark:text-brand-400" : isCompleted || isPast ? "text-brand-600 dark:text-brand-400" : ""}`} style={!isActive && !isCompleted && !isPast ? { color: "var(--color-text-tertiary)" } : undefined}>
                  {step.label}
                </p>
                <p className="text-2xs mt-0.5" style={{ color: "var(--color-text-tertiary)" }}>{step.description}</p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className="flex-1 mx-2 sm:mx-4 hidden sm:block">
                <div className="h-0.5 rounded-full relative overflow-hidden" style={{ background: "var(--color-border)" }}>
                  <div
                    className={`absolute inset-y-0 left-0 bg-brand-500 rounded-full transition-all duration-500 ${isPast ? "w-full" : "w-0"}`}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function FranchiseStep({ name, setName, document, setDocument, city, setCity, state, setState, isSubmitting }: {
  name: string; setName: (v: string) => void;
  document: string; setDocument: (v: string) => void;
  city: string; setCity: (v: string) => void;
  state: string; setState: (v: string) => void;
  isSubmitting: boolean;
}) {
  return (
    <div className="animate-in">
      <div className="mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
          <Building2 size={20} className="text-brand-600 dark:text-brand-400" />
          Dados da franquia
        </h3>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>Preencha as informaÃ§Ãµes oficiais da unidade.</p>
      </div>

      <div className="grid gap-5">
        <label className="grid gap-2">
          <span className="text-sm font-medium flex items-center gap-1.5" style={{ color: "var(--color-text-primary)" }}>
            <Building2 size={14} style={{ color: "var(--color-text-tertiary)" }} />
            Nome da franquia
            <span className="text-rose-500 dark:text-rose-400">*</span>
          </span>
          <input
            className="input-field"
            placeholder="Ex: Vavive Moema"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSubmitting}
            required
            autoFocus
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium flex items-center gap-1.5" style={{ color: "var(--color-text-primary)" }}>
            <FileText size={14} style={{ color: "var(--color-text-tertiary)" }} />
            CNPJ / Documento
          </span>
          <input
            className="input-field"
            placeholder="00.000.000/0001-00"
            value={document}
            onChange={(e) => setDocument(e.target.value)}
            disabled={isSubmitting}
          />
          <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>Opcional. Preencha depois se preferir.</span>
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium flex items-center gap-1.5" style={{ color: "var(--color-text-primary)" }}>
              <MapPin size={14} style={{ color: "var(--color-text-tertiary)" }} />
              Cidade
              <span className="text-rose-500 dark:text-rose-400">*</span>
            </span>
            <input
              className="input-field"
              placeholder="SÃ£o Paulo"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium flex items-center gap-1.5" style={{ color: "var(--color-text-primary)" }}>
              <MapPin size={14} style={{ color: "var(--color-text-tertiary)" }} />
              Estado
              <span className="text-rose-500 dark:text-rose-400">*</span>
            </span>
            <input
              className="input-field"
              placeholder="SP"
              value={state}
              onChange={(e) => setState(e.target.value)}
              disabled={isSubmitting}
              required
              maxLength={2}
            />
          </label>
        </div>
      </div>
    </div>
  );
}

function ConnectionStep({ workspaces, selectedWorkspaceId, setSelectedWorkspaceId, isLoadingWorkspaces, workspaceError, isSubmitting }: {
  workspaces: GptMakerWorkspaceOption[];
  selectedWorkspaceId: string;
  setSelectedWorkspaceId: (v: string) => void;
  isLoadingWorkspaces: boolean;
  workspaceError: string | null;
  isSubmitting: boolean;
}) {
  return (
    <div className="animate-in">
      <div className="mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
          <PlugZap size={20} className="text-brand-600 dark:text-brand-400" />
          Conexão do agente
        </h3>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>Vincule a uma integração existente ou pule esta etapa.</p>
      </div>

      <div className="grid gap-4">
        {isLoadingWorkspaces ? (
          <div className="flex items-center gap-3 rounded-2xl p-6" style={{ background: "var(--color-bg-secondary)" }}>
            <Loader2 size={20} className="animate-spin text-brand-600 dark:text-brand-400" />
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Carregando integrações disponíveis...</p>
          </div>
        ) : (
          <>
            <label className="grid gap-2">
              <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Selecionar integração</span>
              <select
                className="input-field"
                value={selectedWorkspaceId}
                onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                disabled={isSubmitting}
              >
                <option value="">Sem integração por enquanto</option>
                {workspaces.map((ws) => (
                  <option key={ws.id} value={ws.id}>{ws.name || "Sem nome"}</option>
                ))}
              </select>
            </label>

            <div className="rounded-2xl bg-brand-50/50 dark:bg-brand-900/10 border border-brand-100 dark:border-brand-800 p-4">
              <p className="text-sm text-brand-700 dark:text-brand-400 flex items-center gap-2">
                <Sparkles size={16} />
                <span className="font-medium">Dica:</span>
              </p>
              <p className="mt-1 text-sm text-brand-600 dark:text-brand-300">
                VocÃª pode vincular a integração depois. A franquia será criada e vocÃª poderÃ¡ configurar a conexÃ£o na pÃ¡gina de detalhes.
              </p>
            </div>
          </>
        )}

        {workspaceError && (
          <div className="rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 p-4">
            <p className="text-sm text-rose-700 dark:text-rose-400">{workspaceError}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AdminStep({ adminName, setAdminName, adminEmail, setAdminEmail, adminPassword, setAdminPassword, isSubmitting }: {
  adminName: string; setAdminName: (v: string) => void;
  adminEmail: string; setAdminEmail: (v: string) => void;
  adminPassword: string; setAdminPassword: (v: string) => void;
  isSubmitting: boolean;
}) {
  return (
    <div className="animate-in">
      <div className="mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
          <UserRound size={20} className="text-brand-600 dark:text-brand-400" />
          Administrador da franquia
        </h3>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>Crie o usuÃ¡rio que gerenciarÃ¡ esta unidade.</p>
      </div>

      <div className="grid gap-5">
        <label className="grid gap-2">
          <span className="text-sm font-medium flex items-center gap-1.5" style={{ color: "var(--color-text-primary)" }}>
            <User size={14} style={{ color: "var(--color-text-tertiary)" }} />
            Nome do administrador
            <span className="text-rose-500 dark:text-rose-400">*</span>
          </span>
          <input
            className="input-field"
            placeholder="Maria Silva"
            value={adminName}
            onChange={(e) => setAdminName(e.target.value)}
            disabled={isSubmitting}
            required
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium flex items-center gap-1.5" style={{ color: "var(--color-text-primary)" }}>
            <Mail size={14} style={{ color: "var(--color-text-tertiary)" }} />
            Email
            <span className="text-rose-500 dark:text-rose-400">*</span>
          </span>
          <input
            className="input-field"
            type="email"
            placeholder="maria@franquia.com"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            disabled={isSubmitting}
            required
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium flex items-center gap-1.5" style={{ color: "var(--color-text-primary)" }}>
            <Lock size={14} style={{ color: "var(--color-text-tertiary)" }} />
            Senha inicial
            <span className="text-rose-500 dark:text-rose-400">*</span>
          </span>
          <input
            className="input-field"
            type="password"
            placeholder="MÃ­nimo 6 caracteres"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            disabled={isSubmitting}
            required
            minLength={6}
          />
          <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>O administrador poderÃ¡ alterar a senha após o primeiro acesso.</span>
        </label>
      </div>
    </div>
  );
}

function ReviewStep({ name, document, city, state, selectedWorkspace, adminName, adminEmail }: {
  name: string; document: string; city: string; state: string;
  selectedWorkspace: GptMakerWorkspaceOption | null;
  adminName: string; adminEmail: string;
}) {
  return (
    <div className="animate-in">
      <div className="mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
          <Check size={20} className="text-brand-600 dark:text-brand-400" />
          Revisão final
        </h3>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>Confira os dados antes de criar a franquia.</p>
      </div>

      <div className="grid gap-4">
        <div className="rounded-2xl p-5" style={{ background: "var(--color-bg-secondary)" }}>
          <p className="section-title">Franquia</p>
          <div className="mt-3 grid gap-2">
            <div className="flex justify-between">
              <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Nome</span>
              <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{name || "â€”"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Documento</span>
              <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{document || "â€”"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>LocalizaÃ§Ã£o</span>
              <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{city}/{state}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-5" style={{ background: "var(--color-bg-secondary)" }}>
          <p className="section-title">Conexão</p>
          <div className="mt-3">
            <div className="flex justify-between">
              <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>IntegraÃ§Ã£o</span>
              <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{selectedWorkspace?.name || "Nenhuma"}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-5" style={{ background: "var(--color-bg-secondary)" }}>
          <p className="section-title">Administrador</p>
          <div className="mt-3 grid gap-2">
            <div className="flex justify-between">
              <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Nome</span>
              <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{adminName || "â€”"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Email</span>
              <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{adminEmail || "â€”"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewFranchisePage() {
  const router = useRouter();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const [name, setName] = useState("");
  const [document, setDocument] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const [workspaces, setWorkspaces] = useState<GptMakerWorkspaceOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(true);

  const selectedWorkspace = useMemo(
    () => workspaces.find((w) => w.id === selectedWorkspaceId) ?? null,
    [selectedWorkspaceId, workspaces]
  );

  useEffect(() => {
    if (!isSuperAdmin) {
      setIsLoadingWorkspaces(false);
      return;
    }
    setIsLoadingWorkspaces(true);
    getAvailableGptMakerWorkspaces()
      .then((items) => {
        setWorkspaces(items);
        const wsId = new URLSearchParams(window.location.search).get("workspaceId");
        if (wsId && items.some((w) => w.id === wsId)) {
          setSelectedWorkspaceId(wsId);
        }
      })
      .catch((err) => {
        setWorkspaceError(err instanceof Error ? err.message : "Erro ao carregar.");
      })
      .finally(() => setIsLoadingWorkspaces(false));
  }, [isSuperAdmin]);

  function validateStep(step: number): boolean {
    setError(null);
    switch (step) {
      case 0:
        if (!name.trim()) {
          setError("Preencha o nome da franquia.");
          return false;
        }
        if (!city.trim()) {
          setError("Preencha a cidade.");
          return false;
        }
        if (!state.trim()) {
          setError("Preencha o estado.");
          return false;
        }
        return true;
      case 2:
        if (!adminName.trim() || !adminEmail.trim() || !adminPassword.trim()) {
          setError("Preencha todos os dados do administrador.");
          return false;
        }
        if (adminPassword.length < 6) {
          setError("A senha deve ter no mÃ­nimo 6 caracteres.");
          return false;
        }
        return true;
      default:
        return true;
    }
  }

  function handleNext() {
    if (validateStep(currentStep)) {
      setCompletedSteps((prev) => [...new Set([...prev, currentStep])]);
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  }

  function handleBack() {
    setError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }

  async function handleSubmit() {
    if (!validateStep(0) || !validateStep(2)) return;

    setError(null);
    setIsSubmitting(true);
    try {
      const result = await createFullFranchise({
        franchise: {
          name,
          document: document || undefined,
          city,
          state,
          workspaceId: selectedWorkspace?.id || undefined,
          workspaceName: selectedWorkspace?.name || undefined
        },
        adminUser: {
          name: adminName,
          email: adminEmail,
          password: adminPassword
        }
      });
      router.replace(`/franquias/${result.franchise.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const canProceed = currentStep < steps.length - 1;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Cadastro"
        title="Nova franquia"
        description="Cadastre a unidade e o responsÃ¡vel em poucos passos."
      />

      <div className="max-w-3xl">
        <div className="card mb-6 animate-in">
          <StepIndicator steps={steps} currentStep={currentStep} completedSteps={completedSteps} />
        </div>

        <div className="card mb-6">
          {currentStep === 0 && (
            <FranchiseStep
              name={name} setName={setName}
              document={document} setDocument={setDocument}
              city={city} setCity={setCity}
              state={state} setState={setState}
              isSubmitting={isSubmitting}
            />
          )}

          {currentStep === 1 && isSuperAdmin && (
            <ConnectionStep
              workspaces={workspaces}
              selectedWorkspaceId={selectedWorkspaceId}
              setSelectedWorkspaceId={setSelectedWorkspaceId}
              isLoadingWorkspaces={isLoadingWorkspaces}
              workspaceError={workspaceError}
              isSubmitting={isSubmitting}
            />
          )}

          {currentStep === 1 && !isSuperAdmin && (
            <div className="animate-in">
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 mb-4">
                  <PlugZap size={28} />
                </div>
                <h3 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>Conexão automática</h3>
                <p className="mt-2 text-sm max-w-md" style={{ color: "var(--color-text-secondary)" }}>
                  A integração do Vavive Agent será configurada pela matriz após a criação da franquia.
                </p>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <AdminStep
              adminName={adminName} setAdminName={setAdminName}
              adminEmail={adminEmail} setAdminEmail={setAdminEmail}
              adminPassword={adminPassword} setAdminPassword={setAdminPassword}
              isSubmitting={isSubmitting}
            />
          )}

          {currentStep === 3 && (
            <ReviewStep
              name={name}
              document={document}
              city={city}
              state={state}
              selectedWorkspace={selectedWorkspace}
              adminName={adminName}
              adminEmail={adminEmail}
            />
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 px-5 py-4 text-sm text-rose-700 dark:text-rose-400 animate-in flex items-center gap-2">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30">
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400">!</span>
            </div>
            {error}
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 0 || isSubmitting}
            className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ArrowLeft size={16} />
            Voltar
          </button>

          <div className="flex items-center gap-3">
            <span className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>
              {currentStep + 1} de {steps.length}
            </span>

            {canProceed ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={isSubmitting}
                className="btn-primary"
              >
                PrÃ³ximo
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="btn-primary min-w-[160px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Criar franquia
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}


