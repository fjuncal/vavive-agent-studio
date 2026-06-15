"use client";

import { login } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Bot, LockKeyhole, Mail, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const { clearSession, refreshMe, setSession } = useAuth();
  const [email, setEmail] = useState("admin@vavive.com");
  const [password, setPassword] = useState("admin123");
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
        setError("Nao foi possivel validar a sessao criada. Entre novamente.");
        return;
      }
      router.replace("/dashboard");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel entrar.");
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
      <section className="grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-line bg-white shadow-soft lg:grid-cols-[1.05fr_0.95fr]">
        <div className="bg-ink p-8 text-white sm:p-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12">
            <Sparkles size={22} />
          </div>
          <h1 className="mt-8 max-w-md text-3xl font-semibold tracking-tight sm:text-4xl">Vavive GPTMaker Platform</h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-white/70">
            Gerencie franquias, leads, treinamento do agente e regras comerciais em uma camada segura sobre o GPTMaker.
          </p>
          <div className="mt-10 grid gap-3 text-sm text-white/78">
            <div className="rounded-2xl bg-white/8 p-4">Login Vavive com JWT. GPTMaker protegido pelo backend.</div>
            <div className="rounded-2xl bg-white/8 p-4">Setup guiado para transformar dados da franquia em treinamento.</div>
            <div className="rounded-2xl bg-white/8 p-4">Visao clara de leads, agentes, intencoes e regras.</div>
          </div>
        </div>

        <div className="p-8 sm:p-10">
          <div className="mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
              <Bot size={22} />
            </div>
            <h2 className="mt-5 text-2xl font-semibold tracking-tight text-ink">Entrar no painel</h2>
            <p className="mt-2 text-sm text-slate-500">Use o acesso inicial do seed para explorar o MVP.</p>
          </div>

          <form className="grid gap-4" onSubmit={handleSubmit}>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <div className="flex items-center gap-2 rounded-xl border border-line px-3 py-2.5">
                <Mail size={17} className="text-slate-400" />
                <input
                  className="w-full outline-none"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-slate-700">Senha</span>
              <div className="flex items-center gap-2 rounded-xl border border-line px-3 py-2.5">
                <LockKeyhole size={17} className="text-slate-400" />
                <input
                  type="password"
                  className="w-full outline-none"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={isSubmitting}
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
            <div className="grid gap-2 rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-700">Acesso rapido para testes do MVP.</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    setEmail("admin@vavive.com");
                    setPassword("admin123");
                    void submitCredentials("admin@vavive.com", "admin123");
                  }}
                  className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-60"
                >
                  Entrar como SUPER_ADMIN
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    setEmail("franquia@vavive.com");
                    setPassword("admin123");
                    void submitCredentials("franquia@vavive.com", "admin123");
                  }}
                  className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-60"
                >
                  Entrar como ADMIN_FRANQUIA
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
