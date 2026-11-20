"use client";

import { useEffect, useMemo } from "react";
import { useProjectsQuery, useSamplesQuery } from "@/server/queries";
import { useT } from "@/lib/i18n";
import { useLoc } from "@/lib/i18n-data";

export interface TestContext {
  projectId: string;
  sampleId: string;
  technician: string;
  testDate: string;
}

interface Props {
  value: TestContext;
  onChange: (v: TestContext) => void;
  defaultCategory?: string;
}

const today = () => new Date().toISOString().slice(0, 10);

export function makeDefaultContext(): TestContext {
  return { projectId: "", sampleId: "", technician: "", testDate: today() };
}

export function TestContextBar({ value, onChange, defaultCategory }: Props) {
  const tt = useT();
  const loc = useLoc();
  // Real data from the API (the old local store was never filled, so the pickers were empty).
  const { data: projects = [] } = useProjectsQuery({});
  const { data: samples = [] } = useSamplesQuery({ limit: 500 });

  // Default to a project that has a sample of this test's type (a test needs one), else the first project.
  useEffect(() => {
    if (value.projectId || projects.length === 0) return;
    const withSample = projects.find((p) => samples.some((s) => s.projectId === p.id && (!defaultCategory || s.type === defaultCategory)));
    onChange({ ...value, projectId: (withSample ?? projects[0]!).id });
  }, [projects, samples, value, onChange, defaultCategory]);

  const projectSamples = useMemo(
    () => samples.filter((s) => s.projectId === value.projectId && (!defaultCategory || s.type === defaultCategory)),
    [samples, value.projectId, defaultCategory]
  );

  useEffect(() => {
    if (value.projectId && !projectSamples.find((s) => s.id === value.sampleId)) {
      onChange({ ...value, sampleId: projectSamples[0]?.id ?? "" });
    }
  }, [value, projectSamples, onChange]);

  return (
    <div className="card p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-[rgb(var(--muted))]">{tt("Project")}</span>
        <select
          className="input"
          value={value.projectId}
          onChange={(e) => onChange({ ...value, projectId: e.target.value, sampleId: "" })}
        >
          <option value="">—</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.code} — {loc(p.name)}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-[rgb(var(--muted))]">{tt("Sample")}</span>
        <select
          className="input"
          value={value.sampleId}
          onChange={(e) => onChange({ ...value, sampleId: e.target.value })}
        >
          <option value="">{projectSamples.length === 0 && value.projectId ? tt("No samples of this type in the project") : "—"}</option>
          {projectSamples.map((s) => (
            <option key={s.id} value={s.id}>{s.code} ({s.type})</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-[rgb(var(--muted))]">{tt("Tested by")}</span>
        <input
          className="input"
          value={value.technician}
          onChange={(e) => onChange({ ...value, technician: e.target.value })}
          placeholder="Eng. Khalid"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-[rgb(var(--muted))]">{tt("Date")}</span>
        <input
          type="date"
          className="input"
          value={value.testDate}
          onChange={(e) => onChange({ ...value, testDate: e.target.value })}
        />
      </label>
    </div>
  );
}
