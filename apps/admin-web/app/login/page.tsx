"use client";

import { login } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Bot, LockKeyhole, Mail, Sparkles } from "lucide-react";
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
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-[440px]">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-ink">
            <Sparkles size={24} className="text-white" />
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-ink">Vavive Agent Studio</h1>
          <p className="mt-2 text-sm text-slate-500">Gestão de franquias, agentes e atendimentos.</p>
        </div>

        <section className="rounded-2xl border border-line bg-white p-8 shadow-soft">
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <div className="flex items-center gap-2 rounded-xl border border-line px-3 py-2.5 transition focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-50">
                <Mail size={17} className="text-slate-400" />
                <input
                  className="w-full outline-none text-sm text-ink placeholder:text-slate-400"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-slate-700">Senha</span>
              <div className="flex items-center gap-2 rounded-xl border border-line px-3 py-2.5 transition focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-50">
                <LockKeyhole size={17} className="text-slate-400" />
                <input
                  type="password"
                  className="w-full outline-none text-sm text-ink placeholder:text-slate-400"
                  placeholder="Sua senha"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
            </label>
            {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 inline-flex items-center justify-center rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-70"
            >
              {isSubmitting ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <details className="mt-6">
            <summary className="cursor-pointer text-xs font-medium text-slate-400 hover:text-slate-600 transition select-none">
              Acessos de teste
            </summary>
            <div className="mt-4 grid gap-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setEmail("admin@vavive.com");
                  setPassword("admin123");
                  void submitCredentials("admin@vavive.com", "admin123");
                }}
                className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                Acessar como Administrador
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setEmail("franquia@vavive.com");
                  setPassword("admin123");
                  void submitCredentials("franquia@vavive.com", "admin123");
                }}
                className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                Acessar como Franquia
              </button>
            </div>
          </details>
        </section>

        <p className="mt-6 text-center text-xs text-slate-400">
          Vavive Agent Studio &mdash; Plataforma de gestão
        </p>
      </div>
    </main>
  );
}
