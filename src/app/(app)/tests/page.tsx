"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { Plus, Filter, FileCheck } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { tests, sampleById, projectById } from "@/lib/mock-data";

const STATUS = ["all", "draft", "submitted", "reviewed", "approved"] as const;
const CATS = ["all", "concrete", "soil", "aggregate", "asphalt", "steel", "cement", "masonry", "water"] as const;

export default function TestsPage() {
  const [status, setStatus] = useState<(typeof STATUS)[number]>("all");
  const [cat, setCat] = useState<(typeof CATS)[number]>("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    return tests.filter((t) => {
      if (status !== "all" && t.status !== status) return false;
      if (cat !== "all" && t.category !== cat) return false;
      if (q && !`${t.code} ${t.name} ${t.standard}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [status, cat, q]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tests"
        description="All test runs across projects with full traceability."
        actions={
          <Link href="/tests/new" className="btn btn-primary">
            <Plus className="w-4 h-4" /> New test
          </Link>
        }
      />

      <div className="card p-3 flex flex-wrap items-center gap-2">
        <Filter className="w-4 h-4 text-[rgb(var(--muted))] mx-2" />
        <select value={status} onChange={(e) => setStatus(e.target.value as never)} className="input w-auto">
          {STATUS.map((s) => <option key={s} value={s} className="capitalize">{s === "all" ? "All status" : s}</option>)}
        </select>
        <select value={cat} onChange={(e) => setCat(e.target.value as never)} className="input w-auto">
          {CATS.map((c) => <option key={c} value={c} className="capitalize">{c === "all" ? "All categories" : c}</option>)}
        </select>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by code, name, or standard..."
          className="input flex-1 min-w-[240px]"
        />
        <div className="text-xs text-[rgb(var(--muted))] px-2">
          {filtered.length} of {tests.length}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="civix">
            <thead>
              <tr>
                <th>Code</th>
                <th>Test</th>
                <th>Project / Sample</th>
                <th>Standard</th>
                <th>Date</th>
                <th>Result</th>
                <th>Status</th>
                <th>P/F</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const sample = sampleById(t.sampleId);
                const project = projectById(t.projectId);
                return (
                  <tr key={t.id}>
                    <td className="font-mono text-xs">{t.code}</td>
                    <td>
                      <Link href={`/tests/${t.id}`} className="font-medium hover:text-brand-600 hover:underline">
                        {t.name}
                      </Link>
                      <div className="text-xs text-[rgb(var(--muted))] capitalize">{t.category}</div>
                    </td>
                    <td className="text-sm">
                      <div>{project?.code}</div>
                      <div className="text-xs text-[rgb(var(--muted))]">{sample?.code}</div>
                    </td>
                    <td className="text-xs text-[rgb(var(--muted))]">{t.standard}</td>
                    <td>{t.testDate}</td>
                    <td className="font-medium">
                      {t.primaryResult ? `${t.primaryResult.value} ${t.primaryResult.unit}` : "—"}
                    </td>
                    <td><StatusBadge value={t.status} /></td>
                    <td><StatusBadge value={t.passFail} /></td>
                    <td>
                      <Link href={`/tests/${t.id}/report`} className="btn btn-ghost px-2" title="View report">
                        <FileCheck className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="text-center py-8 text-[rgb(var(--muted))]">No tests match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
