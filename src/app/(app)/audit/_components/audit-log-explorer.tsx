"use client";

import { useMemo } from "react";
import { Shield } from "lucide-react";
import { audit as seedAudit } from "@/lib/mock-extra";
import { useAuditQuery } from "@/server/queries";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";

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

interface AuditRow {
  id: string;
  ts: string;
  user: string;
  action: string;
  entity: string;
  entityId: string;
  diff?: Array<{ field: string; from: unknown; to: unknown }>;
  ip?: string;
}

export function AuditLogExplorer() {
  const tt = useT();
  const { data: liveAudit = [], isLoading, error } = useAuditQuery();
  const merged: AuditRow[] = useMemo(
    () => [
      ...liveAudit.map((a) => ({
        id: a.id,
        ts: a.ts,
        user: a.user,
        action: a.action,
        entity: a.entity.charAt(0).toUpperCase() + a.entity.slice(1),
        entityId: a.entityId,
        diff: a.diff,
        ip: a.ip,
      })),
      ...seedAudit,
    ],
    [liveAudit]
  );

  const columns: ColumnDef<AuditRow>[] = [
    {
      key: "ts",
      header: tt("Timestamp"),
      cell: (a) => <span className="font-mono text-xs whitespace-nowrap">{a.ts}</span>,
      sort: (a, b) => a.ts.localeCompare(b.ts),
    },
    {
      key: "user",
      header: tt("User"),
      cell: (a) => <span className="font-medium">{a.user}</span>,
      sort: (a, b) => a.user.localeCompare(b.user),
    },
    {
      key: "action",
      header: tt("Action"),
      cell: (a) => <span className={cn("badge capitalize", actionTone[a.action])}>{a.action}</span>,
      sort: (a, b) => a.action.localeCompare(b.action),
    },
    {
      key: "entity",
      header: tt("Entity"),
      cell: (a) => a.entity,
      sort: (a, b) => a.entity.localeCompare(b.entity),
    },
    {
      key: "entityId",
      header: tt("Entity ID"),
      cell: (a) => <span className="font-mono text-xs">{a.entityId}</span>,
    },
    {
      key: "diff",
      header: tt("Diff"),
      cell: (a) => (
        <div className="text-xs">
          {a.diff ? a.diff.map((d) => (
            <div key={d.field} className="font-mono">
              <span className="text-[rgb(var(--muted))]">{d.field}:</span>{" "}
              <span className="text-rose-600 line-through">{String(d.from)}</span>{" → "}
              <span className="text-emerald-600">{String(d.to)}</span>
            </div>
          )) : <span className="text-[rgb(var(--muted))]">—</span>}
        </div>
      ),
    },
    {
      key: "ip",
      header: tt("IP"),
      cell: (a) => <span className="font-mono text-xs">{a.ip}</span>,
    },
  ];

  const toolbar = (
    <div className="flex items-center gap-1 text-xs text-[rgb(var(--muted))]">
      <Shield className="w-3.5 h-3.5" /> {tt("Tamper-evident · SHA-256 chained")}
    </div>
  );

  return (
    <DataTable
      rows={merged}
      columns={columns}
      getRowId={(a) => a.id}
      loading={isLoading}
      error={error?.message ?? null}
      searchable
      searchPlaceholder={tt("Search by user, entity, action…")}
      searchFilter={(a, q) =>
        `${a.user} ${a.action} ${a.entity} ${a.entityId}`.toLowerCase().includes(q)
      }
      toolbar={toolbar}
      empty={tt("No audit events")}
    />
  );
}
