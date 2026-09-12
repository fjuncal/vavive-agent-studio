"use client";

import Link from "next/link";
import { Coins } from "lucide-react";
import { getWorkspaceCredits, type WorkspaceCredits } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";

const CREDIT_CACHE_TTL_MS = 2 * 60 * 1000;
let cachedCredits: { franchiseId: string; value: WorkspaceCredits; fetchedAt: number } | null = null;
let pendingCredits: { franchiseId: string; promise: Promise<WorkspaceCredits> } | null = null;

function loadCredits(franchiseId: string) {
  if (cachedCredits?.franchiseId === franchiseId && Date.now() - cachedCredits.fetchedAt < CREDIT_CACHE_TTL_MS) {
    return Promise.resolve(cachedCredits.value);
  }
  if (pendingCredits?.franchiseId === franchiseId) {
    return pendingCredits.promise;
  }
  const promise = getWorkspaceCredits(franchiseId)
    .then((value) => {
      cachedCredits = { franchiseId, value, fetchedAt: Date.now() };
      return value;
    })
    .finally(() => {
      if (pendingCredits?.franchiseId === franchiseId) pendingCredits = null;
    });
  pendingCredits = { franchiseId, promise };
  return promise;
}

export function WorkspaceCreditsPill() {
  const { user } = useAuth();
  const franchiseId = user?.franchise?.id;
  const initialCredits = user?.franchise?.workspaceCredits ?? null;
  const [credits, setCredits] = useState<WorkspaceCredits | null>(initialCredits);

  useEffect(() => {
    if (!franchiseId) return;
    let active = true;
    loadCredits(franchiseId)
      .then((value) => {
        if (active) setCredits(value);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [franchiseId]);

  if (user?.role === "SUPER_ADMIN") {
    return (
      <Link href="/franquias" className="credits-pill" aria-label="Consultar saldos GPTMaker por unidade">
        <Coins size={16} aria-hidden="true" />
        <span className="min-w-0">
          <span className="credits-pill-label hidden sm:block">Créditos GPTMaker</span>
          <span className="credits-pill-value">Por unidade</span>
        </span>
      </Link>
    );
  }

  const available = credits?.status === "AVAILABLE" || credits?.status === "STALE";
  return (
    <div className="credits-pill" title={credits?.message ?? undefined}>
      <Coins size={16} aria-hidden="true" />
      <span className="min-w-0">
        <span className="credits-pill-label hidden sm:block">Saldo GPTMaker</span>
        <span className="credits-pill-value tabular-nums">
          {available ? credits.remaining.toLocaleString("pt-BR") : "Indisponível"}
        </span>
      </span>
    </div>
  );
}
