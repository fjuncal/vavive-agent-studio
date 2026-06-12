"use client";

import { AppShell } from "@/components/AppShell";
import { FormSection } from "@/components/FormSection";
import { PageHeader } from "@/components/PageHeader";
import { createFranchise } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewFranchisePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [document, setDocument] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await createFranchise({ name, document, city, state });
      router.replace("/franquias");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel salvar a franquia.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const fieldClassName = "w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-50";

  return (
    <AppShell>
      <PageHeader
        eyebrow="Cadastro"
        title="Nova franquia"
        description="Crie a unidade na base Vavive. A conexao com GPTMaker pode ser associada depois pelo backend."
      />
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <form onSubmit={handleSubmit}>
          <FormSection title="Dados principais" description="Informacoes usadas em permissoes, dashboard e filtros comerciais.">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-slate-700">Nome da franquia</span>
                <input className={fieldClassName} placeholder="Vavive Moema" value={name} onChange={(event) => setName(event.target.value)} disabled={isSubmitting} />
              </label>
              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-slate-700">CNPJ ou documento</span>
                <input className={fieldClassName} placeholder="00.000.000/0001-00" value={document} onChange={(event) => setDocument(event.target.value)} disabled={isSubmitting} />
              </label>
              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-slate-700">Cidade</span>
                <input className={fieldClassName} placeholder="Sao Paulo" value={city} onChange={(event) => setCity(event.target.value)} disabled={isSubmitting} />
              </label>
              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-slate-700">Estado</span>
                <input className={fieldClassName} placeholder="SP" value={state} onChange={(event) => setState(event.target.value)} disabled={isSubmitting} />
              </label>
            </div>
            {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
            <button type="submit" disabled={isSubmitting} className="w-fit rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white shadow-soft disabled:cursor-wait disabled:opacity-70">
              {isSubmitting ? "Salvando..." : "Salvar franquia"}
            </button>
          </FormSection>
        </form>
        <aside className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
          <h2 className="font-semibold text-ink">Checklist inicial</h2>
          <div className="mt-4 grid gap-3 text-sm text-slate-600">
            <p className="rounded-xl bg-slate-50 p-3">Criar usuario ADMIN_FRANQUIA.</p>
            <p className="rounded-xl bg-slate-50 p-3">Associar agente GPTMaker existente.</p>
            <p className="rounded-xl bg-slate-50 p-3">Completar setup guiado da unidade.</p>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
