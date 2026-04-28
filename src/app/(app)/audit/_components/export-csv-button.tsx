"use client";

import { Download } from "lucide-react";
import { useT } from "@/lib/i18n";

export function ExportCsvButton() {
  const tt = useT();
  return (
    <button className="btn btn-outline">
      <Download className="w-4 h-4" /> {tt("Export CSV")}
    </button>
  );
}
