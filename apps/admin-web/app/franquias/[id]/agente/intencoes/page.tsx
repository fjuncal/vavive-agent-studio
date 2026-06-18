"use client";

import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import {
  createGptMakerIntention,
  getFranchiseById,
  getGptMakerIntentions,
  type FranchiseSummary,
  type GptMakerIntention
} from "@/lib/api";
import { Loader2, Plus, Target, X } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function AgentIntentionsPage() {
  const params = useParams<{ id: string }>();
  const [franchise, setFranchise] = useState<FranchiseSummary | null>(null);
  const [intentions, setIntentions] = useState<GptMakerIntention[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formInstructions, setFormInstructions] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!params?.id) {
      return;
    }

    setIsLoading(true);
    Promise.all([
      getFranchiseById(params.id),
      getGptMakerIntentions(params.id).catch(() => [])
    ])
      .then(([franchiseData, intentionsData]) => {
        setFranchise(franchiseData);
        setIntentions(intentionsData);
      })
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar as intencoes.");
      })
      .finally(() => setIsLoading(false));
  }, [params?.id]);

  useEffect(() => {
    if (showModal) {
      nameRef.current?.focus();
    }
  }, [showModal]);

  function openModal() {
    setFormName("");
    setFormDescription("");
    setFormInstructions("");
    setError(null);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
  }

  async function handleCreate() {
    if (!params?.id) {
      return;
    }
    if (!formName.trim() || !formInstructions.trim()) {
      setError("Preencha nome e instrucoes.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await createGptMakerIntention(params.id, {
        name: formName.trim(),
        description: formDescription.trim(),
        instructions: formInstructions.trim()
      });
      setIntentions(await getGptMakerIntentions(params.id));
      setSuccess("Intencao criada com sucesso.");
      closeModal();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel criar a intencao.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Agente"
        title={franchise ? `Intencoes - ${franchise.name}` : "Intencoes do agente"}
        description="Gerencie as intencoes operacionais do assistente."
        backHref={`/franquias/${params?.id}/agente`}
      />

      {error && (
        <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-800 px-5 py-4 text-sm text-rose-700 dark:text-rose-300 animate-in flex items-center gap-2">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900">
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">!</span>
          </div>
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800 px-5 py-4 text-sm text-emerald-700 dark:text-emerald-300 animate-in">
          {success}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          {intentions.length} {intentions.length === 1 ? "intencao" : "intencoes"}
        </p>
        <button type="button" onClick={openModal} className="btn-primary">
          <Plus size={16} />
          Nova intenção
        </button>
      </div>

      {isLoading ? (
        <div className="card flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-brand-600" />
          <p className="ml-3 text-sm" style={{ color: "var(--color-text-secondary)" }}>Carregando intencoes...</p>
        </div>
      ) : intentions.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Nenhuma intencao cadastrada"
          description="Crie intencoes para treinar o agente a responder perguntas especificas."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {intentions.map((intention) => (
            <article key={intention.id} className="card group">
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400 transition-transform duration-200 group-hover:scale-110">
                  <Target size={20} />
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                    intention.active
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                >
                  {intention.active ? "Ativa" : "Inativa"}
                </span>
              </div>
              <h3 className="mt-4 font-semibold" style={{ color: "var(--color-text-primary)" }}>
                {intention.description}
              </h3>
              {intention.type && (
                <p className="mt-1 text-xs uppercase tracking-[0.12em]" style={{ color: "var(--color-text-tertiary)" }}>
                  {intention.type}
                </p>
              )}
              {intention.instructions && (
                <p className="mt-3 text-sm leading-6 line-clamp-3" style={{ color: "var(--color-text-secondary)" }}>
                  {intention.instructions}
                </p>
              )}
            </article>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={isSaving ? undefined : closeModal} />
          <div className="card relative w-full max-w-lg p-6 shadow-soft-lg animate-scale-in">
            <div className="flex items-center justify-between gap-3 mb-5">
              <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
                Nova intenção
              </h2>
              <button
                type="button"
                onClick={closeModal}
                disabled={isSaving}
                className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-slate-100 dark:hover:bg-slate-800"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-4">
              <label className="grid gap-1.5">
                <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                  Nome <span className="text-rose-500">*</span>
                </span>
                <input
                  ref={nameRef}
                  className="input-field"
                  placeholder="Ex: Duvida sobre precos"
                  value={formName}
                  onChange={(event) => setFormName(event.target.value)}
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                  Descrição
                </span>
                <input
                  className="input-field"
                  placeholder="Breve descricao da intencao"
                  value={formDescription}
                  onChange={(event) => setFormDescription(event.target.value)}
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                  Instruções <span className="text-rose-500">*</span>
                </span>
                <textarea
                  className="input-field min-h-[140px] leading-6"
                  placeholder="Como o agente deve responder quando identificar essa intencao..."
                  value={formInstructions}
                  onChange={(event) => setFormInstructions(event.target.value)}
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={closeModal} disabled={isSaving} className="btn-secondary">
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleCreate()}
                disabled={isSaving || !formName.trim() || !formInstructions.trim()}
                className="btn-primary min-w-[120px]"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    Criar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
