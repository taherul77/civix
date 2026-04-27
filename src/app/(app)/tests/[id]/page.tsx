"use client";

import Link from "next/link";
import { use } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft, FileCheck, Download } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { testById, sampleById, projectById } from "@/lib/mock-data";

export default function TestDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const test = testById(id);
  if (!test) notFound();
  const sample = sampleById(test.sampleId);
  const project = projectById(test.projectId);

  return (
    <div className="space-y-6">
      <Link href="/tests" className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to tests
      </Link>

      <PageHeader
        title={test.name}
        description={`${test.code} • ${test.standard}`}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge value={test.status} />
            <StatusBadge value={test.passFail} />
            <Link href={`/tests/${test.id}/report`} className="btn btn-primary">
              <FileCheck className="w-4 h-4" /> View report
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2 space-y-4">
          <div>
            <h3 className="font-semibold mb-3">Test summary</h3>
            <dl className="grid grid-cols-2 gap-y-3 text-sm">
              <dt className="text-[rgb(var(--muted))]">Standard</dt><dd>{test.standard}</dd>
              <dt className="text-[rgb(var(--muted))]">Test date</dt><dd>{test.testDate}</dd>
              <dt className="text-[rgb(var(--muted))]">Technician</dt><dd>{test.technician}</dd>
              <dt className="text-[rgb(var(--muted))]">Category</dt><dd className="capitalize">{test.category}</dd>
              {test.primaryResult && (
                <>
                  <dt className="text-[rgb(var(--muted))]">{test.primaryResult.label}</dt>
                  <dd className="font-semibold text-lg">{test.primaryResult.value} {test.primaryResult.unit}</dd>
                </>
              )}
            </dl>
          </div>

          <div className="border-t border-[rgb(var(--border))] pt-4">
            <h3 className="font-semibold mb-3">Sample</h3>
            <dl className="grid grid-cols-2 gap-y-3 text-sm">
              <dt className="text-[rgb(var(--muted))]">Code</dt><dd className="font-mono text-xs">{sample?.code}</dd>
              <dt className="text-[rgb(var(--muted))]">Type</dt><dd className="capitalize">{sample?.type}</dd>
              <dt className="text-[rgb(var(--muted))]">Location</dt><dd>{sample?.location}</dd>
              <dt className="text-[rgb(var(--muted))]">Sampled by</dt><dd>{sample?.sampledBy}</dd>
              <dt className="text-[rgb(var(--muted))]">Sample date</dt><dd>{sample?.date}</dd>
            </dl>
          </div>

          <div className="border-t border-[rgb(var(--border))] pt-4">
            <h3 className="font-semibold mb-3">Project</h3>
            <dl className="grid grid-cols-2 gap-y-3 text-sm">
              <dt className="text-[rgb(var(--muted))]">Code</dt><dd className="font-mono text-xs">{project?.code}</dd>
              <dt className="text-[rgb(var(--muted))]">Name</dt>
              <dd><Link href={`/projects/${project?.id}`} className="hover:text-brand-600 hover:underline">{project?.name}</Link></dd>
              <dt className="text-[rgb(var(--muted))]">Client</dt><dd>{project?.client}</dd>
              <dt className="text-[rgb(var(--muted))]">Engineer</dt><dd>{project?.engineer}</dd>
            </dl>
          </div>
        </div>

        <div className="card p-5 space-y-3">
          <h3 className="font-semibold">Workflow</h3>
          <Step done label="Created" by={test.technician} at={test.testDate} />
          <Step done label="Submitted for review" by={test.technician} at={test.testDate} />
          <Step done={test.status !== "submitted"} label="Reviewed" by="Quality Manager" at={test.testDate} />
          <Step done={test.status === "approved"} label="Approved" by="Lab Director" at={test.testDate} />
          <div className="pt-3 border-t border-[rgb(var(--border))]">
            <button className="btn btn-outline w-full"><Download className="w-4 h-4" /> Download PDF</button>
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
