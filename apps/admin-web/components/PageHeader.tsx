import Link from "next/link";
import { ChevronLeft } from "lucide-react";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  backHref?: string;
};

export function PageHeader({ eyebrow, title, description, actionLabel, actionHref, backHref }: PageHeaderProps) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end animate-in">
      <div>
        {backHref && (
          <Link
            href={backHref}
            className="inline-flex items-center gap-1 text-sm transition-colors mb-3 hover:text-brand-600 dark:hover:text-brand-400"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <ChevronLeft size={16} />
            Voltar
          </Link>
        )}
        {eyebrow && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-400">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl" style={{ color: "var(--color-text-primary)" }}>{title}</h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-6" style={{ color: "var(--color-text-secondary)" }}>{description}</p>
        )}
      </div>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="btn-primary shrink-0"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
