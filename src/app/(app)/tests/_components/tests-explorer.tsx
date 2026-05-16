"use client";

import Link from "next/link";
import { useState } from "react";
import { Filter, FileCheck } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { useTestsQuery, useSamplesQuery, useProjectsQuery } from "@/server/queries";
import { useT } from "@/lib/i18n";
import { useLoc } from "@/lib/i18n-data";
import { useApp } from "@/store/app-store";
import { fmtAny } from "@/lib/utils";
import type { TestRecord } from "@/server/contracts";

const STATUS = ["all", "draft", "submitted", "reviewed", "approved"] as const;
const CATS = ["all", "concrete", "soil", "aggregate", "asphalt", "steel", "cement", "masonry", "water"] as const;

export function TestsExplorer() {
  const tt = useT();
  const loc = useLoc();
  const lang = useApp((s) => s.lang);

  const [status, setStatus] = useState<(typeof STATUS)[number]>("all");
  const [cat, setCat] = useState<(typeof CATS)[number]>("all");

  const { data: tests = [], isLoading, error } = useTestsQuery({ status, category: cat });
  const { data: samples = [] } = useSamplesQuery();
  const { data: projects = [] } = useProjectsQuery();
  const samplesById = new Map(samples.map((s) => [s.id, s]));
  const projectsById = new Map(projects.map((p) => [p.id, p]));

  const columns: ColumnDef<TestRecord>[] = [
    {
      key: "code",
      header: tt("Code"),
      cell: (t) => <span className="font-mono text-xs">{fmtAny(t.code, lang)}</span>,
      sort: (a, b) => String(a.code).localeCompare(String(b.code)),
    },
    {
      key: "test",
      header: tt("Test"),
      cell: (t) => (
        <>
          <Link href={`/tests/${t.id}`} className="font-medium hover:text-brand-600 hover:underline">
            {loc(t.name)}
          </Link>
          <div className="text-xs text-[rgb(var(--muted))] capitalize">
            {tt(t.category.charAt(0).toUpperCase() + t.category.slice(1))}
          </div>
        </>
      ),
      sort: (a, b) => loc(a.name).localeCompare(loc(b.name)),
    },
    {
      key: "projectSample",
      header: tt("Project / Sample"),
      cell: (t) => {
        const project = projectsById.get(t.projectId);
        const sample = samplesById.get(t.sampleId);
        return (
          <div className="text-sm">
            <div>{fmtAny(project?.code ?? "", lang)}</div>
            <div className="text-xs text-[rgb(var(--muted))]">{fmtAny(sample?.code ?? "", lang)}</div>
          </div>
        );
      },
    },
    {
      key: "standard",
      header: tt("Standard"),
      cell: (t) => <span className="text-xs text-[rgb(var(--muted))]">{t.standard}</span>,
      sort: (a, b) => (a.standard ?? "").localeCompare(b.standard ?? ""),
    },
    {
      key: "date",
      header: tt("Date"),
      cell: (t) => fmtAny(t.testDate, lang),
      sort: (a, b) => new Date(a.testDate ?? 0).getTime() - new Date(b.testDate ?? 0).getTime(),
    },
    {
      key: "result",
      header: tt("Result"),
      cell: (t) => (
        <span className="font-medium">
          {t.primaryResult ? `${fmtAny(t.primaryResult.value, lang)} ${t.primaryResult.unit}` : "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: tt("Status"),
      cell: (t) => <StatusBadge value={t.status} />,
      sort: (a, b) => String(a.status).localeCompare(String(b.status)),
    },
    {
      key: "passFail",
      header: tt("P/F"),
      cell: (t) => <StatusBadge value={t.passFail} />,
    },
    {
      key: "report",
      header: "",
      cell: (t) => (
        <Link href={`/tests/${t.id}/report`} className="btn btn-ghost px-2" title="View report">
          <FileCheck className="w-4 h-4" />
        </Link>
      ),
      align: "right",
    },
  ];

  const toolbar = (
    <>
      <Filter className="w-4 h-4 text-[rgb(var(--muted))]" />
      <select value={status} onChange={(e) => setStatus(e.target.value as never)} className="input w-auto h-9">
        {STATUS.map((s) => (
          <option key={s} value={s} className="capitalize">
            {s === "all" ? tt("All status") : tt(s.charAt(0).toUpperCase() + s.slice(1))}
          </option>
        ))}
      </select>
      <select value={cat} onChange={(e) => setCat(e.target.value as never)} className="input w-auto h-9">
        {CATS.map((c) => (
          <option key={c} value={c} className="capitalize">
            {c === "all" ? tt("All categories") : tt(c.charAt(0).toUpperCase() + c.slice(1))}
          </option>
        ))}
      </select>
    </>
  );

  return (
    <DataTable
      rows={tests}
      columns={columns}
      getRowId={(t) => t.id}
      loading={isLoading}
      error={error?.message ?? null}
      searchable
      searchPlaceholder={tt("Search by code, name, or standard…")}
      searchFilter={(t, q) =>
        [String(t.code), loc(t.name), t.standard ?? "", t.category]
          .join(" ").toLowerCase().includes(q)
      }
      toolbar={toolbar}
      empty={tt("No tests match your filters.")}
    />
  );
}
