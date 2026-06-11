import { Bot, LockKeyhole, Mail, Sparkles } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
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

          <form className="grid gap-4">
            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <div className="flex items-center gap-2 rounded-xl border border-line px-3 py-2.5">
                <Mail size={17} className="text-slate-400" />
                <input className="w-full outline-none" defaultValue="admin@vavive.com" />
              </div>
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-slate-700">Senha</span>
              <div className="flex items-center gap-2 rounded-xl border border-line px-3 py-2.5">
                <LockKeyhole size={17} className="text-slate-400" />
                <input type="password" className="w-full outline-none" defaultValue="admin123" />
              </div>
            </label>
            <Link href="/dashboard" className="mt-2 inline-flex items-center justify-center rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-slate-800">
              Entrar
            </Link>
          </form>
        </div>
      </section>
    </main>
  );
}
