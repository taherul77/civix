"use client";

import Link from "next/link";
import { use } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, MapPin, Calendar, User } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { projectById, samples, tests } from "@/lib/mock-data";

export default function ProjectDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const project = projectById(id);
  if (!project) notFound();

  const projectSamples = samples.filter((s) => s.projectId === project.id);
  const projectTests = tests.filter((t) => t.projectId === project.id);

  return (
    <div className="space-y-6">
      <Link href="/projects" className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to projects
      </Link>

      <PageHeader
        title={project.name}
        description={`${project.code} • ${project.client}`}
        actions={<StatusBadge value={project.status} />}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Info label="City" value={project.city} icon={<MapPin className="w-4 h-4" />} />
        <Info label="Engineer" value={project.engineer} icon={<User className="w-4 h-4" />} />
        <Info label="Start" value={project.startDate} icon={<Calendar className="w-4 h-4" />} />
        <Info label="End" value={project.endDate} icon={<Calendar className="w-4 h-4" />} />
        <Info
          label="Contract value"
          value={`SAR ${project.contractValue.toLocaleString()}`}
          icon={<Building2 className="w-4 h-4" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-semibold mb-3">Samples ({projectSamples.length})</h3>
          <table className="civix">
            <thead>
              <tr><th>Code</th><th>Type</th><th>Location</th><th>Date</th><th>Status</th></tr>
            </thead>
            <tbody>
              {projectSamples.map((s) => (
                <tr key={s.id}>
                  <td className="font-mono text-xs">{s.code}</td>
                  <td className="capitalize">{s.type}</td>
                  <td>{s.location}</td>
                  <td>{s.date}</td>
                  <td><StatusBadge value={s.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold mb-3">Tests ({projectTests.length})</h3>
          <table className="civix">
            <thead>
              <tr><th>Code</th><th>Test</th><th>Result</th><th>P/F</th></tr>
            </thead>
            <tbody>
              {projectTests.map((t) => (
                <tr key={t.id}>
                  <td className="font-mono text-xs">{t.code}</td>
                  <td>
                    <Link href={`/tests/${t.id}`} className="hover:text-brand-600 hover:underline">
                      {t.name}
                    </Link>
                  </td>
                  <td>{t.primaryResult ? `${t.primaryResult.value} ${t.primaryResult.unit}` : "—"}</td>
                  <td><StatusBadge value={t.passFail} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[rgb(var(--muted))] mb-1">
        {icon} {label}
      </div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
