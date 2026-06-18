"use client";

import { useState, type ReactNode } from "react";
import clsx from "clsx";

export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
  badge?: string;
}

export function TabConfig({
  tabs,
  defaultTab,
  onTabChange
}: {
  tabs: TabItem[];
  defaultTab?: string;
  onTabChange?: (tabId: string) => void;
}) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || "");

  const handleChange = (id: string) => {
    setActiveTab(id);
    onTabChange?.(id);
  };

  const active = tabs.find((t) => t.id === activeTab);

  return (
    <div className="space-y-6">
      {/* Tab navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-1 overflow-x-auto -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleChange(tab.id)}
              className={clsx(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                activeTab === tab.id
                  ? "border-brand-600 text-brand-600 dark:text-brand-400 dark:border-brand-400"
                  : "border-transparent hover:border-gray-300 dark:hover:border-gray-600"
              )}
              style={activeTab !== tab.id ? { color: "var(--color-text-secondary)" } : undefined}
            >
              {tab.icon}
              {tab.label}
              {tab.badge && (
                <span className="ml-1 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400 px-2 py-0.5 text-xs font-medium">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {active && <div>{active.content}</div>}
    </div>
  );
}
