import { AppShell } from "@/components/AppShell";
import { Field, FormSection } from "@/components/FormSection";
import { PageHeader } from "@/components/PageHeader";

export default function NewFranchisePage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Cadastro"
        title="Nova franquia"
        description="Crie a unidade na base Vavive. A conexao com GPTMaker pode ser associada depois pelo backend."
      />
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <FormSection title="Dados principais" description="Informacoes usadas em permissoes, dashboard e filtros comerciais.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome da franquia" placeholder="Vavive Moema" />
            <Field label="CNPJ ou documento" placeholder="00.000.000/0001-00" />
            <Field label="Cidade" placeholder="Sao Paulo" />
            <Field label="Estado" placeholder="SP" />
          </div>
          <Field label="Responsavel operacional" placeholder="Nome da pessoa responsavel" />
          <button className="w-fit rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white shadow-soft">Salvar franquia</button>
        </FormSection>
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
