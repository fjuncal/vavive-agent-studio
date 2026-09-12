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
    <div className="flex min-h-40 flex-col items-center justify-center px-6 py-10 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
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
