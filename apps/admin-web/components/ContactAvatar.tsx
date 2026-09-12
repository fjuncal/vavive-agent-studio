"use client";

import { UserRound } from "lucide-react";
import { useEffect, useState } from "react";

// The provider owns these avatar URLs; keep the browser request direct and
// avoid introducing an image optimizer/configuration dependency for contacts.
/* eslint-disable @next/next/no-img-element */

export function displayCustomerName(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed && trimmed.toLowerCase() !== "desconhecido" ? trimmed : "Contato sem nome";
}

function contactInitials(value?: string | null) {
  const name = displayCustomerName(value);
  if (name === "Contato sem nome") {
    return null;
  }
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function ContactAvatar({
  name,
  src,
  size = "md"
}: {
  name?: string | null;
  src?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const sizeClass = size === "lg" ? "h-11 w-11 text-sm" : size === "sm" ? "h-8 w-8 text-xs" : "h-9 w-9 text-xs";
  const initials = contactInitials(name);

  useEffect(() => setImageFailed(false), [src]);

  if (src && !imageFailed) {
    return (
      <img
        src={src}
        alt=""
        className={`${sizeClass} shrink-0 rounded-full object-cover ring-1 ring-black/5`}
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <span
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-800 dark:bg-brand-900/40 dark:text-brand-200`}
      aria-hidden="true"
    >
      {initials || <UserRound size={size === "lg" ? 18 : 15} />}
    </span>
  );
}
