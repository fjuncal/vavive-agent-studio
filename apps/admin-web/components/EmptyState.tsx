import type { LucideIcon } from "lucide-react";
import Link from "next/link";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="card text-center py-12 px-6">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400 mb-4">
        <Icon size={24} />
      </div>
      <h3 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6" style={{ color: "var(--color-text-secondary)" }}>{description}</p>
      {action && (
        <Link
          href={action.href}
          className="btn-primary mt-6 inline-flex"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
