"use client";

import Link from "next/link";
import { use } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, MapPin, Calendar, User } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { projectById, samples, tests } from "@/lib/mock-data";
import { useLoc } from "@/lib/i18n-data";
import { useT } from "@/lib/i18n";
import { useApp } from "@/store/app-store";
import { fmtAny, fmtSAR } from "@/lib/utils";

export default function ProjectDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const project = projectById(id);
  if (!project) notFound();

  const tt = useT();
  const loc = useLoc();
  const lang = useApp((s) => s.lang);

  const projectSamples = samples.filter((s) => s.projectId === project.id);
  const projectTests = tests.filter((t) => t.projectId === project.id);

  return (
    <div className="space-y-6">
      <Link href="/projects" className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline">
        <ArrowLeft className="w-4 h-4" /> {tt("Back to projects")}
      </Link>

      <PageHeader
        title={loc(project.name)}
        description={`${fmtAny(project.code, lang)} • ${loc(project.client)}`}
        actions={<StatusBadge value={project.status} />}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Info label={tt("City")}     value={loc(project.city)}     icon={<MapPin className="w-4 h-4" />} />
        <Info label={tt("Engineer")} value={loc(project.engineer)} icon={<User className="w-4 h-4" />} />
        <Info label={tt("Start")}    value={fmtAny(project.startDate, lang)} icon={<Calendar className="w-4 h-4" />} />
        <Info label={tt("End")}      value={fmtAny(project.endDate, lang)}   icon={<Calendar className="w-4 h-4" />} />
        <Info label={tt("Contract value")} value={fmtSAR(project.contractValue, lang)} icon={<Building2 className="w-4 h-4" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-semibold mb-3">{tt("Samples")} ({fmtAny(projectSamples.length, lang)})</h3>
          <table className="civix">
            <thead>
              <tr><th>{tt("Code")}</th><th>{tt("Type")}</th><th>{tt("Location")}</th><th>{tt("Date")}</th><th>{tt("Status")}</th></tr>
            </thead>
            <tbody>
              {projectSamples.map((s) => (
                <tr key={s.id}>
                  <td className="font-mono text-xs">{fmtAny(s.code, lang)}</td>
                  <td className="capitalize">{tt(s.type.charAt(0).toUpperCase() + s.type.slice(1))}</td>
                  <td>{loc(s.location)}</td>
                  <td>{fmtAny(s.date, lang)}</td>
                  <td><StatusBadge value={s.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold mb-3">{tt("Tests")} ({fmtAny(projectTests.length, lang)})</h3>
          <table className="civix">
            <thead>
              <tr><th>{tt("Code")}</th><th>{tt("Test")}</th><th>{tt("Result")}</th><th>{tt("P/F")}</th></tr>
            </thead>
            <tbody>
              {projectTests.map((t) => (
                <tr key={t.id}>
                  <td className="font-mono text-xs">{fmtAny(t.code, lang)}</td>
                  <td>
                    <Link href={`/tests/${t.id}`} className="hover:text-brand-600 hover:underline">
                      {loc(t.name)}
                    </Link>
                  </td>
                  <td>{t.primaryResult ? `${fmtAny(t.primaryResult.value, lang)} ${t.primaryResult.unit}` : "—"}</td>
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
