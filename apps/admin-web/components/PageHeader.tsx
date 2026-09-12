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
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div>
        {backHref && (
          <Link
            href={backHref}
            className="mb-2 inline-flex items-center gap-1 text-sm transition-colors hover:text-brand-600 dark:hover:text-brand-400"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <ChevronLeft size={16} />
            Voltar
          </Link>
        )}
        {eyebrow && (
          <p className="mb-1 text-xs font-semibold text-brand-700 dark:text-brand-400">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-semibold tracking-[-0.025em] sm:text-[1.7rem]" style={{ color: "var(--color-text-primary)" }}>{title}</h1>
        {description && (
          <p className="mt-1 max-w-2xl text-sm leading-5" style={{ color: "var(--color-text-secondary)" }}>{description}</p>
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
