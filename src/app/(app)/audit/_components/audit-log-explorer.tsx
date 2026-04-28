"use client";

import { useMemo, useState } from "react";
import { Search, Shield } from "lucide-react";
import { audit } from "@/lib/mock-extra";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

const actionTone: Record<string, string> = {
  create: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  update: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  submit: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  review: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  approve: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  delete: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  login: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  calibration: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300",
};

export function AuditLogExplorer() {
  const tt = useT();
  const [q, setQ] = useState("");
  const filtered = useMemo(
    () => audit.filter((a) => !q || `${a.user} ${a.action} ${a.entity} ${a.entityId}`.toLowerCase().includes(q.toLowerCase())),
    [q]
  );

  return (
    <>
      <div className="card p-3 flex items-center gap-2">
        <Search className="w-4 h-4 text-[rgb(var(--muted))] mx-2" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={tt("Search by user, entity, action...")}
          className="input flex-1"
        />
        <div className="flex items-center gap-1 text-xs text-[rgb(var(--muted))] px-2">
          <Shield className="w-3.5 h-3.5" /> {tt("Tamper-evident · SHA-256 chained")}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="civix">
            <thead>
              <tr>
                <th>{tt("Timestamp")}</th>
                <th>{tt("User")}</th>
                <th>{tt("Action")}</th>
                <th>{tt("Entity")}</th>
                <th>{tt("Entity ID")}</th>
                <th>{tt("Diff")}</th>
                <th>{tt("IP")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id}>
                  <td className="font-mono text-xs whitespace-nowrap">{a.ts}</td>
                  <td className="font-medium">{a.user}</td>
                  <td>
                    <span className={cn("badge capitalize", actionTone[a.action])}>{a.action}</span>
                  </td>
                  <td>{a.entity}</td>
                  <td className="font-mono text-xs">{a.entityId}</td>
                  <td className="text-xs">
                    {a.diff ? a.diff.map((d) => (
                      <div key={d.field} className="font-mono">
                        <span className="text-[rgb(var(--muted))]">{d.field}:</span>{" "}
                        <span className="text-rose-600 line-through">{d.from}</span>{" → "}
                        <span className="text-emerald-600">{d.to}</span>
                      </div>
                    )) : <span className="text-[rgb(var(--muted))]">—</span>}
                  </td>
                  <td className="font-mono text-xs">{a.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
