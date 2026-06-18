"use client";

import { Bot } from "lucide-react";
import { useState } from "react";

export function buildAssistantAvatarDataUri(background: string, foreground: string, label: string) {
  const safeLabel = label.slice(0, 2).toUpperCase();
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
      <rect width="256" height="256" rx="48" fill="${background}"/>
      <circle cx="128" cy="104" r="44" fill="${foreground}" opacity="0.18"/>
      <rect x="56" y="152" width="144" height="42" rx="21" fill="${foreground}" opacity="0.14"/>
      <text x="128" y="144" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="72" font-weight="700" fill="${foreground}">${safeLabel}</text>
    </svg>
  `.trim();
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function AssistantAvatar({
  src,
  alt,
  fallbackLabel,
  className
}: {
  src?: string | null;
  alt: string;
  fallbackLabel: string;
  className: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center rounded-2xl bg-brand-50 text-brand-700 ${className}`}>
        {fallbackLabel ? (
          <span className="text-sm font-semibold">{fallbackLabel.slice(0, 2).toUpperCase()}</span>
        ) : (
          <Bot size={20} />
        )}
      </div>
    );
  }

  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />;
}
