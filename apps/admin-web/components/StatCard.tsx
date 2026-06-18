import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    positive: boolean;
  };
  variant?: "default" | "success" | "warning" | "danger";
};

const variantStyles = {
  default: {
    iconBg: "bg-brand-50 dark:bg-brand-900/30",
    iconText: "text-brand-700 dark:text-brand-400",
    accent: "from-brand-500 to-brand-600"
  },
  success: {
    iconBg: "bg-emerald-50 dark:bg-emerald-900/30",
    iconText: "text-emerald-700 dark:text-emerald-400",
    accent: "from-emerald-500 to-emerald-600"
  },
  warning: {
    iconBg: "bg-amber-50 dark:bg-amber-900/30",
    iconText: "text-amber-700 dark:text-amber-400",
    accent: "from-amber-500 to-amber-600"
  },
  danger: {
    iconBg: "bg-rose-50 dark:bg-rose-900/30",
    iconText: "text-rose-700 dark:text-rose-400",
    accent: "from-rose-500 to-rose-600"
  }
};

export function StatCard({ label, value, hint, icon: Icon, trend, variant = "default" }: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <div className="stat-card group">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] truncate" style={{ color: "var(--color-text-tertiary)" }}>{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight" style={{ color: "var(--color-text-primary)" }}>{value}</p>
        </div>
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${styles.iconBg} ${styles.iconText} transition-transform duration-200 group-hover:scale-110`}>
          <Icon size={22} />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2">
        <p className="text-xs truncate" style={{ color: "var(--color-text-secondary)" }}>{hint}</p>
        {trend && (
          <span className={`text-xs font-semibold ${trend.positive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
            {trend.positive ? "↑" : "↓"} {trend.value}
          </span>
        )}
      </div>
    </div>
  );
}
