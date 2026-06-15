"use client";

import { AppShell } from "@/components/AppShell";
import { FormSection } from "@/components/FormSection";
import { PageHeader } from "@/components/PageHeader";
import { createFranchise, getAvailableGptMakerWorkspaces, type GptMakerWorkspaceOption } from "@/lib/api";
import { PlugZap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const fieldClassName = "w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-50";

export default function NewFranchisePage() {
  const router = useRouter();
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
        setWorkspaceError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar os workspaces GPTMaker.");
      })
      .finally(() => setIsLoadingWorkspaces(false));
  }, []);

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
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel salvar a franquia.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Cadastro"
        title="Nova franquia"
        description="Crie a unidade, vincule uma workspace disponivel quando houver e siga para a configuracao do administrador e do agente."
      />
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <form onSubmit={handleSubmit}>
          <FormSection title="Dados da franquia" description="Informacoes oficiais usadas em permissoes, dashboard e filtros comerciais.">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-slate-700">Nome da franquia</span>
                <input className={fieldClassName} placeholder="Vavive Moema" value={name} onChange={(event) => setName(event.target.value)} disabled={isSubmitting} required />
              </label>
              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-slate-700">CNPJ ou documento</span>
                <input className={fieldClassName} placeholder="00.000.000/0001-00" value={document} onChange={(event) => setDocument(event.target.value)} disabled={isSubmitting} />
              </label>
              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-slate-700">Cidade</span>
                <input className={fieldClassName} placeholder="Sao Paulo" value={city} onChange={(event) => setCity(event.target.value)} disabled={isSubmitting} required />
              </label>
              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-slate-700">Estado</span>
                <input className={fieldClassName} placeholder="SP" value={state} onChange={(event) => setState(event.target.value)} disabled={isSubmitting} required />
              </label>
            </div>

            <section className="rounded-2xl border border-line/80 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-700 shadow-sm">
                  <PlugZap size={18} />
                </div>
                <div>
                  <h2 className="font-semibold text-ink">Workspace GPTMaker</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    A workspace precisa existir previamente no GPTMaker. Apenas workspaces ainda nao vinculadas aparecem aqui.
                  </p>
                </div>
              </div>
              <label className="mt-4 grid gap-1.5">
                <span className="text-sm font-medium text-slate-700">Selecionar workspace existente</span>
                <select
                  className={fieldClassName}
                  value={selectedWorkspaceId}
                  onChange={(event) => setSelectedWorkspaceId(event.target.value)}
                  disabled={isSubmitting || isLoadingWorkspaces}
                >
                  <option value="">Criar sem workspace por enquanto</option>
                  {workspaces.map((workspace) => (
                    <option key={workspace.id} value={workspace.id}>
                      {workspace.name || "Workspace sem nome"}
                    </option>
                  ))}
                </select>
              </label>
              {workspaceError ? <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{workspaceError}</p> : null}
              {!selectedWorkspaceId ? (
                <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">Esta franquia ficara pendente de conexao GPTMaker.</p>
              ) : null}
            </section>

            {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
            <button type="submit" disabled={isSubmitting} className="w-fit rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white shadow-soft disabled:cursor-wait disabled:opacity-70">
              {isSubmitting ? "Salvando..." : "Salvar franquia"}
            </button>
          </FormSection>
        </form>
        <aside className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
          <h2 className="font-semibold text-ink">Fluxo</h2>
          <div className="mt-4 grid gap-3 text-sm text-slate-600">
            <p className="rounded-xl bg-slate-50 p-3">1. Criar franquia.</p>
            <p className="rounded-xl bg-slate-50 p-3">2. Criar administrador.</p>
            <p className="rounded-xl bg-slate-50 p-3">3. Configurar agente.</p>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
