"use client";

import { Bot } from "lucide-react";
import { useState } from "react";

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

const BG_COLORS = ["#EEF2FF", "#ECFDF5", "#FFF7ED", "#FDF2F8", "#F0F9FF", "#FEF3C7", "#F3E8FF", "#ECFCCB"];
const BODY_COLORS = ["#4F46E5", "#047857", "#C2410C", "#BE185D", "#0369A1", "#B45309", "#7C3AED", "#65A30D"];
const EYE_STYLES = ["round", "square", "dot"];
const MOUTH_STYLES = ["smile", "neutral", "open", "grin"];
const ANTENNA_STYLES = ["single", "double", "none"];
const ACCESSORY_STYLES = ["none", "headphones", "hat"];

export function buildGamifiedAvatarDataUri(seed: string): string {
  const h = hashCode(seed);
  const bg = BG_COLORS[h % BG_COLORS.length];
  const body = BODY_COLORS[(h >> 3) % BODY_COLORS.length];
  const eyeStyle = EYE_STYLES[(h >> 6) % EYE_STYLES.length];
  const mouthStyle = MOUTH_STYLES[(h >> 9) % MOUTH_STYLES.length];
  const antennaStyle = ANTENNA_STYLES[(h >> 12) % ANTENNA_STYLES.length];
  const accessoryStyle = ACCESSORY_STYLES[(h >> 15) % ACCESSORY_STYLES.length];

  const eyes = eyeStyle === "round"
    ? `<circle cx="100" cy="120" r="12" fill="white"/><circle cx="156" cy="120" r="12" fill="white"/><circle cx="103" cy="118" r="5" fill="${body}"/><circle cx="159" cy="118" r="5" fill="${body}"/>`
    : eyeStyle === "square"
    ? `<rect x="88" y="108" width="24" height="24" rx="4" fill="white"/><rect x="144" y="108" width="24" height="24" rx="4" fill="white"/><rect x="96" y="114" width="8" height="8" rx="2" fill="${body}"/><rect x="152" y="114" width="8" height="8" rx="2" fill="${body}"/>`
    : `<circle cx="100" cy="120" r="6" fill="white"/><circle cx="156" cy="120" r="6" fill="white"/>`;

  const mouth = mouthStyle === "smile"
    ? `<path d="M108 158 Q128 178 148 158" stroke="white" stroke-width="4" fill="none" stroke-linecap="round"/>`
    : mouthStyle === "neutral"
    ? `<line x1="108" y1="162" x2="148" y2="162" stroke="white" stroke-width="4" stroke-linecap="round"/>`
    : mouthStyle === "open"
    ? `<ellipse cx="128" cy="164" rx="16" ry="10" fill="white"/>`
    : `<path d="M104 158 Q116 174 128 158 Q140 174 152 158" stroke="white" stroke-width="3" fill="none" stroke-linecap="round"/>`;

  const antenna = antennaStyle === "single"
    ? `<line x1="128" y1="60" x2="128" y2="40" stroke="${body}" stroke-width="4" stroke-linecap="round"/><circle cx="128" cy="36" r="6" fill="${body}"/>`
    : antennaStyle === "double"
    ? `<line x1="104" y1="64" x2="96" y2="40" stroke="${body}" stroke-width="3" stroke-linecap="round"/><circle cx="96" cy="36" r="5" fill="${body}"/><line x1="152" y1="64" x2="160" y2="40" stroke="${body}" stroke-width="3" stroke-linecap="round"/><circle cx="160" cy="36" r="5" fill="${body}"/>`
    : "";

  const accessory = accessoryStyle === "headphones"
    ? `<path d="M80 110 Q80 70 128 70 Q176 70 176 110" stroke="${body}" stroke-width="6" fill="none"/><rect x="72" y="106" width="16" height="24" rx="8" fill="${body}"/><rect x="168" y="106" width="16" height="24" rx="8" fill="${body}"/>`
    : accessoryStyle === "hat"
    ? `<rect x="88" y="56" width="80" height="12" rx="6" fill="${body}"/><rect x="100" y="36" width="56" height="24" rx="8" fill="${body}"/>`
    : "";

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
      <rect width="256" height="256" rx="48" fill="${bg}"/>
      <rect x="76" y="64" width="104" height="120" rx="24" fill="${body}"/>
      <rect x="88" y="80" width="80" height="88" rx="16" fill="${bg}" opacity="0.3"/>
      ${eyes}
      ${mouth}
      ${antenna}
      ${accessory}
      <rect x="60" y="188" width="136" height="28" rx="14" fill="${body}" opacity="0.8"/>
      <circle cx="96" cy="202" r="4" fill="white" opacity="0.6"/>
      <circle cx="128" cy="202" r="4" fill="white" opacity="0.6"/>
      <circle cx="160" cy="202" r="4" fill="white" opacity="0.6"/>
    </svg>
  `.trim();
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

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
