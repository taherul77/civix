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

/** Tests created this month against the company's plan limit. */
export function UsageCard() {
  const tt = useT();
  const { data } = useDashboardQuery();
  const u = data?.usage;
  if (!u || !Number.isFinite(u.testsThisMonth) || !Number.isFinite(u.maxTestsPerMonth) || u.maxTestsPerMonth <= 0) return null;
  const pct = Math.min(100, Math.round((u.testsThisMonth / u.maxTestsPerMonth) * 100));
  const full = u.testsThisMonth >= u.maxTestsPerMonth;
  const near = !full && pct >= 80;
  const bar = full ? "bg-rose-500" : near ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="text-xs uppercase tracking-wider text-[rgb(var(--muted))] font-semibold">{tt("Tests this month")} <span className="normal-case font-normal">(UTC)</span></div>
        <div className="text-sm font-semibold">{u.testsThisMonth} / {u.maxTestsPerMonth}</div>
      </div>
      <div className="mt-2 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden" role="progressbar"
        aria-valuenow={u.testsThisMonth} aria-valuemin={0} aria-valuemax={u.maxTestsPerMonth}>
        <div className={`h-full ${bar}`} style={{ width: `${pct}%` }} />
      </div>
      {(full || near) && (
        <p className={`text-xs mt-2 ${full ? "text-rose-600" : "text-amber-700"}`}>
          {full
            ? tt("Monthly test limit reached. New tests can be created again next month, or contact your platform administrator.")
            : tt("Approaching the monthly test limit.")}
        </p>
      )}
    </div>
  );
}
