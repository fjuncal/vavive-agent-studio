"use client";

import { login } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Eye, EyeOff, Loader2, LockKeyhole, Mail, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function LoginPage() {
  const router = useRouter();
  const { clearSession, refreshMe, setSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitCredentials(email, password);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-bg-secondary">
      <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-brand-100/50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-brand-50/70 blur-3xl" />

      <div className="relative mx-auto grid min-h-screen w-full max-w-[1360px] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden bg-ink px-10 py-10 text-white lg:flex lg:flex-col lg:justify-between xl:px-16">
          <div className="absolute -right-24 top-20 h-72 w-72 rounded-full border border-white/10" />
          <div className="absolute bottom-12 left-12 h-24 w-24 rounded-3xl bg-brand-500/15 blur-2xl" />

          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white">
                <Sparkles size={21} />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-[0.18em] text-brand-200">VAVIVE</p>
                <p className="text-xs text-white/55">Agent Studio</p>
              </div>
            </div>

            <div className="mt-24 max-w-xl">
              <p className="text-sm font-medium text-brand-300">Central de atendimento</p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.03em] xl:text-[2.75rem]">
                Conversas mais humanas, operações mais simples.
              </h1>
              <p className="mt-6 max-w-md text-base leading-7 text-white/65">
                Acompanhe agentes, franquias e atendimentos em um só lugar, com a clareza que sua equipe precisa para agir rápido.
              </p>
            </div>
          </div>

          <div className="relative flex items-center gap-3 text-xs text-white/45">
            <span className="h-2 w-2 rounded-full bg-brand-400 shadow-[0_0_0_5px_rgba(69,181,163,0.12)]" />
            Ambiente protegido para sua equipe
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-14 xl:px-20">
          <div className="w-full max-w-md">
            <div className="mb-10 lg:hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-white">
                  <Sparkles size={21} />
                </div>
                <div>
                  <p className="text-sm font-semibold tracking-[0.18em] text-brand-700">VAVIVE</p>
                  <p className="text-xs text-text-tertiary">Agent Studio</p>
                </div>
              </div>
            </div>

            <header>
              <p className="text-sm font-medium text-brand-700 dark:text-brand-400">Área restrita</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-text-primary">Bem-vindo de volta</h2>
              <p className="mt-3 text-sm leading-6 text-text-secondary">Entre para acompanhar seus atendimentos e sua operação.</p>
            </header>

            <form className="mt-9 grid gap-5" onSubmit={handleSubmit}>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-text-primary">Email</span>
                <div className="flex items-center gap-3 rounded-xl border bg-bg-primary px-3.5 py-3 transition-colors focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-100">
                  <Mail size={18} className="shrink-0 text-text-tertiary" />
                  <input
                    className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-tertiary"
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
                <span className="text-sm font-medium text-text-primary">Senha</span>
                <div className="flex items-center gap-3 rounded-xl border bg-bg-primary px-3.5 py-3 transition-colors focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-100">
                  <LockKeyhole size={18} className="shrink-0 text-text-tertiary" />
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-tertiary"
                    placeholder="Sua senha"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={isSubmitting}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    onClick={() => setShowPassword((current) => !current)}
                    className="shrink-0 rounded-lg p-1.5 text-text-tertiary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </label>

              {error ? (
                  <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm leading-5 text-rose-700">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-600">!</span>
                  <span>{error}</span>
                </div>
              ) : null}

              <button type="submit" disabled={isSubmitting} className="btn-primary mt-2 min-h-12 w-full rounded-xl disabled:cursor-not-allowed disabled:opacity-60">
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

            <p className="mt-8 text-center text-xs leading-5 text-text-tertiary">
              Acesso exclusivo para usuários autorizados da Vavive.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
