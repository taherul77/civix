"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { useTestsQuery } from "@/server/queries";
import { useT } from "@/lib/i18n";
import { useLoc } from "@/lib/i18n-data";
import { useApp } from "@/store/app-store";
import { fmtAny } from "@/lib/utils";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import type { TestRecord } from "@/server/contracts";

export function RecentTestsCard() {
  const tt = useT();
  const loc = useLoc();
  const lang = useApp((s) => s.lang);
  const { data: tests = [], isLoading } = useTestsQuery();
  const recent = tests.slice(0, 6);

  const columns: ColumnDef<TestRecord>[] = [
    {
      key: "code",
      header: tt("Code"),
      cell: (t) => <span className="font-mono text-xs">{fmtAny(t.code, lang)}</span>,
    },
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
      key: "standard",
      header: tt("Standard"),
      cell: (t) => <span className="text-xs text-[rgb(var(--muted))]">{t.standard}</span>,
    },
    {
      key: "date",
      header: tt("Date"),
      cell: (t) => fmtAny(t.testDate, lang),
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
    },
    {
      key: "passFail",
      header: tt("P/F"),
      cell: (t) => <StatusBadge value={t.passFail} />,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{tt("Recent tests")}</h3>
        <Link href="/tests" className="text-sm text-brand-600 hover:underline">
          {tt("View all")}
        </Link>
      </div>
      <DataTable
        rows={recent}
        columns={columns}
        getRowId={(t) => t.id}
        loading={isLoading}
        pageSize={0}
        empty={tt("No tests yet")}
      />
    </div>
  );
}
