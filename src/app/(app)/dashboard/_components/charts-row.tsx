"use client";

import { LineChart as LineIcon, PieChart as PieIcon, BarChart3 } from "lucide-react";
import { MonthlyVolumeChart, CategoryPie, PassFailBar } from "@/components/dashboard/charts";
import { EmptyState, ChartSkeleton } from "@/components/ui/empty-state";
import { useDashboardQuery } from "@/server/queries";
import { useT } from "@/lib/i18n";

/** Live data from /v1/dashboard/stats; shows an empty state until a lab has tests. */
export function MonthlyVolumeCard() {
  const tt = useT();
  const { data, isLoading: loading } = useDashboardQuery();
  const has = (data?.monthlyVolume ?? []).some((m) => m.tests > 0);
  return (
    <div className="card p-5 lg:col-span-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">{tt("Monthly test volume")}</h3>
        <span className="text-xs text-[rgb(var(--muted))]">{tt("Last 6 months")}</span>
      </div>
      {loading && !data ? <ChartSkeleton /> : has
        ? <MonthlyVolumeChart data={data!.monthlyVolume} />
        : <EmptyState icon={LineIcon} title={tt("No tests recorded yet")} hint={tt("Monthly volume appears here once tests are submitted.")} />}
    </div>
  );
}

export function CategoryCard() {
  const tt = useT();
  const { data, isLoading: loading } = useDashboardQuery();
  const has = (data?.byCategory ?? []).length > 0;
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">{tt("By category")}</h3>
        <span className="text-xs text-[rgb(var(--muted))]">{tt("All time")}</span>
      </div>
      {loading && !data ? <ChartSkeleton /> : has
        ? <CategoryPie data={data!.byCategory} />
        : <EmptyState icon={PieIcon} title={tt("Nothing to break down")} hint={tt("Tests will be grouped by category here.")} />}
    </div>
  );
}

export function PassFailCard() {
  const tt = useT();
  const { data, isLoading: loading } = useDashboardQuery();
  const has = (data?.passFailByCategory ?? []).some((c) => c.pass + c.fail > 0);
  return (
    <div className="card p-5 lg:col-span-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">{tt("Pass / fail by category")}</h3>
        <span className="text-xs text-[rgb(var(--muted))]">{tt("All time")}</span>
      </div>
      {loading && !data ? <ChartSkeleton /> : has
        ? <PassFailBar data={data!.passFailByCategory} />
        : <EmptyState icon={BarChart3} title={tt("No pass / fail results yet")} hint={tt("Results appear after tests are evaluated and submitted.")} />}
    </div>
  );
}
