"use client";

import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/lib/auth";
import {
  createWhatsAppNotificationContact,
  deleteWhatsAppNotificationContact,
  getFranchiseById,
  getWhatsAppNotificationContacts,
  sendWhatsAppNotificationTest,
  updateWhatsAppNotificationContact,
  type FranchiseSummary,
  type NotificationDispatchSummary,
  type WhatsAppNotificationContact
} from "@/lib/api";
import { Loader2, MessageCircleMore, Plus, Save, Send, Trash2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type ContactForm = {
  id?: string;
  name: string;
  phone: string;
  active: boolean;
};

const emptyForm: ContactForm = {
  name: "",
  phone: "",
  active: true
};

export default function FranchiseWhatsAppNotificationsPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const [franchise, setFranchise] = useState<FranchiseSummary | null>(null);
  const [contacts, setContacts] = useState<WhatsAppNotificationContact[]>([]);
  const [form, setForm] = useState<ContactForm>(emptyForm);
  const [testMessage, setTestMessage] = useState("");
  const [summary, setSummary] = useState<NotificationDispatchSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadData() {
    if (!params?.id) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [franchiseData, contactsData] = await Promise.all([
        getFranchiseById(params.id),
        getWhatsAppNotificationContacts(params.id)
      ]);
      setFranchise(franchiseData);
      setContacts(contactsData);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível carregar as notificações.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [params?.id]);

  const activeContacts = useMemo(() => contacts.filter((contact) => contact.active), [contacts]);

  async function handleSave() {
    if (!params?.id) {
      return;
    }
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      if (form.id) {
        await updateWhatsAppNotificationContact(params.id, form.id, form);
        setSuccess("Contato atualizado com sucesso.");
      } else {
        await createWhatsAppNotificationContact(params.id, form);
        setSuccess("Contato criado com sucesso.");
      }
      setForm(emptyForm);
      await loadData();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível salvar o contato.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(contactId: string) {
    if (!params?.id) {
      return;
    }
    setDeletingId(contactId);
    setError(null);
    setSuccess(null);
    try {
      await deleteWhatsAppNotificationContact(params.id, contactId);
      setSuccess("Contato desativado com sucesso.");
      if (form.id === contactId) {
        setForm(emptyForm);
      }
      await loadData();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível desativar o contato.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSendTest() {
    if (!params?.id) {
      return;
    }
    setIsSendingTest(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await sendWhatsAppNotificationTest(params.id, testMessage.trim() || undefined);
      setSummary(result);
      setSuccess("Teste disparado para os contatos ativos.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível enviar o teste.");
    } finally {
      setIsSendingTest(false);
    }
  }

  if (!isSuperAdmin) {
    return (
      <AppShell>
        <EmptyState
          icon={MessageCircleMore}
          title="Acesso restrito"
          description="Somente a matriz pode configurar notificações de agendamento."
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow={franchise?.name ?? "Franquia"}
        title="Notificações de agendamento"
        description="Configure quais WhatsApps receberão um aviso quando o Vavive Agent registrar um novo atendimento agendado para esta franquia."
        backHref={`/franquias/${params?.id}`}
      />

      {error ? <div className="rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4 text-sm text-rose-700">{error}</div> : null}
      {success ? <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">{success}</div> : null}

      {isLoading ? (
        <div className="card flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-brand-600" />
          <p className="ml-3 text-sm" style={{ color: "var(--color-text-secondary)" }}>Carregando contatos...</p>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>Contatos cadastrados</h2>
                <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  {activeContacts.length} contato(s) ativo(s) receberão avisos do Evolution.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4">
              {contacts.length ? contacts.map((contact) => (
                <article key={contact.id} className="rounded-xl border px-4 py-4" style={{ borderColor: "var(--color-border)" }}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{contact.name}</p>
                      <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{contact.phone}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setForm({ id: contact.id, name: contact.name, phone: contact.phone, active: contact.active })}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => void handleDelete(contact.id)}
                        disabled={deletingId === contact.id}
                      >
                        {deletingId === contact.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        {contact.active ? "Desativar" : "Manter inativo"}
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 text-xs font-medium" style={{ color: contact.active ? "#15803d" : "var(--color-text-tertiary)" }}>
                    {contact.active ? "Ativo" : "Inativo"}
                  </div>
                </article>
              )) : (
                <EmptyState icon={MessageCircleMore} title="Nenhum contato cadastrado" description="Cadastre os números que devem receber as notificações." />
              )}
            </div>
          </section>

          <div className="grid gap-6">
            <section className="card">
              <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
                {form.id ? "Editar contato" : "Adicionar contato"}
              </h2>
              <div className="mt-4 grid gap-3">
                <label className="grid gap-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  Nome
                  <input
                    className="input-field"
                    placeholder="Ex.: Operação"
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  />
                </label>
                <label className="grid gap-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  Telefone
                  <input
                    className="input-field"
                    placeholder="5511999999999"
                    value={form.phone}
                    onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                  />
                </label>
                <label className="flex items-center gap-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))}
                  />
                  Contato ativo
                </label>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="btn-primary" onClick={() => void handleSave()} disabled={isSaving}>
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : form.id ? <Save size={16} /> : <Plus size={16} />}
                    {form.id ? "Salvar contato" : "Adicionar contato"}
                  </button>
                  {form.id ? (
                    <button type="button" className="btn-secondary" onClick={() => setForm(emptyForm)}>
                      Cancelar
                    </button>
                  ) : null}
                </div>
              </div>
            </section>

            <section className="card">
              <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>Teste de disparo</h2>
              <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                Envie uma mensagem de teste para todos os contatos ativos desta franquia.
              </p>
              <label className="mt-4 grid gap-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                Mensagem de teste
                <textarea
                  className="input-field min-h-[140px]"
                  placeholder="Mensagem opcional"
                  value={testMessage}
                  onChange={(event) => setTestMessage(event.target.value)}
                />
              </label>
              <button type="button" className="btn-primary mt-4" onClick={() => void handleSendTest()} disabled={isSendingTest || activeContacts.length === 0}>
                {isSendingTest ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Enviar teste para contatos ativos
              </button>

              {summary ? (
                <div className="mt-4 rounded-xl p-4" style={{ background: "var(--color-bg-secondary)" }}>
                  <div className="grid gap-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    <div>Total: {summary.total}</div>
                    <div>Enviados: {summary.sent}</div>
                    <div>Falhas: {summary.failed}</div>
                    <div>Dry-run: {summary.dryRun}</div>
                  </div>
                  {summary.provider === "dry-run" ? (
                    <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                      Ambiente em modo teste: nenhuma mensagem real foi enviada.
                    </div>
                  ) : null}
                </div>
              ) : null}
            </section>
          </div>
        </div>
      )}
    </AppShell>
  );
}
