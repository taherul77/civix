"use client";

import Link from "next/link";
import { ArrowLeft, Download, Printer } from "lucide-react";

export function ReportToolbar({ testId }: { testId: string }) {
  return (
    <div className="flex items-center justify-between print:hidden">
      <Link href={`/tests/${testId}`} className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>
      <div className="flex items-center gap-2">
        <button onClick={() => window.print()} className="btn btn-outline">
          <Printer className="w-4 h-4" /> Print
        </button>
        <button className="btn btn-primary">
          <Download className="w-4 h-4" /> Download PDF
        </button>
      </div>
    </div>
  );
}
