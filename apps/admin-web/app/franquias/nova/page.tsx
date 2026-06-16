"use client";

import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/lib/auth";
import { createFullFranchise, getAvailableGptMakerWorkspaces, type GptMakerWorkspaceOption } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const fieldClass = "w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-50";

export default function NewFranchisePage() {
  const router = useRouter();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!adminName.trim() || !adminEmail.trim() || !adminPassword.trim()) {
      setError("Preencha os dados do administrador.");
      return;
    }

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

  return (
    <AppShell>
      <PageHeader eyebrow="Cadastro" title="Nova franquia" description="Cadastre a unidade e o responsável." />
      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="grid gap-5">
          <section className="rounded-2xl border border-line/80 bg-white/86 p-6 shadow-soft">
            <h2 className="text-lg font-semibold text-ink">Dados da franquia</h2>
            <p className="mt-1 text-sm text-slate-500">Informações oficiais da unidade.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 sm:col-span-2">
                <span className="text-sm font-medium text-slate-700">Nome da franquia</span>
                <input className={fieldClass} placeholder="Ex: Vavive Moema" value={name} onChange={(e) => setName(e.target.value)} disabled={isSubmitting} required />
              </label>
              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-slate-700">CNPJ / Documento</span>
                <input className={fieldClass} placeholder="00.000.000/0001-00" value={document} onChange={(e) => setDocument(e.target.value)} disabled={isSubmitting} />
              </label>
              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-slate-700">Cidade</span>
                <input className={fieldClass} placeholder="São Paulo" value={city} onChange={(e) => setCity(e.target.value)} disabled={isSubmitting} required />
              </label>
              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-slate-700">Estado</span>
                <input className={fieldClass} placeholder="SP" value={state} onChange={(e) => setState(e.target.value)} disabled={isSubmitting} required />
              </label>
            </div>

            {isSuperAdmin ? (
              <div className="mt-6 rounded-2xl border border-line/80 bg-slate-50 p-4">
                <h3 className="font-semibold text-ink">Conexão</h3>
                <p className="mt-1 text-sm text-slate-500">Vincular a uma integração existente (opcional).</p>
                <label className="mt-4 grid gap-1.5">
                  <span className="text-sm font-medium text-slate-700">Selecionar integração</span>
                  <select className={fieldClass} value={selectedWorkspaceId} onChange={(e) => setSelectedWorkspaceId(e.target.value)} disabled={isSubmitting || isLoadingWorkspaces}>
                    <option value="">Sem integração por enquanto</option>
                    {workspaces.map((ws) => (
                      <option key={ws.id} value={ws.id}>{ws.name || "Sem nome"}</option>
                    ))}
                  </select>
                </label>
                {workspaceError ? <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{workspaceError}</p> : null}
              </div>
            ) : null}
          </section>

          <section className="rounded-2xl border border-line/80 bg-white/86 p-6 shadow-soft">
            <h2 className="text-lg font-semibold text-ink">Administrador da franquia</h2>
            <p className="mt-1 text-sm text-slate-500">Crie o usuário que gerenciará esta unidade.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-slate-700">Nome do administrador</span>
                <input className={fieldClass} placeholder="Maria Silva" value={adminName} onChange={(e) => setAdminName(e.target.value)} disabled={isSubmitting} required />
              </label>
              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-slate-700">Email</span>
                <input className={fieldClass} type="email" placeholder="maria@franquia.com" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} disabled={isSubmitting} required />
              </label>
              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-slate-700">Senha inicial</span>
                <input className={fieldClass} type="password" placeholder="Mínimo 6 caracteres" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} disabled={isSubmitting} required />
              </label>
            </div>
          </section>

          {error ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={isSubmitting} className="rounded-xl bg-ink px-6 py-3 text-sm font-semibold text-white shadow-soft disabled:cursor-wait disabled:opacity-70">
              {isSubmitting ? "Salvando..." : "Criar franquia"}
            </button>
          </div>
        </div>
      </form>
    </AppShell>
  );
}
