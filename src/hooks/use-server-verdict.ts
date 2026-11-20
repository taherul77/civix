"use client";

import { useEffect, useState } from "react";
import { evaluateTest, isBackendActive, type EngineEvaluation } from "@/lib/api-client";

/**
 * Debounced server-side evaluation for custom test forms. When signed in
 * against the backend, `server` holds the authoritative verdict; otherwise it
 * stays null and the form keeps its local preview.
 */
export function useServerVerdict(code: string, payload: Record<string, number | string | number[]>) {
  const [server, setServer] = useState<EngineEvaluation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const key = JSON.stringify(payload);

  useEffect(() => {
    if (!isBackendActive()) return;
    let cancelled = false;
    const t = setTimeout(() => {
      evaluateTest(code, JSON.parse(key))
        .then((r) => { if (!cancelled) { setServer(r); setError(null); } })
        .catch((e: Error) => { if (!cancelled) { setServer(null); setError(e.message); } });
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [code, key]);

  return { server, error };
}

/** Engine verdict -> the pass/fail flag the forms store ("warning" counts as pass). */
export function verdictOf(server: EngineEvaluation | null, local: "pass" | "fail"): "pass" | "fail" {
  if (!server) return local;
  return server.overall === "fail" ? "fail" : "pass";
}
