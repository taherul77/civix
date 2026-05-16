"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, MapPin, Calendar, User } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { useProjectQuery, useSamplesQuery, useTestsQuery } from "@/server/queries";
import { useLoc } from "@/lib/i18n-data";
import { useT } from "@/lib/i18n";
import { useApp } from "@/store/app-store";
import { fmtAny, fmtSAR } from "@/lib/utils";
import type { SampleRecord, TestRecord } from "@/server/contracts";

export function ProjectDetailView({ id }: { id: string }) {
  const tt = useT();
  const loc = useLoc();
  const lang = useApp((s) => s.lang);
  const { data: project } = useProjectQuery(id);
  const { data: projectSamples = [] } = useSamplesQuery({ projectId: id });
  const { data: projectTests   = [] } = useTestsQuery({ projectId: id });

  if (!project) notFound();

  const sampleCols: ColumnDef<SampleRecord>[] = [
    { key: "code",     header: tt("Code"),     cell: (s) => <span className="font-mono text-xs">{fmtAny(s.code, lang)}</span> },
    { key: "type",     header: tt("Type"),     cell: (s) => <span className="capitalize">{tt(s.type.charAt(0).toUpperCase() + s.type.slice(1))}</span> },
    { key: "location", header: tt("Location"), cell: (s) => loc(s.location) },
    { key: "date",     header: tt("Date"),     cell: (s) => fmtAny(s.date, lang) },
    { key: "status",   header: tt("Status"),   cell: (s) => <StatusBadge value={s.status} /> },
  ];

  const testCols: ColumnDef<TestRecord>[] = [
    { key: "code", header: tt("Code"), cell: (t) => <span className="font-mono text-xs">{fmtAny(t.code, lang)}</span> },
    {
      key: "test",
      header: tt("Test"),
      cell: (t) => (
        <Link href={`/tests/${t.id}`} className="hover:text-brand-600 hover:underline">
          {loc(t.name)}
        </Link>
      ),
    },
    {
      key: "result",
      header: tt("Result"),
      cell: (t) => t.primaryResult ? `${fmtAny(t.primaryResult.value, lang)} ${t.primaryResult.unit}` : "—",
    },
    { key: "pf", header: tt("P/F"), cell: (t) => <StatusBadge value={t.passFail} /> },
  ];

  return (
    <div className="space-y-6">
      <Link href="/projects" className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline">
        <ArrowLeft className="w-4 h-4" /> {tt("Back to projects")}
      </Link>

      <PageHeader
        title={loc(project.name)}
        description={`${fmtAny(project.code, lang)} • ${loc(project.client)}`}
        actions={<StatusBadge value={project.status} />}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Info label={tt("City")}     value={loc(project.city)}     icon={<MapPin className="w-4 h-4" />} />
        <Info label={tt("Engineer")} value={loc(project.engineer)} icon={<User className="w-4 h-4" />} />
        <Info label={tt("Start")}    value={fmtAny(project.startDate, lang)} icon={<Calendar className="w-4 h-4" />} />
        <Info label={tt("End")}      value={fmtAny(project.endDate, lang)}   icon={<Calendar className="w-4 h-4" />} />
        <Info label={tt("Contract value")} value={fmtSAR(project.contractValue, lang)} icon={<Building2 className="w-4 h-4" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          <h3 className="font-semibold">{tt("Samples")} ({fmtAny(projectSamples.length, lang)})</h3>
          <DataTable
            rows={projectSamples}
            columns={sampleCols}
            getRowId={(s) => s.id}
            pageSize={10}
            empty={tt("No samples")}
          />
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold">{tt("Tests")} ({fmtAny(projectTests.length, lang)})</h3>
          <DataTable
            rows={projectTests}
            columns={testCols}
            getRowId={(t) => t.id}
            pageSize={10}
            empty={tt("No tests")}
          />
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[rgb(var(--muted))] mb-1">
        {icon} {label}
      </div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
