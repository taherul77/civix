"use client";

import { TestTube2, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { useT } from "@/lib/i18n";

export function DashboardKpiRow() {
  const tt = useT();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard label={tt("Tests today")} value={27} delta={{ value: tt("+12% vs yesterday"), trend: "up" }} icon={TestTube2} tone="brand" />
      <KpiCard label={tt("Pending review")} value={14} delta={{ value: tt("3 new"), trend: "up" }} icon={Clock} tone="sunset" />
      <KpiCard label={tt("Approved this month")} value={309} delta={{ value: tt("+8.6% MoM"), trend: "up" }} icon={CheckCircle2} tone="emerald" />
      <KpiCard label={tt("Overdue calibrations")} value={2} delta={{ value: "EQ-CMP-02 · EQ-NCG-01", trend: "down" }} icon={AlertTriangle} tone="rose" />
    </div>
  );
}
