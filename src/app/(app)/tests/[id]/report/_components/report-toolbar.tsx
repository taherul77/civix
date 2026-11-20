"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Download, Printer, Loader2 } from "lucide-react";
import { api } from "@/server/api";
import { mutate } from "@/server/mutate";
import { invalidate } from "@/server/invalidation";
import { useReportStatusQuery } from "@/server/queries";
import { toast } from "@/components/ui/toast";

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function ReportToolbar({ testId }: { testId: string }) {
  const { data: status } = useReportStatusQuery(testId);
  const [generating, setGenerating] = useState(false);

  const issued = status?.reportStatus === "issued";
  const label = generating ? "Generating…" : issued ? "Download PDF" : status?.reportStatus === "stale" ? "Re-issue & download PDF" : "Issue & download PDF";

  const onDownload = async () => {
    setGenerating(true);
    try {
      let reportId = issued ? status?.reportId ?? null : null;
      if (!reportId) {
        // The server allocates the unique report number and seals the content.
        // Only approved tests can be issued (the API answers 409 otherwise).
        const result = await mutate(() => api.reports.issue(testId), "Report issued");
        if (!result) return;
        reportId = result.reportId;
        invalidate("report-status");
      }
      const { blob, filename } = await api.reports.downloadPdf(reportId);
      saveBlob(blob, filename);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not download the report");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex items-center justify-between print:hidden">
      <Link
        href={`/tests/${testId}`}
        className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>
      <div className="flex items-center gap-2">
        <button onClick={() => window.print()} className="btn btn-outline">
          <Printer className="w-4 h-4" /> Print
        </button>
        <button onClick={onDownload} disabled={generating} className="btn btn-primary">
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {label}
        </button>
      </div>
    </div>
  );
}
