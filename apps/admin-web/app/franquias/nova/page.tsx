"use client";

import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/lib/auth";
import { createFranchise, getAvailableGptMakerWorkspaces, type GptMakerWorkspaceOption } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const fieldClassName = "w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-50";

export default function NewFranchisePage() {
  const router = useRouter();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const [name, setName] = useState("");
  const [document, setDocument] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [workspaces, setWorkspaces] = useState<GptMakerWorkspaceOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(true);

  const selectedWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === selectedWorkspaceId) ?? null,
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
        const workspaceIdFromUrl = new URLSearchParams(window.location.search).get("workspaceId");
        if (workspaceIdFromUrl && items.some((workspace) => workspace.id === workspaceIdFromUrl)) {
          setSelectedWorkspaceId(workspaceIdFromUrl);
        }
      })
      .catch((requestError) => {
        setWorkspaceError(requestError instanceof Error ? requestError.message : "Não foi possível carregar workspaces.");
      })
      .finally(() => setIsLoadingWorkspaces(false));
  }, [isSuperAdmin]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const created = await createFranchise({
        name,
        document,
        city,
        state,
        workspaceId: selectedWorkspace?.id,
        workspaceName: selectedWorkspace?.name
      });
      router.replace(`/franquias/${created.id}`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível salvar a franquia.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Cadastro"
        title="Nova franquia"
        description="Cadastre a unidade no sistema."
      />
      <form onSubmit={handleSubmit} className="max-w-2xl">
        <section className="rounded-2xl border border-line/80 bg-white/86 p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-ink">Dados da franquia</h2>
          <p className="mt-1 text-sm text-slate-500">Informações oficiais da unidade.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">Nome da franquia</span>
              <input className={fieldClassName} placeholder="Ex: Vavive Moema" value={name} onChange={(event) => setName(event.target.value)} disabled={isSubmitting} required />
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-slate-700">CNPJ / Documento</span>
              <input className={fieldClassName} placeholder="00.000.000/0001-00" value={document} onChange={(event) => setDocument(event.target.value)} disabled={isSubmitting} />
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-slate-700">Cidade</span>
              <input className={fieldClassName} placeholder="São Paulo" value={city} onChange={(event) => setCity(event.target.value)} disabled={isSubmitting} required />
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-slate-700">Estado</span>
              <input className={fieldClassName} placeholder="SP" value={state} onChange={(event) => setState(event.target.value)} disabled={isSubmitting} required />
            </label>
          </div>

          {isSuperAdmin ? (
            <div className="mt-6 rounded-2xl border border-line/80 bg-slate-50 p-4">
              <h3 className="font-semibold text-ink">Conexão</h3>
              <p className="mt-1 text-sm text-slate-500">Vincular a uma integração existente (opcional).</p>
              <label className="mt-4 grid gap-1.5">
                <span className="text-sm font-medium text-slate-700">Selecionar integração</span>
                <select
                  className={fieldClassName}
                  value={selectedWorkspaceId}
                  onChange={(event) => setSelectedWorkspaceId(event.target.value)}
                  disabled={isSubmitting || isLoadingWorkspaces}
                >
                  <option value="">Sem integração por enquanto</option>
                  {workspaces.map((workspace) => (
                    <option key={workspace.id} value={workspace.id}>
                      {workspace.name || "Sem nome"}
                    </option>
                  ))}
                </select>
              </label>
              {workspaceError ? <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{workspaceError}</p> : null}
              {!selectedWorkspaceId ? (
                <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">A integração pode ser feita depois.</p>
              ) : null}
            </div>
          ) : null}

          {error ? <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="submit" disabled={isSubmitting} className="rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white shadow-soft disabled:cursor-wait disabled:opacity-70">
              {isSubmitting ? "Salvando..." : "Criar franquia"}
            </button>
          </div>
        </section>
      </form>
    </AppShell>
  );
}
