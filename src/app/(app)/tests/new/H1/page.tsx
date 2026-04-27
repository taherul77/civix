"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, ShieldCheck, Save, Send, Droplets } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { FormSection, Field } from "@/components/test-form/section";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

interface Param {
  key: string;
  label: string;
  unit: string;
  // pass if value is in [min, max] (when both defined) or compare via op
  min?: number;
  max?: number;
  warnAt?: number; // >= warnAt → warning
  group: "physical" | "chemical" | "metals" | "microbiology";
}

const PARAMS: Param[] = [
  { key: "ph",          label: "pH",                       unit: "—",       min: 6.5, max: 8.5, group: "physical" },
  { key: "turbidity",   label: "Turbidity",                unit: "NTU",     max: 5,   group: "physical" },
  { key: "color",       label: "Color",                    unit: "TCU",     max: 15,  group: "physical" },
  { key: "tds",         label: "Total dissolved solids",   unit: "mg/L",    max: 1000,group: "chemical" },
  { key: "chloride",    label: "Chloride",                 unit: "mg/L",    max: 250, group: "chemical" },
  { key: "sulfate",     label: "Sulfate",                  unit: "mg/L",    max: 250, group: "chemical" },
  { key: "nitrate",     label: "Nitrate (as NO₃)",         unit: "mg/L",    max: 50,  group: "chemical" },
  { key: "fluoride",    label: "Fluoride",                 unit: "mg/L",    max: 1.5, group: "chemical" },
  { key: "iron",        label: "Iron",                     unit: "mg/L",    max: 0.3, group: "metals" },
  { key: "manganese",   label: "Manganese",                unit: "mg/L",    max: 0.4, group: "metals" },
  { key: "lead",        label: "Lead",                     unit: "mg/L",    max: 0.01,group: "metals" },
  { key: "arsenic",     label: "Arsenic",                  unit: "mg/L",    max: 0.01,group: "metals" },
  { key: "cadmium",     label: "Cadmium",                  unit: "mg/L",    max: 0.003, group: "metals" },
  { key: "residualCl",  label: "Residual chlorine",        unit: "mg/L",    min: 0.2, max: 0.5, group: "chemical" },
  { key: "coliform",    label: "Total coliform",           unit: "MPN/100mL", max: 0, group: "microbiology" },
  { key: "ecoli",       label: "E. coli",                  unit: "MPN/100mL", max: 0, group: "microbiology" },
];

const seed: Record<string, number> = {
  ph: 7.4, turbidity: 0.8, color: 3, tds: 412, chloride: 84, sulfate: 96, nitrate: 12,
  fluoride: 0.6, iron: 0.05, manganese: 0.02, lead: 0.002, arsenic: 0.001, cadmium: 0.0005,
  residualCl: 0.32, coliform: 0, ecoli: 0,
};

function statusOf(p: Param, v: number): "pass" | "fail" | "warn" {
  if (p.min !== undefined && v < p.min) return "fail";
  if (p.max !== undefined && v > p.max) return "fail";
  if (p.max !== undefined && v >= p.max * 0.8 && p.max > 0) return "warn";
  return "pass";
}

const groupLabels = {
  physical: "Physical parameters",
  chemical: "Chemical parameters",
  metals: "Heavy metals",
  microbiology: "Microbiology",
};

export default function H1Form() {
  const [values, setValues] = useState<Record<string, number>>(seed);
  const [samplingPoint, setSamplingPoint] = useState("Mixing plant tank 3");
  const [sampleType, setSampleType] = useState("tap");

  const evaluations = useMemo(() => PARAMS.map((p) => ({ p, v: values[p.key], s: statusOf(p, values[p.key]) })), [values]);
  const failures = evaluations.filter((e) => e.s === "fail").length;
  const warnings = evaluations.filter((e) => e.s === "warn").length;
  const overall = failures === 0 ? "pass" : "fail";

  const groups = (Object.keys(groupLabels) as (keyof typeof groupLabels)[]).map((g) => ({
    key: g,
    label: groupLabels[g],
    items: evaluations.filter((e) => e.p.group === g),
  }));

  return (
    <div className="space-y-6">
      <Link href="/tests/new" className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to test catalog
      </Link>

      <PageHeader
        title="H1 — Potable Water Analysis"
        description="SASO 1494 — Drinking water quality for construction sites"
        actions={
          <div className="flex items-center gap-2">
            <span className="badge badge-pass inline-flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Saudi-specific
            </span>
            <button className="btn btn-outline"><Save className="w-4 h-4" /> Save draft</button>
            <button className="btn btn-primary"><Send className="w-4 h-4" /> Submit for review</button>
          </div>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          <FormSection step={1} title="Sampling information">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Sampling point" required>
                <input className="input" value={samplingPoint} onChange={(e) => setSamplingPoint(e.target.value)} />
              </Field>
              <Field label="Sample type">
                <select className="input" value={sampleType} onChange={(e) => setSampleType(e.target.value)}>
                  <option value="tap">Tap</option>
                  <option value="well">Well</option>
                  <option value="tank">Tank</option>
                  <option value="bottle">Bottled</option>
                </select>
              </Field>
              <Field label="Collection date">
                <input type="date" className="input" defaultValue="2026-04-28" />
              </Field>
            </div>
          </FormSection>

          {groups.map((g) => (
            <FormSection key={g.key} title={g.label}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                {g.items.map(({ p, v, s }) => (
                  <div key={p.key} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
                    <label className="text-sm">
                      {p.label} <span className="text-[rgb(var(--muted))]">({p.unit})</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={v}
                      onChange={(e) => setValues({ ...values, [p.key]: +e.target.value })}
                      className={cn(
                        "input w-32",
                        s === "fail" && "border-rose-500 focus:ring-rose-500/40",
                        s === "warn" && "border-amber-500 focus:ring-amber-500/40"
                      )}
                    />
                    <div
                      className={cn(
                        "text-[10px] font-bold w-12 text-center rounded px-1 py-0.5",
                        s === "pass" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
                        s === "warn" && "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
                        s === "fail" && "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                      )}
                    >
                      {s.toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-[10px] text-[rgb(var(--muted))] mt-3">
                Limits per SASO 1494 — exceeding any value renders water unsuitable for drinking.
              </div>
            </FormSection>
          ))}
        </div>

        <div className="space-y-4">
          <div className="card p-5 sticky top-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Droplets className="w-4 h-4" /> Live evaluation
              </h3>
              <StatusBadge value={overall} />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg p-3 bg-emerald-500/10 border border-emerald-500/30">
                <div className="text-2xl font-semibold text-emerald-700 dark:text-emerald-300">
                  {PARAMS.length - failures - warnings}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-emerald-700/80 dark:text-emerald-300/80 mt-1">Pass</div>
              </div>
              <div className="rounded-lg p-3 bg-amber-500/10 border border-amber-500/30">
                <div className="text-2xl font-semibold text-amber-700 dark:text-amber-300">{warnings}</div>
                <div className="text-[10px] uppercase tracking-wider text-amber-700/80 dark:text-amber-300/80 mt-1">Warn</div>
              </div>
              <div className="rounded-lg p-3 bg-rose-500/10 border border-rose-500/30">
                <div className="text-2xl font-semibold text-rose-700 dark:text-rose-300">{failures}</div>
                <div className="text-[10px] uppercase tracking-wider text-rose-700/80 dark:text-rose-300/80 mt-1">Fail</div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[rgb(var(--border))]">
              <div className="text-xs uppercase tracking-wider text-[rgb(var(--muted))] font-semibold mb-2">
                Suitability assessment
              </div>
              <ul className="text-sm space-y-1.5">
                <li className={overall === "pass" ? "text-emerald-600" : "text-rose-600"}>
                  {overall === "pass" ? "✓ Suitable for drinking (SASO 1494)" : "✗ NOT suitable for drinking — failures present"}
                </li>
                <li className={values.chloride <= 500 && values.sulfate <= 400 ? "text-emerald-600" : "text-rose-600"}>
                  {values.chloride <= 500 && values.sulfate <= 400
                    ? "✓ Suitable for concrete mixing (ASTM C1602)"
                    : "✗ Cl > 500 or SO₄ > 400 → not for concrete"}
                </li>
                <li className={values.coliform === 0 && values.ecoli === 0 ? "text-emerald-600" : "text-rose-600 font-medium"}>
                  {values.coliform === 0 && values.ecoli === 0
                    ? "✓ Microbiologically safe"
                    : "⚠ Bacterial contamination — health hazard"}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
