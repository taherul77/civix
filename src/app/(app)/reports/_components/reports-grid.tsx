"use client";

import Link from "next/link";
import { FileText, Download } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { useTestsQuery } from "@/server/queries";
import { useT } from "@/lib/i18n";
import { useLoc } from "@/lib/i18n-data";
import { useApp } from "@/store/app-store";
import { fmtAny } from "@/lib/utils";

export function ReportsGrid() {
  const tt = useT();
  const loc = useLoc();
  const lang = useApp((s) => s.lang);
  const { data: tests = [] } = useTestsQuery();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tests.map((t) => (
        <Link
          href={`/tests/${t.id}/report`}
          key={t.id}
          className="card p-5 hover:shadow-md hover:-translate-y-0.5 transition-all group"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 grid place-items-center">
              <FileText className="w-5 h-5" />
            </div>
            <StatusBadge value={t.passFail} />
          </div>
          <div className="mt-3 font-mono text-xs text-[rgb(var(--muted))]">
            {fmtAny(`RPT-2026-${t.code.split("-").pop()}`, lang)}
          </div>
          <h3 className="font-semibold leading-tight mt-1">{loc(t.name)}</h3>
          <div className="text-xs text-[rgb(var(--muted))] mt-1">{t.standard}</div>
          <div className="mt-4 pt-4 border-t border-[rgb(var(--border))] flex items-center justify-between text-xs">
            <span className="text-[rgb(var(--muted))]">{fmtAny(t.testDate, lang)}</span>
            <span className="text-brand-600 font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
              <Download className="w-3.5 h-3.5" /> {tt("View report")}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
