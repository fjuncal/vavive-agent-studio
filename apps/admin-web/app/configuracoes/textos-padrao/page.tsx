"use client";

import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/lib/auth";
import {
  createDefaultAgentText,
  getDefaultAgentTexts,
  toggleDefaultAgentText,
  updateDefaultAgentText,
  type DefaultAgentText,
  type DefaultAgentTextCategory
} from "@/lib/api";
import { FileText, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const categories: DefaultAgentTextCategory[] = [
  "CONTEXTO_VAVIVE",
  "REGRAS_ATENDIMENTO",
  "TOM_DE_VOZ",
  "SERVICOS",
  "FAQ",
  "RESTRICOES"
];

const emptyForm = {
  title: "",
  category: "CONTEXTO_VAVIVE" as DefaultAgentTextCategory,
  content: "",
  active: true
};

function categoryLabel(category: DefaultAgentTextCategory) {
  return category.replaceAll("_", " ");
}

export default function DefaultAgentTextsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [items, setItems] = useState<DefaultAgentText[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const selected = useMemo(() => items.find((item) => item.id === selectedId) ?? null, [items, selectedId]);

  useEffect(() => {
    if (authLoading || user?.role !== "SUPER_ADMIN") {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    getDefaultAgentTexts()
      .then(setItems)
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar os textos padrao.");
      })
      .finally(() => setIsLoading(false));
  }, [authLoading, user?.role]);

  function startEdit(item: DefaultAgentText) {
    setSelectedId(item.id);
    setForm({
      title: item.title,
      category: item.category,
      content: item.content,
      active: item.active
    });
    setError(null);
    setSuccess(null);
  }

  function resetForm() {
    setSelectedId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const saved = selected
        ? await updateDefaultAgentText(selected.id, form)
        : await createDefaultAgentText(form);
      setItems((current) => selected
        ? current.map((item) => item.id === saved.id ? saved : item)
        : [...current, saved]);
      setSuccess(selected ? "Texto padrao atualizado." : "Texto padrao criado.");
      resetForm();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel salvar o texto padrao.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggle(item: DefaultAgentText) {
    setError(null);
    setSuccess(null);
    try {
      const updated = await toggleDefaultAgentText(item.id);
      setItems((current) => current.map((currentItem) => currentItem.id === updated.id ? updated : currentItem));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel alterar o status do texto.");
    }
  }

  if (!authLoading && user?.role !== "SUPER_ADMIN") {
    return (
      <AppShell>
        <PageHeader eyebrow="Configuracoes" title="Textos padrao" description="Apenas SUPER_ADMIN pode acessar textos padrao da matriz." />
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">Voce nao tem permissao para acessar este recurso.</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Configuracoes"
        title="Textos padrao"
        description="Cadastre conteudos ativos da matriz que serao usados como sugestao no setup guiado e no contexto inicial do agente."
      />

      {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      {success ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p> : null}

      <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <form onSubmit={handleSubmit} className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-ink">{selected ? "Editar texto" : "Novo texto"}</h2>
              <p className="mt-2 text-sm text-slate-500">Use conteudo aprovado pela matriz. Franquias poderao customizar o setup depois.</p>
            </div>
            {selected ? (
              <button type="button" onClick={resetForm} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
                Novo
              </button>
            ) : null}
          </div>
          <div className="mt-5 grid gap-4">
            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-slate-700">Titulo</span>
              <input className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} required />
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-slate-700">Categoria</span>
              <select className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50" value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as DefaultAgentTextCategory }))}>
                {categories.map((category) => (
                  <option key={category} value={category}>{categoryLabel(category)}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-slate-700">Conteudo</span>
              <textarea className="min-h-[220px] rounded-xl border border-line bg-white px-3 py-3 text-sm leading-6 text-ink outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50" value={form.content} onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))} required />
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={form.active} onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))} />
              Ativo para sugestoes e contexto inicial
            </label>
          </div>
          <button type="submit" disabled={isSaving} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white shadow-soft disabled:cursor-wait disabled:opacity-70">
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
            {selected ? "Salvar alteracoes" : "Criar texto"}
          </button>
        </form>

        <section className="grid gap-4">
          {isLoading ? (
            <div className="rounded-2xl border border-line/80 bg-white/86 p-6 text-sm text-slate-500 shadow-soft">Carregando textos padrao...</div>
          ) : items.length ? items.map((item) => (
            <article key={item.id} className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">{categoryLabel(item.category)}</p>
                  <h2 className="mt-2 text-lg font-semibold text-ink">{item.title}</h2>
                  <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{item.content}</p>
                </div>
                <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${item.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                  {item.active ? "Ativo" : "Inativo"}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => startEdit(item)} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
                  Editar
                </button>
                <button type="button" onClick={() => void handleToggle(item)} className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-700 ring-1 ring-line">
                  {item.active ? "Desativar" : "Ativar"}
                </button>
              </div>
            </article>
          )) : (
            <EmptyState icon={FileText} title="Nenhum texto padrao cadastrado" description="Cadastre textos da matriz para usar no setup guiado e no contexto inicial dos agentes." />
          )}
        </section>
      </div>
    </AppShell>
  );
}
