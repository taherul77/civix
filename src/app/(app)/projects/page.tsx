"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { projects, samples, tests } from "@/lib/mock-data";

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Active and completed projects across the laboratory."
        actions={
          <button className="btn btn-primary">
            <Plus className="w-4 h-4" /> New project
          </button>
        }
      />

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="civix">
            <thead>
              <tr>
                <th>Code</th>
                <th>Project</th>
                <th>Client</th>
                <th>City</th>
                <th>Engineer</th>
                <th>Samples</th>
                <th>Tests</th>
                <th>Status</th>
                <th>Contract value</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => {
                const sampleCount = samples.filter((s) => s.projectId === p.id).length;
                const testCount = tests.filter((t) => t.projectId === p.id).length;
                return (
                  <tr key={p.id}>
                    <td className="font-mono text-xs">{p.code}</td>
                    <td>
                      <Link href={`/projects/${p.id}`} className="font-medium hover:text-brand-600 hover:underline">
                        {p.name}
                      </Link>
                    </td>
                    <td>{p.client}</td>
                    <td>{p.city}</td>
                    <td className="text-sm">{p.engineer}</td>
                    <td>{sampleCount}</td>
                    <td>{testCount}</td>
                    <td>
                      <StatusBadge value={p.status} />
                    </td>
                    <td className="font-mono text-sm">
                      SAR {p.contractValue.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
