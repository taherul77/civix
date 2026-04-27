"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { Plus, Filter } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { samples, projectById } from "@/lib/mock-data";

const TYPES = ["all", "concrete", "soil", "aggregate", "asphalt", "steel", "cement", "masonry", "water"] as const;

export default function SamplesPage() {
  const [type, setType] = useState<(typeof TYPES)[number]>("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    return samples.filter((s) => {
      if (type !== "all" && s.type !== type) return false;
      if (q && !`${s.code} ${s.location}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [type, q]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Samples"
        description="All samples received with chain-of-custody tracking."
        actions={
          <button className="btn btn-primary">
            <Plus className="w-4 h-4" /> New sample
          </button>
        }
      />

      <div className="card p-3 flex flex-wrap items-center gap-2">
        <Filter className="w-4 h-4 text-[rgb(var(--muted))] mx-2" />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as (typeof TYPES)[number])}
          className="input w-auto"
        >
          {TYPES.map((t) => (
            <option key={t} value={t} className="capitalize">
              {t === "all" ? "All types" : t}
            </option>
          ))}
        </select>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by code or location..."
          className="input flex-1 min-w-[200px]"
        />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="civix">
            <thead>
              <tr>
                <th>Code</th>
                <th>Type</th>
                <th>Project</th>
                <th>Location</th>
                <th>Sampled</th>
                <th>By</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const p = projectById(s.projectId);
                return (
                  <tr key={s.id}>
                    <td className="font-mono text-xs">{s.code}</td>
                    <td className="capitalize">{s.type}</td>
                    <td className="text-sm">{p?.name ?? "—"}</td>
                    <td>{s.location}</td>
                    <td>{s.date}</td>
                    <td className="text-sm">{s.sampledBy}</td>
                    <td><StatusBadge value={s.status} /></td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-[rgb(var(--muted))]">No samples match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
