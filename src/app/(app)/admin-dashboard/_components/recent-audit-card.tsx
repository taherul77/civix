"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useAuditQuery } from "@/server/queries";
import { useT } from "@/lib/i18n";

const formatTime = (iso: string) => {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

const ACTION_TONE: Record<string, string> = {
  create:        "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  update:        "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300",
  delete:        "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  login:         "bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-300",
  logout:        "bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-300",
  approve:       "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  review:        "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  sign:          "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  invoice:       "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300",
  settings:      "bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-300",
  calibration:   "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
};

export function RecentAuditCard() {
  const tt = useT();
  const { data: audit = [] } = useAuditQuery({ limit: 8 });

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">{tt("Recent audit activity")}</h3>
        <Link href="/audit" className="text-xs text-brand-600 hover:underline inline-flex items-center gap-1">
          {tt("View all")} <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {audit.length === 0 ? (
        <div className="text-sm text-[rgb(var(--muted))] py-8 text-center">
          {tt("No audit events yet")}
        </div>
      ) : (
        <ul className="space-y-2">
          {audit.map((a) => (
            <li
              key={a.id}
              className="flex items-start gap-3 text-sm py-2 border-b border-[rgb(var(--border))] last:border-0"
            >
              <span
                className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                  ACTION_TONE[a.action] ?? "bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-300"
                }`}
              >
                {a.action}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate">
                  <span className="font-medium">{a.user}</span>
                  <span className="text-[rgb(var(--muted))]"> · {a.entity}</span>
                  <span className="text-[rgb(var(--muted))] font-mono text-xs"> {a.entityId}</span>
                </div>
                <div className="text-xs text-[rgb(var(--muted))]">{formatTime(a.ts)}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
