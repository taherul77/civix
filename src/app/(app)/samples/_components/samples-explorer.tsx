"use client";

import { useState } from "react";
import { Filter, Pencil, Trash2, Send } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { useSamplesQuery, useProjectsQuery } from "@/server/queries";
import { useT } from "@/lib/i18n";
import { useLoc } from "@/lib/i18n-data";
import { useApp } from "@/store/app-store";
import { useCan } from "@/lib/auth-context";
import { fmtAny } from "@/lib/utils";
import { EditSampleModal } from "./edit-sample-modal";
import { DeleteSampleModal } from "./delete-sample-modal";
import { SendSampleModal } from "./send-sample-modal";
import type { SampleRecord } from "@/server/contracts";

const TYPES = ["all", "concrete", "soil", "aggregate", "asphalt", "steel", "cement", "masonry", "water"] as const;

/** Once a sample hits one of these, it's locked from edit / delete. */
const SENT_STATES = new Set<SampleRecord["status"]>(["in_test", "completed"]);

export function SamplesExplorer() {
  const tt = useT();
  const loc = useLoc();
  const lang = useApp((s) => s.lang);
  const canEdit = useCan("sample:update");
  const canDelete = useCan("sample:delete");

  const [type, setType] = useState<(typeof TYPES)[number]>("all");
  const { data: samples = [], isLoading, error } = useSamplesQuery({ type });
  const { data: projects = [] } = useProjectsQuery();
  const projectsById = new Map(projects.map((p) => [p.id, p]));

  const [editing, setEditing] = useState<SampleRecord | null>(null);
  const [removing, setRemoving] = useState<SampleRecord | null>(null);
  const [sending, setSending] = useState<SampleRecord | null>(null);

  const columns: ColumnDef<SampleRecord>[] = [
    {
      key: "code",
      header: tt("Code"),
      cell: (s) => <span className="font-mono text-xs">{fmtAny(s.code, lang)}</span>,
      sort: (a, b) => String(a.code).localeCompare(String(b.code)),
    },
    {
      key: "type",
      header: tt("Type"),
      cell: (s) => <span className="capitalize">{tt(s.type.charAt(0).toUpperCase() + s.type.slice(1))}</span>,
      sort: (a, b) => a.type.localeCompare(b.type),
    },
    {
      key: "project",
      header: tt("Project"),
      cell: (s) => {
        const p = projectsById.get(s.projectId);
        return <span className="text-sm">{p ? loc(p.name) : "—"}</span>;
      },
      sort: (a, b) => {
        const pa = projectsById.get(a.projectId);
        const pb = projectsById.get(b.projectId);
        return (pa ? loc(pa.name) : "").localeCompare(pb ? loc(pb.name) : "");
      },
    },
    {
      key: "location",
      header: tt("Location"),
      cell: (s) => loc(s.location),
    },
    {
      key: "date",
      header: tt("Date"),
      cell: (s) => fmtAny(s.date, lang),
      sort: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    },
    {
      key: "by",
      header: tt("By"),
      cell: (s) => <span className="text-sm">{loc(s.sampledBy)}</span>,
    },
    {
      key: "status",
      header: tt("Status"),
      cell: (s) => <StatusBadge value={s.status} />,
      sort: (a, b) => String(a.status).localeCompare(String(b.status)),
    },
    {
      key: "actions",
      header: tt("Actions"),
      align: "right",
      cell: (s) => {
        const isLocked = SENT_STATES.has(s.status);
        return (
          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setEditing(s); }}
              className="p-1.5 rounded hover:bg-brand-500/10 text-brand-600 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label={tt("Edit")}
              title={tt("Edit")}
              disabled={!canEdit || isLocked}
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setSending(s); }}
              className="p-1.5 rounded hover:bg-cyan-500/10 text-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label={tt("Send")}
              title={tt("Send to tests")}
              disabled={isLocked}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setRemoving(s); }}
              className="p-1.5 rounded hover:bg-rose-500/10 text-rose-500 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label={tt("Delete")}
              title={tt("Delete")}
              disabled={!canDelete || isLocked}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      },
    },
  ];

  const toolbar = (
    <>
      <Filter className="w-4 h-4 text-[rgb(var(--muted))]" />
      <select
        value={type}
        onChange={(e) => setType(e.target.value as (typeof TYPES)[number])}
        className="input w-auto h-9"
      >
        {TYPES.map((t) => (
          <option key={t} value={t} className="capitalize">
            {t === "all" ? tt("All types") : tt(t.charAt(0).toUpperCase() + t.slice(1))}
          </option>
        ))}
      </select>
    </>
  );

  return (
    <DataTable
      rows={samples}
      columns={columns}
      getRowId={(s) => s.id}
      loading={isLoading}
      error={error?.message ?? null}
      searchable
      searchPlaceholder={tt("Search by code or location…")}
      searchFilter={(s, q) => {
        const p = projectsById.get(s.projectId);
        return [String(s.code), s.type, loc(s.location), loc(s.sampledBy), p ? loc(p.name) : ""]
          .join(" ").toLowerCase().includes(q);
      }}
      toolbar={toolbar}
      empty={tt("No samples match your filters.")}
    />
  );
}
