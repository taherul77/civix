"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { useProjectsQuery, useSamplesQuery, useTestsQuery } from "@/server/queries";
import { useT } from "@/lib/i18n";
import { useLoc } from "@/lib/i18n-data";
import { useApp } from "@/store/app-store";
import { fmtAny, fmtSAR } from "@/lib/utils";
import type { ProjectRecord } from "@/server/contracts";

export function ProjectsTable() {
  const tt = useT();
  const loc = useLoc();
  const lang = useApp((s) => s.lang);
  const { data: projects = [], isLoading, error } = useProjectsQuery();
  const { data: samples = [] } = useSamplesQuery();
  const { data: tests = [] } = useTestsQuery();

  const sampleCountByProject = new Map<string, number>();
  for (const s of samples) {
    sampleCountByProject.set(s.projectId, (sampleCountByProject.get(s.projectId) ?? 0) + 1);
  }
  const testCountByProject = new Map<string, number>();
  for (const t of tests) {
    testCountByProject.set(t.projectId, (testCountByProject.get(t.projectId) ?? 0) + 1);
  }

  const columns: ColumnDef<ProjectRecord>[] = [
    {
      key: "code",
      header: tt("Code"),
      cell: (p) => <span className="font-mono text-xs">{fmtAny(p.code, lang)}</span>,
      sort: (a, b) => String(a.code).localeCompare(String(b.code)),
    },
    {
      key: "name",
      header: tt("Project"),
      cell: (p) => (
        <Link href={`/projects/${p.id}`} className="font-medium hover:text-brand-600 hover:underline">
          {loc(p.name)}
        </Link>
      ),
      sort: (a, b) => loc(a.name).localeCompare(loc(b.name)),
    },
    {
      key: "client",
      header: tt("Client"),
      cell: (p) => loc(p.client),
      sort: (a, b) => loc(a.client).localeCompare(loc(b.client)),
    },
    {
      key: "city",
      header: tt("City"),
      cell: (p) => loc(p.city),
      sort: (a, b) => loc(a.city).localeCompare(loc(b.city)),
    },
    {
      key: "engineer",
      header: tt("Engineer"),
      cell: (p) => <span className="text-sm">{loc(p.engineer)}</span>,
      sort: (a, b) => loc(a.engineer).localeCompare(loc(b.engineer)),
    },
    {
      key: "samples",
      header: tt("Samples"),
      cell: (p) => fmtAny(sampleCountByProject.get(p.id) ?? 0, lang),
      sort: (a, b) => (sampleCountByProject.get(a.id) ?? 0) - (sampleCountByProject.get(b.id) ?? 0),
      align: "right",
    },
    {
      key: "tests",
      header: tt("Tests"),
      cell: (p) => fmtAny(testCountByProject.get(p.id) ?? 0, lang),
      sort: (a, b) => (testCountByProject.get(a.id) ?? 0) - (testCountByProject.get(b.id) ?? 0),
      align: "right",
    },
    {
      key: "status",
      header: tt("Status"),
      cell: (p) => <StatusBadge value={p.status} />,
      sort: (a, b) => String(a.status).localeCompare(String(b.status)),
    },
    {
      key: "contractValue",
      header: tt("Contract value"),
      cell: (p) => <span className="font-mono text-sm">{fmtSAR(p.contractValue, lang)}</span>,
      sort: (a, b) => (a.contractValue ?? 0) - (b.contractValue ?? 0),
      align: "right",
    },
  ];

  return (
    <DataTable
      rows={projects}
      columns={columns}
      getRowId={(p) => p.id}
      loading={isLoading}
      error={error?.message ?? null}
      searchable
      searchPlaceholder={tt("Search projects…")}
      searchFilter={(p, q) =>
        [p.code, loc(p.name), loc(p.client), loc(p.city), loc(p.engineer)]
          .join(" ").toLowerCase().includes(q)
      }
    />
  );
}
