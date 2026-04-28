"use client";

import { MonthlyVolumeChart, CategoryPie, PassFailBar } from "@/components/dashboard/charts";
import { useT } from "@/lib/i18n";

const monthly = [
  { month: "Nov", tests: 184, passed: 171 },
  { month: "Dec", tests: 212, passed: 198 },
  { month: "Jan", tests: 246, passed: 229 },
  { month: "Feb", tests: 288, passed: 271 },
  { month: "Mar", tests: 304, passed: 282 },
  { month: "Apr", tests: 327, passed: 309 },
];

const byCategory = [
  { name: "Concrete", value: 142 },
  { name: "Soil", value: 78 },
  { name: "Aggregate", value: 54 },
  { name: "Asphalt", value: 31 },
  { name: "Steel", value: 22 },
  { name: "Cement", value: 17 },
  { name: "Water", value: 28 },
  { name: "Masonry", value: 9 },
];

const passFail = [
  { category: "Concrete", pass: 132, fail: 10 },
  { category: "Soil", pass: 74, fail: 4 },
  { category: "Aggregate", pass: 51, fail: 3 },
  { category: "Asphalt", pass: 29, fail: 2 },
  { category: "Steel", pass: 22, fail: 0 },
  { category: "Cement", pass: 16, fail: 1 },
  { category: "Water", pass: 25, fail: 3 },
];

export function MonthlyVolumeCard() {
  const tt = useT();
  return (
    <div className="card p-5 lg:col-span-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">{tt("Monthly test volume")}</h3>
        <span className="text-xs text-[rgb(var(--muted))]">{tt("Last 6 months")}</span>
      </div>
      <MonthlyVolumeChart data={monthly} />
    </div>
  );
}

export function CategoryCard() {
  const tt = useT();
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">{tt("By category")}</h3>
        <span className="text-xs text-[rgb(var(--muted))]">{tt("This month")}</span>
      </div>
      <CategoryPie data={byCategory} />
    </div>
  );
}

export function PassFailCard() {
  const tt = useT();
  return (
    <div className="card p-5 lg:col-span-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">{tt("Pass / fail by category")}</h3>
        <span className="text-xs text-[rgb(var(--muted))]">{tt("Last 30 days")}</span>
      </div>
      <PassFailBar data={passFail} />
    </div>
  );
}
