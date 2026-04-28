"use client";

import Link from "next/link";
import { use } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft, FileCheck, Download } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { testById, sampleById, projectById } from "@/lib/mock-data";
import { useLoc } from "@/lib/i18n-data";
import { useT } from "@/lib/i18n";
import { useApp } from "@/store/app-store";
import { fmtAny } from "@/lib/utils";

export default function TestDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const test = testById(id);
  if (!test) notFound();
  const sample = sampleById(test.sampleId);
  const project = projectById(test.projectId);
  const tt = useT();
  const loc = useLoc();
  const lang = useApp((s) => s.lang);

  return (
    <div className="space-y-6">
      <Link href="/tests" className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline">
        <ArrowLeft className="w-4 h-4" /> {tt("Back to tests")}
      </Link>

      <PageHeader
        title={loc(test.name)}
        description={`${fmtAny(test.code, lang)} • ${test.standard}`}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge value={test.status} />
            <StatusBadge value={test.passFail} />
            <Link href={`/tests/${test.id}/report`} className="btn btn-primary">
              <FileCheck className="w-4 h-4" /> {tt("View report")}
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2 space-y-4">
          <div>
            <h3 className="font-semibold mb-3">{tt("Test summary")}</h3>
            <dl className="grid grid-cols-2 gap-y-3 text-sm">
              <dt className="text-[rgb(var(--muted))]">{tt("Standard")}</dt><dd>{test.standard}</dd>
              <dt className="text-[rgb(var(--muted))]">{tt("Test date")}</dt><dd>{fmtAny(test.testDate, lang)}</dd>
              <dt className="text-[rgb(var(--muted))]">{tt("Technician")}</dt><dd>{loc(test.technician)}</dd>
              <dt className="text-[rgb(var(--muted))]">{tt("Category")}</dt><dd className="capitalize">{tt(test.category.charAt(0).toUpperCase() + test.category.slice(1))}</dd>
              {test.primaryResult && (
                <>
                  <dt className="text-[rgb(var(--muted))]">{loc(test.primaryResult.label)}</dt>
                  <dd className="font-semibold text-lg">{fmtAny(test.primaryResult.value, lang)} {test.primaryResult.unit}</dd>
                </>
              )}
            </dl>
          </div>

          <div className="border-t border-[rgb(var(--border))] pt-4">
            <h3 className="font-semibold mb-3">{tt("Sample")}</h3>
            <dl className="grid grid-cols-2 gap-y-3 text-sm">
              <dt className="text-[rgb(var(--muted))]">{tt("Code")}</dt><dd className="font-mono text-xs">{fmtAny(sample?.code ?? "", lang)}</dd>
              <dt className="text-[rgb(var(--muted))]">{tt("Type")}</dt><dd className="capitalize">{sample ? tt(sample.type.charAt(0).toUpperCase() + sample.type.slice(1)) : "—"}</dd>
              <dt className="text-[rgb(var(--muted))]">{tt("Location")}</dt><dd>{loc(sample?.location)}</dd>
              <dt className="text-[rgb(var(--muted))]">{tt("Sampled by")}</dt><dd>{loc(sample?.sampledBy)}</dd>
              <dt className="text-[rgb(var(--muted))]">{tt("Sample date")}</dt><dd>{fmtAny(sample?.date ?? "", lang)}</dd>
            </dl>
          </div>

          <div className="border-t border-[rgb(var(--border))] pt-4">
            <h3 className="font-semibold mb-3">{tt("Project")}</h3>
            <dl className="grid grid-cols-2 gap-y-3 text-sm">
              <dt className="text-[rgb(var(--muted))]">{tt("Code")}</dt><dd className="font-mono text-xs">{fmtAny(project?.code ?? "", lang)}</dd>
              <dt className="text-[rgb(var(--muted))]">{tt("Name")}</dt>
              <dd><Link href={`/projects/${project?.id}`} className="hover:text-brand-600 hover:underline">{loc(project?.name)}</Link></dd>
              <dt className="text-[rgb(var(--muted))]">{tt("Client")}</dt><dd>{loc(project?.client)}</dd>
              <dt className="text-[rgb(var(--muted))]">{tt("Engineer")}</dt><dd>{loc(project?.engineer)}</dd>
            </dl>
          </div>
        </div>

        <div className="card p-5 space-y-3">
          <h3 className="font-semibold">{tt("Workflow")}</h3>
          <Step done label={tt("Created")}              by={loc(test.technician)} at={fmtAny(test.testDate, lang)} />
          <Step done label={tt("Submitted for review")} by={loc(test.technician)} at={fmtAny(test.testDate, lang)} />
          <Step done={test.status !== "submitted"} label={tt("Reviewed")} by={tt("Quality Manager")} at={fmtAny(test.testDate, lang)} />
          <Step done={test.status === "approved"}  label={tt("Approved")} by={tt("Lab Director")}    at={fmtAny(test.testDate, lang)} />
          <div className="pt-3 border-t border-[rgb(var(--border))]">
            <button className="btn btn-outline w-full"><Download className="w-4 h-4" /> {tt("Download PDF")}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step({ done, label, by, at }: { done: boolean; label: string; by: string; at: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${done ? "bg-emerald-500" : "bg-[rgb(var(--border))]"}`} />
      <div className="flex-1">
        <div className={`text-sm ${done ? "font-medium" : "text-[rgb(var(--muted))]"}`}>{label}</div>
        {done && <div className="text-xs text-[rgb(var(--muted))]">{by} • {at}</div>}
      </div>
    </div>
  );
}
