"use client";

import { AppShell } from "@/components/AppShell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { useToast } from "@/components/Toast";
import { deleteContact, getContact, getContacts, updateContact, type GptMakerContact } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Eye, Loader2, Pencil, RefreshCw, Search, Trash2, UsersRound, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type ContactForm = {
  name: string;
  phone: string;
  email: string;
  jobTitle: string;
  gender: string;
  picture: string;
  recipient: string;
};

const emptyForm: ContactForm = {
  name: "",
  phone: "",
  email: "",
  jobTitle: "",
  gender: "",
  picture: "",
  recipient: ""
};

function contactLabel(contact: GptMakerContact) {
  return contact.name || contact.phone || contact.email || contact.recipient || contact.id;
}

function toForm(contact: GptMakerContact): ContactForm {
  return {
    name: contact.name ?? "",
    phone: contact.phone ?? "",
    email: contact.email ?? "",
    jobTitle: contact.jobTitle ?? "",
    gender: contact.gender ?? "",
    picture: contact.picture ?? "",
    recipient: contact.recipient ?? ""
  };
}

function cleanPayload(form: ContactForm) {
  return Object.fromEntries(
    Object.entries(form)
      .map(([key, value]) => [key, value.trim()])
      .filter(([, value]) => value)
  );
}

export default function ContatosPage() {
  const { user } = useAuth();
  const { error: showError, success: showSuccess } = useToast();
  const [contacts, setContacts] = useState<GptMakerContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [contactIdSearch, setContactIdSearch] = useState("");
  const [selectedContact, setSelectedContact] = useState<GptMakerContact | null>(null);
  const [editingContact, setEditingContact] = useState<GptMakerContact | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GptMakerContact | null>(null);
  const [form, setForm] = useState<ContactForm>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadContacts = useCallback(async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
    }
    setIsRefreshing(true);
    try {
      setContacts(await getContacts({ page: 1, pageSize: 100 }));
    } catch (requestError) {
      showError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar contatos.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [showError]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const filteredContacts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return contacts;
    }
    return contacts.filter((contact) => [
      contact.name,
      contact.phone,
      contact.email,
      contact.jobTitle,
      contact.recipient,
      contact.id
    ].some((value) => value?.toLowerCase().includes(normalized)));
  }, [contacts, query]);

  const handleSearchById = useCallback(async () => {
    if (!contactIdSearch.trim()) {
      return;
    }
    try {
      const contact = await getContact(contactIdSearch.trim());
      setSelectedContact(contact);
      setContacts((current) => {
        const exists = current.some((item) => item.id === contact.id);
        return exists ? current.map((item) => item.id === contact.id ? contact : item) : [contact, ...current];
      });
    } catch (requestError) {
      showError(requestError instanceof Error ? requestError.message : "Nao foi possivel buscar o contato.");
    }
  }, [contactIdSearch, showError]);

  const openEdit = useCallback((contact: GptMakerContact) => {
    setEditingContact(contact);
    setForm(toForm(contact));
  }, []);

  const handleSave = useCallback(async () => {
    if (!editingContact) {
      return;
    }
    setIsSaving(true);
    try {
      const updated = await updateContact(editingContact.id, cleanPayload(form));
      setContacts((current) => current.map((contact) => contact.id === updated.id ? updated : contact));
      setSelectedContact(updated);
      setEditingContact(null);
      showSuccess("Contato atualizado com sucesso.");
    } catch (requestError) {
      showError(requestError instanceof Error ? requestError.message : "Nao foi possivel atualizar o contato.");
    } finally {
      setIsSaving(false);
    }
  }, [editingContact, form, showError, showSuccess]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) {
      return;
    }
    setIsDeleting(true);
    try {
      await deleteContact(deleteTarget.id);
      setContacts((current) => current.filter((contact) => contact.id !== deleteTarget.id));
      if (selectedContact?.id === deleteTarget.id) {
        setSelectedContact(null);
      }
      setDeleteTarget(null);
      showSuccess("Contato deletado com sucesso.");
    } catch (requestError) {
      showError(requestError instanceof Error ? requestError.message : "Nao foi possivel deletar o contato.");
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget, selectedContact, showError, showSuccess]);

  if (user?.role === "SUPER_ADMIN") {
    return (
      <AppShell>
        <EmptyState icon={UsersRound} title="Contatos indisponiveis" description="A lista de contatos pertence a workspace da franquia." />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="GPTMaker"
        title="Contatos"
        description="Contatos sincronizados da workspace GPTMaker da sua franquia."
      />

      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="card p-5">
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <label className="relative">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-tertiary)" }} />
              <input
                className="input-field pl-9"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Filtrar por nome, telefone, email ou ID"
              />
            </label>
            <button type="button" onClick={() => loadContacts(true)} disabled={isRefreshing} className="btn-secondary">
              {isRefreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              Atualizar
            </button>
          </div>
        </div>

        <div className="card p-5">
          <div className="grid gap-3">
            <input
              className="input-field"
              value={contactIdSearch}
              onChange={(event) => setContactIdSearch(event.target.value)}
              placeholder="ID do contato"
            />
            <button type="button" onClick={handleSearchById} disabled={!contactIdSearch.trim()} className="btn-primary">
              <Eye size={16} />
              Buscar contato
            </button>
          </div>
        </div>
      </section>

      {selectedContact ? (
        <section className="card p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              {selectedContact.picture ? (
                <img src={selectedContact.picture} alt={contactLabel(selectedContact)} className="h-12 w-12 rounded-xl object-cover" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                  <UsersRound size={20} />
                </div>
              )}
              <div>
                <h2 className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{contactLabel(selectedContact)}</h2>
                <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>{selectedContact.id}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => openEdit(selectedContact)} className="btn-secondary">
                <Pencil size={16} />
                Editar
              </button>
              <button type="button" onClick={() => setSelectedContact(null)} className="btn-secondary">
                <X size={16} />
                Fechar
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {isLoading ? (
        <section className="card p-6">
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Carregando contatos...</p>
        </section>
      ) : (
        <DataTable
          rows={filteredContacts}
          emptyMessage="Nenhum contato encontrado."
          columns={[
            {
              header: "Contato",
              cell: (contact) => (
                <div>
                  <p className="font-medium" style={{ color: "var(--color-text-primary)" }}>{contactLabel(contact)}</p>
                  <p className="mt-1 text-xs" style={{ color: "var(--color-text-tertiary)" }}>{contact.id}</p>
                </div>
              )
            },
            {
              header: "Telefone",
              cell: (contact) => contact.phone || "-"
            },
            {
              header: "Email",
              cell: (contact) => contact.email || "-"
            },
            {
              header: "Cargo",
              cell: (contact) => contact.jobTitle || "-"
            },
            {
              header: "Acoes",
              className: "w-[180px]",
              cell: (contact) => (
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setSelectedContact(contact)} className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800" title="Ver contato">
                    <Eye size={16} />
                  </button>
                  <button type="button" onClick={() => openEdit(contact)} className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800" title="Editar contato">
                    <Pencil size={16} />
                  </button>
                  <button type="button" onClick={() => setDeleteTarget(contact)} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20" title="Deletar contato">
                    <Trash2 size={16} />
                  </button>
                </div>
              )
            }
          ]}
        />
      )}

      {editingContact ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="card max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>Editar contato</h2>
              <button type="button" onClick={() => setEditingContact(null)} className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
                <X size={18} style={{ color: "var(--color-text-secondary)" }} />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["name", "Nome"],
                ["phone", "Telefone"],
                ["email", "Email"],
                ["jobTitle", "Cargo"],
                ["gender", "Genero"],
                ["recipient", "Recipient"],
                ["picture", "URL da imagem"]
              ].map(([key, label]) => (
                <label key={key} className={key === "picture" ? "grid gap-1.5 md:col-span-2" : "grid gap-1.5"}>
                  <span className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>{label}</span>
                  <input
                    className="input-field"
                    value={form[key as keyof ContactForm]}
                    onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                  />
                </label>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setEditingContact(null)} className="btn-secondary">Cancelar</button>
              <button type="button" onClick={handleSave} disabled={isSaving} className="btn-primary">
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
                Salvar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Deletar contato"
        description={`Tem certeza que deseja deletar "${deleteTarget ? contactLabel(deleteTarget) : "este contato"}"?`}
        confirmLabel="Deletar"
        variant="danger"
        isSubmitting={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </AppShell>
  );
}
