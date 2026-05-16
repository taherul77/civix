"use client";

import { useState } from "react";
import { Filter } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { useSamplesQuery, useProjectsQuery } from "@/server/queries";
import { useT } from "@/lib/i18n";
import { useLoc } from "@/lib/i18n-data";
import { useApp } from "@/store/app-store";
import { fmtAny } from "@/lib/utils";
import type { SampleRecord } from "@/server/contracts";

const TYPES = ["all", "concrete", "soil", "aggregate", "asphalt", "steel", "cement", "masonry", "water"] as const;

export function SamplesExplorer() {
  const tt = useT();
  const loc = useLoc();
  const lang = useApp((s) => s.lang);

  const [type, setType] = useState<(typeof TYPES)[number]>("all");
  const { data: samples = [], isLoading, error } = useSamplesQuery({ type });
  const { data: projects = [] } = useProjectsQuery();
  const projectsById = new Map(projects.map((p) => [p.id, p]));

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
