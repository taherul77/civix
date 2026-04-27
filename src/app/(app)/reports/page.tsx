"use client";

import Link from "next/link";
import { FileText, Download } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { tests } from "@/lib/mock-data";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Generated reports with digital signatures and verification QR codes." />

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
              RPT-2026-{t.code.split("-").pop()}
            </div>
            <h3 className="font-semibold leading-tight mt-1">{t.name}</h3>
            <div className="text-xs text-[rgb(var(--muted))] mt-1">{t.standard}</div>
            <div className="mt-4 pt-4 border-t border-[rgb(var(--border))] flex items-center justify-between text-xs">
              <span className="text-[rgb(var(--muted))]">{t.testDate}</span>
              <span className="text-brand-600 font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                <Download className="w-3.5 h-3.5" /> View report
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
