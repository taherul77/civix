"use client";

import Link from "next/link";
import { TestTube2, Clock, CheckCircle2, AlertTriangle, Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import {
  MonthlyVolumeChart,
  CategoryPie,
  PassFailBar,
} from "@/components/dashboard/charts";
import { StatusBadge } from "@/components/ui/status-badge";
import { tests, projects } from "@/lib/mock-data";

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

export default function DashboardPage() {
  const recent = [...tests].slice(0, 6);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of laboratory activity, compliance, and equipment status."
        actions={
          <Link href="/tests/new" className="btn btn-primary">
            <Plus className="w-4 h-4" /> New test
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Tests today" value={27} delta={{ value: "+12% vs yesterday", trend: "up" }} icon={TestTube2} tone="brand" />
        <KpiCard label="Pending review" value={14} delta={{ value: "3 new", trend: "up" }} icon={Clock} tone="sunset" />
        <KpiCard label="Approved this month" value={309} delta={{ value: "+8.6% MoM", trend: "up" }} icon={CheckCircle2} tone="emerald" />
        <KpiCard label="Overdue calibrations" value={2} delta={{ value: "EQ-CMP-02 · EQ-NCG-01", trend: "down" }} icon={AlertTriangle} tone="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Monthly test volume</h3>
            <span className="text-xs text-[rgb(var(--muted))]">Last 6 months</span>
          </div>
          <MonthlyVolumeChart data={monthly} />
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">By category</h3>
            <span className="text-xs text-[rgb(var(--muted))]">This month</span>
          </div>
          <CategoryPie data={byCategory} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Pass / fail by category</h3>
            <span className="text-xs text-[rgb(var(--muted))]">Last 30 days</span>
          </div>
          <PassFailBar data={passFail} />
        </div>
        <div className="card p-5">
          <h3 className="font-semibold mb-3">Active projects</h3>
          <ul className="space-y-3">
            {projects
              .filter((p) => p.status === "active")
              .map((p) => (
                <li key={p.id} className="text-sm">
                  <div className="font-medium leading-tight">{p.name}</div>
                  <div className="text-xs text-[rgb(var(--muted))] mt-0.5">
                    {p.code} • {p.city} • {p.client}
                  </div>
                </li>
              ))}
          </ul>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Recent tests</h3>
          <Link href="/tests" className="text-sm text-brand-600 hover:underline">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="civix">
            <thead>
              <tr>
                <th>Code</th>
                <th>Test</th>
                <th>Standard</th>
                <th>Date</th>
                <th>Result</th>
                <th>Status</th>
                <th>P/F</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((t) => (
                <tr key={t.id}>
                  <td className="font-mono text-xs">{t.code}</td>
                  <td>
                    <Link href={`/tests/${t.id}`} className="hover:text-brand-600 hover:underline">
                      {t.name}
                    </Link>
                  </td>
                  <td className="text-xs text-[rgb(var(--muted))]">{t.standard}</td>
                  <td>{t.testDate}</td>
                  <td className="font-medium">
                    {t.primaryResult
                      ? `${t.primaryResult.value} ${t.primaryResult.unit}`
                      : "—"}
                  </td>
                  <td>
                    <StatusBadge value={t.status} />
                  </td>
                  <td>
                    <StatusBadge value={t.passFail} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
