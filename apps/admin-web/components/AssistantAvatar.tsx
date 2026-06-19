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

const BG_COLORS = [
  "#EEF2FF", "#ECFDF5", "#FFF7ED", "#FDF2F8",
  "#F0F9FF", "#FEF3C7", "#F3E8FF", "#ECFCCB",
  "#E0F2FE", "#D1FAE5", "#FEF9C3", "#FCE7F3"
];

const BODY_COLORS = [
  "#6366F1", "#10B981", "#F97316", "#EC4899",
  "#3B82F6", "#EAB308", "#8B5CF6", "#14B8A6",
  "#EF4444", "#06B6D4", "#A855F7", "#F59E0B"
];

const FACE_STYLES = ["robot", "alien", "monster", "cat"];
const EYE_STYLES = ["big", "sleepy", "wink", "star"];
const MOUTH_STYLES = ["happy", "grin", "tongue", "ooh"];
const ACCESSORY_STYLES = ["none", "crown", "bow", "glasses", "halo"];

export function buildGamifiedAvatarDataUri(seed: string): string {
  const h = hashCode(seed);
  const bg = BG_COLORS[h % BG_COLORS.length];
  const body = BODY_COLORS[(h >> 3) % BODY_COLORS.length];
  const faceStyle = FACE_STYLES[(h >> 6) % FACE_STYLES.length];
  const eyeStyle = EYE_STYLES[(h >> 9) % EYE_STYLES.length];
  const mouthStyle = MOUTH_STYLES[(h >> 12) % MOUTH_STYLES.length];
  const accessoryStyle = ACCESSORY_STYLES[(h >> 15) % ACCESSORY_STYLES.length];

  // Body shape based on face style
  const bodyShape = faceStyle === "robot"
    ? `<rect x="76" y="60" width="104" height="110" rx="28" fill="${body}"/>
       <rect x="68" y="76" width="12" height="40" rx="6" fill="${body}"/>
       <rect x="176" y="76" width="12" height="40" rx="6" fill="${body}"/>`
    : faceStyle === "alien"
    ? `<ellipse cx="128" cy="110" rx="60" ry="55" fill="${body}"/>
       <ellipse cx="128" cy="70" rx="30" ry="20" fill="${body}" opacity="0.8"/>`
    : faceStyle === "monster"
    ? `<path d="M68 80 Q68 50 128 50 Q188 50 188 80 L188 150 Q188 180 128 180 Q68 180 68 150 Z" fill="${body}"/>
       <path d="M80 180 L90 200 L100 180" fill="${body}"/>
       <path d="M156 180 L166 200 L176 180" fill="${body}"/>`
    : `<circle cx="128" cy="110" r="56" fill="${body}"/>
       <ellipse cx="90" cy="110" rx="20" ry="18" fill="${body}" opacity="0.8"/>
       <ellipse cx="166" cy="110" rx="20" ry="18" fill="${body}" opacity="0.8"/>`;

  // Eyes
  const eyes = eyeStyle === "big"
    ? `<circle cx="104" cy="105" r="16" fill="white"/>
       <circle cx="152" cy="105" r="16" fill="white"/>
       <circle cx="108" cy="103" r="8" fill="#1E293B"/>
       <circle cx="156" cy="103" r="8" fill="#1E293B"/>
       <circle cx="110" cy="100" r="3" fill="white"/>
       <circle cx="158" cy="100" r="3" fill="white"/>`
    : eyeStyle === "sleepy"
    ? `<ellipse cx="104" cy="108" rx="14" ry="8" fill="white"/>
       <ellipse cx="152" cy="108" rx="14" ry="8" fill="white"/>
       <circle cx="108" cy="108" r="5" fill="#1E293B"/>
       <circle cx="156" cy="108" r="5" fill="#1E293B"/>`
    : eyeStyle === "wink"
    ? `<circle cx="104" cy="105" r="14" fill="white"/>
       <circle cx="108" cy="103" r="7" fill="#1E293B"/>
       <circle cx="110" cy="100" r="2.5" fill="white"/>
       <path d="M140 105 Q152 95 164 105" stroke="white" stroke-width="4" fill="none" stroke-linecap="round"/>`
    : `<path d="M92 105 L104 95 L116 105 L104 115 Z" fill="white"/>
       <path d="M140 105 L152 95 L164 105 L152 115 Z" fill="white"/>
       <circle cx="104" cy="105" r="4" fill="#1E293B"/>
       <circle cx="152" cy="105" r="4" fill="#1E293B"/>`;

  // Mouth
  const mouth = mouthStyle === "happy"
    ? `<path d="M104 135 Q128 158 152 135" stroke="white" stroke-width="4" fill="none" stroke-linecap="round"/>`
    : mouthStyle === "grin"
    ? `<path d="M96 132 Q128 165 160 132" fill="white"/>
       <path d="M104 132 Q128 145 152 132" fill="${body}"/>`
    : mouthStyle === "tongue"
    ? `<path d="M104 135 Q128 155 152 135" stroke="white" stroke-width="4" fill="none" stroke-linecap="round"/>
       <ellipse cx="128" cy="150" rx="8" ry="6" fill="#EF4444"/>`
    : `<ellipse cx="128" cy="142" rx="12" ry="10" fill="white"/>`;

  // Cheeks (blush)
  const cheeks = `<circle cx="80" cy="125" r="10" fill="#FCA5A5" opacity="0.4"/>
                   <circle cx="176" cy="125" r="10" fill="#FCA5A5" opacity="0.4"/>`;

  // Accessory
  const accessory = accessoryStyle === "crown"
    ? `<path d="M92 58 L104 38 L118 52 L128 32 L138 52 L152 38 L164 58" fill="#EAB308" stroke="#CA8A04" stroke-width="2"/>
       <circle cx="104" cy="40" r="3" fill="#EF4444"/>
       <circle cx="128" cy="34" r="3" fill="#3B82F6"/>
       <circle cx="152" cy="40" r="3" fill="#10B981"/>`
    : accessoryStyle === "bow"
    ? `<path d="M108 52 Q88 32 108 22 Q118 28 128 22 Q138 28 148 22 Q168 32 148 52 Q138 46 128 52 Q118 46 108 52" fill="#EC4899"/>
       <circle cx="128" cy="42" r="5" fill="#F472B6"/>`
    : accessoryStyle === "glasses"
    ? `<circle cx="104" cy="105" r="20" fill="none" stroke="#1E293B" stroke-width="4"/>
       <circle cx="152" cy="105" r="20" fill="none" stroke="#1E293B" stroke-width="4"/>
       <line x1="124" y1="105" x2="132" y2="105" stroke="#1E293B" stroke-width="4"/>
       <line x1="84" y1="105" x2="72" y2="100" stroke="#1E293B" stroke-width="3"/>
       <line x1="172" y1="105" x2="184" y2="100" stroke="#1E293B" stroke-width="3"/>`
    : accessoryStyle === "halo"
    ? `<ellipse cx="128" cy="52" rx="32" ry="8" fill="none" stroke="#EAB308" stroke-width="4"/>
       <ellipse cx="128" cy="52" rx="32" ry="8" fill="#EAB308" opacity="0.2"/>`
    : "";

  // Antenna for robot
  const antenna = faceStyle === "robot"
    ? `<line x1="128" y1="60" x2="128" y2="38" stroke="${body}" stroke-width="4" stroke-linecap="round"/>
       <circle cx="128" cy="34" r="6" fill="${body}"/>
       <circle cx="128" cy="34" r="3" fill="white" opacity="0.6"/>`
    : "";

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
      <rect width="256" height="256" rx="48" fill="${bg}"/>
      ${bodyShape}
      ${antenna}
      ${eyes}
      ${cheeks}
      ${mouth}
      ${accessory}
      <rect x="88" y="180" width="80" height="24" rx="12" fill="${body}" opacity="0.7"/>
      <rect x="76" y="192" width="104" height="16" rx="8" fill="${body}" opacity="0.5"/>
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
