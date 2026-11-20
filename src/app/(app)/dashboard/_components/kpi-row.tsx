"use client";

import { TestTube2, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { useDashboardQuery } from "@/server/queries";
import { useT } from "@/lib/i18n";

export function DashboardKpiRow() {
  const tt = useT();
  const { data } = useDashboardQuery();
  const overdue = data?.overdueCalibrations ?? 0;
  const pending = data?.pendingReview ?? 0;
  // Deltas are derived from live numbers only (no placeholder trends).
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard label={tt("Tests today")}         value={data?.testsToday ?? "—"}        icon={TestTube2}     tone="brand" />
      <KpiCard label={tt("Pending review")}      value={data?.pendingReview ?? "—"}     icon={Clock}         tone="sunset"
        delta={data && pending > 0 ? { value: tt("Awaiting review"), trend: "up" } : undefined} />
      <KpiCard label={tt("Approved this month")} value={data?.approvedThisMonth ?? "—"} icon={CheckCircle2}  tone="emerald" />
      <KpiCard label={tt("Overdue calibrations")} value={data?.overdueCalibrations ?? "—"} icon={AlertTriangle} tone="rose"
        delta={data ? (overdue > 0 ? { value: tt("Needs attention"), trend: "down" } : { value: tt("All in calibration"), trend: "flat" }) : undefined} />
    </div>
  );
}
