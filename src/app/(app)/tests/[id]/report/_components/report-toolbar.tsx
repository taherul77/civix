"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Download, Printer, Loader2 } from "lucide-react";
import { api } from "@/server/api";
import { mutate } from "@/server/mutate";
import { downloadReportPdf } from "@/lib/pdf-report";
import { useApp } from "@/store/app-store";
import { toast } from "@/components/ui/toast";

export function ReportToolbar({ testId }: { testId: string }) {
  const tenant = useApp((s) => s.user?.tenant ?? "CiviXLab");
  const [generating, setGenerating] = useState(false);

  const onDownload = async () => {
    setGenerating(true);
    try {
      const ctx = await api.reports.get(testId);
      if (!ctx) {
        toast.error("Report data unavailable");
        return;
      }
      // Audit + permission gate happen here. If denied, the helper toasts and
      // returns null without producing a PDF.
      const stamped = await mutate(
        () => api.reports.markGenerated({ testId, format: "pdf" }),
        "Report PDF generated"
      );
      if (!stamped) return;

      const root = document.getElementById("civix-report-root") as HTMLElement | null;
      if (!root) {
        toast.error("Report DOM not ready — try again");
        return;
      }
      await downloadReportPdf(root, {
        reportNumber: stamped.reportNumber,
        testName: typeof ctx.test.name === "string" ? ctx.test.name : (ctx.test.name?.en ?? ctx.test.code),
        testCode: ctx.test.code,
        standard: ctx.test.standard,
        tenant,
        signedBy: ctx.signedBy ?? undefined,
        signatureSerial: ctx.signatureSerial ?? undefined,
      });
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
          {generating ? "Generating…" : "Download PDF"}
        </button>
      </div>
    </div>
  );
}
