"use client";

import { ShieldCheck, ShieldAlert } from "lucide-react";
import { useAuditQuery } from "@/server/queries";
import { verifyChain } from "@/server/audit-chain";

export function ChainIntegrity() {
  const { data: entries = [] } = useAuditQuery();
  const liveCount = entries.length;
  const result = verifyChain(entries);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="card p-5 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl grid place-items-center ${
          result.ok
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
            : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
        }`}>
          {result.ok ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-[rgb(var(--muted))] font-medium">
            Chain integrity
          </div>
          <div className="text-2xl font-semibold mt-0.5">
            {result.ok ? "Intact" : "Broken"}
          </div>
          {!result.ok && result.brokenAt && (
            <div className="text-xs text-rose-600 mt-1 font-mono">at {result.brokenAt}</div>
          )}
        </div>
      </div>

      <div className="card p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl grid place-items-center bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-[rgb(var(--muted))] font-medium">
            Tracked entries
          </div>
          <div className="text-2xl font-semibold mt-0.5">{liveCount}</div>
        </div>
      </div>

      <div className="card p-5">
        <div className="text-xs uppercase tracking-wider text-[rgb(var(--muted))] font-medium mb-1">
          Algorithm
        </div>
        <div className="font-medium">FNV-1a 64 (canonical chain)</div>
        <div className="text-xs text-[rgb(var(--muted))] mt-1">
          Each row hashes <code className="font-mono">prevHash + canonical(row)</code>.
          ISO 17025 §8.4 — 7-year retention.
        </div>
      </div>
    </div>
  );
}
