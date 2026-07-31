"use client";

import { login } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Bot, LockKeyhole, Mail, Sparkles, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const { clearSession, refreshMe, setSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitCredentials(nextEmail: string, nextPassword: string) {
    setError(null);
    setIsSubmitting(true);

    try {
      clearSession();
      const { token } = await login(nextEmail, nextPassword);
      setSession(token);
      const profile = await refreshMe();
      if (!profile) {
        setError("Não foi possível validar a sessão.");
        return;
      }
      router.replace("/dashboard");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível entrar.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitCredentials(email, password);
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10" style={{ background: "var(--color-bg-secondary)" }}>
      <div className="w-full max-w-[440px] animate-in">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-ink shadow-soft-lg relative">
            <Sparkles size={28} className="text-white" />
            <div className="absolute inset-0 rounded-2xl bg-brand-500/20 animate-pulse-soft" />
          </div>
          <h1 className="mt-6 text-2xl font-bold tracking-tight" style={{ color: "var(--color-text-primary)" }}>Vavive Agent Studio</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>Gestão de franquias, agentes e atendimentos.</p>
        </div>

        {/* Login Form */}
        <section className="card p-8">
          <form className="grid gap-5" onSubmit={handleSubmit}>
            <label className="grid gap-2">
              <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Email</span>
              <div className="flex items-center gap-2.5 rounded-xl px-3.5 py-3 transition-all duration-200 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-50" style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-border)" }}>
                <Mail size={18} className="shrink-0" style={{ color: "var(--color-text-tertiary)" }} />
                <input
                  className="w-full outline-none text-sm bg-transparent placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  style={{ color: "var(--color-text-primary)" }}
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isSubmitting}
                  required
                  type="email"
                  autoComplete="email"
                />
              </div>
            </label>

            <label className="grid gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Senha</span>
                <button type="button" className="text-xs text-brand-600 hover:text-brand-700 transition-colors">
                  Esqueceu?
                </button>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl px-3.5 py-3 transition-all duration-200 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-50" style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-border)" }}>
                <LockKeyhole size={18} className="shrink-0" style={{ color: "var(--color-text-tertiary)" }} />
                <input
                  type="password"
                  className="w-full outline-none text-sm bg-transparent placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  style={{ color: "var(--color-text-primary)" }}
                  placeholder="Sua senha"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={isSubmitting}
                  required
                  autoComplete="current-password"
                />
              </div>
            </label>

            {error && (
              <div className="rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-100 dark:border-rose-900 px-4 py-3 text-sm text-rose-700 dark:text-rose-300 animate-in flex items-center gap-2">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900">
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400">!</span>
                </div>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-3 mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </button>
          </form>

          {/* Test Credentials */}
          <div className="mt-8 pt-6 border-t" style={{ borderColor: "var(--color-border)" }}>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] mb-4" style={{ color: "var(--color-text-tertiary)" }}>Acessos de teste</p>
            <div className="grid gap-2.5">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setEmail("admin@vavive.com");
                  setPassword("admin123");
                  void submitCredentials("admin@vavive.com", "admin123");
                }}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 disabled:opacity-60 dark:hover:bg-white/5"
                style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
                  <Sparkles size={16} />
                </div>
                <div className="text-left">
                  <p className="font-semibold" style={{ color: "var(--color-text-primary)" }}>Administrador</p>
                  <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Acesso completo à rede</p>
                </div>
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setEmail("franquia@vavive.com");
                  setPassword("admin123");
                  void submitCredentials("franquia@vavive.com", "admin123");
                }}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 disabled:opacity-60 dark:hover:bg-white/5"
                style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                  <Bot size={16} />
                </div>
                <div className="text-left">
                  <p className="font-semibold" style={{ color: "var(--color-text-primary)" }}>Franquia</p>
                  <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Acesso à unidade</p>
                </div>
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <p className="mt-6 text-center text-xs" style={{ color: "var(--color-text-tertiary)" }}>
          Vavive Agent Studio &mdash; Plataforma de gestão
        </p>
      </div>
    </main>
  );
}

