"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, ShieldCheck, AlertTriangle, Save, Send, Thermometer } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { FormSection, Field, Result } from "@/components/test-form/section";
import { StatusBadge } from "@/components/ui/status-badge";

export default function A4Form() {
  const [concreteT, setConcreteT] = useState(33);
  const [ambientT, setAmbientT] = useState(38);
  const [formworkT, setFormworkT] = useState(36);
  const [wind, setWind] = useState(8);
  const [rh, setRh] = useState(28);
  const [cement, setCement] = useState(380);
  const [cooling, setCooling] = useState("ice");

  const internal = useMemo(() => concreteT + cement * 0.02, [concreteT, cement]);
  const dSurface = internal - formworkT;
  const dAmbient = internal - ambientT;
  const heatIdx = cement * (concreteT / 20);

  const c1 = concreteT <= 35;
  const c2 = internal <= 65;
  const c3 = dSurface <= 25;
  const c4 = dAmbient <= 20;
  const overall = c1 && c2 && c3 && c4 ? "pass" : "fail";

  const Limit = ({ ok, label }: { ok: boolean; label: string }) => (
    <li className={ok ? "text-emerald-600" : "text-rose-600 font-medium"}>
      {ok ? "✓" : "✗"} {label}
    </li>
  );

  return (
    <div className="space-y-6">
      <Link href="/tests/new" className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to test catalog
      </Link>

      <PageHeader
        title="A4 — Concrete Placement Temperature"
        description="SBC 304 / ASTM C1064 — Mandatory hot-weather monitoring"
        actions={
          <div className="flex items-center gap-2">
            <span className="badge badge-pass inline-flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Saudi-mandatory
            </span>
            <button className="btn btn-outline"><Save className="w-4 h-4" /> Save draft</button>
            <button className="btn btn-primary"><Send className="w-4 h-4" /> Submit for review</button>
          </div>
        }
      />

      {!c1 && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-500/5 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-rose-700 dark:text-rose-300">Critical limit exceeded</div>
            <div className="text-sm text-rose-600 dark:text-rose-400">
              SBC 304 hard limit: concrete placement temperature must not exceed 35 °C. Cooling
              measures (ice, chilled water, retarder) are required before placement may proceed.
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          <FormSection step={1} title="Temperature readings" description="Record at placement, every 30 minutes">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Concrete temperature (°C)" required>
                <input type="number" step="0.1" className="input" value={concreteT} onChange={(e) => setConcreteT(+e.target.value)} />
              </Field>
              <Field label="Ambient temperature (°C)" required>
                <input type="number" step="0.1" className="input" value={ambientT} onChange={(e) => setAmbientT(+e.target.value)} />
              </Field>
              <Field label="Formwork temperature (°C)">
                <input type="number" step="0.1" className="input" value={formworkT} onChange={(e) => setFormworkT(+e.target.value)} />
              </Field>
            </div>
          </FormSection>

          <FormSection step={2} title="Environmental conditions">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Wind speed (km/h)">
                <input type="number" step="0.1" className="input" value={wind} onChange={(e) => setWind(+e.target.value)} />
              </Field>
              <Field label="Relative humidity (%)">
                <input type="number" className="input" value={rh} onChange={(e) => setRh(+e.target.value)} />
              </Field>
              <Field label="Cement content (kg/m³)">
                <input type="number" className="input" value={cement} onChange={(e) => setCement(+e.target.value)} />
              </Field>
            </div>
          </FormSection>

          <FormSection step={3} title="Cooling measures">
            <Field label="Cooling method in use">
              <select className="input" value={cooling} onChange={(e) => setCooling(e.target.value)}>
                <option value="none">None</option>
                <option value="ice">Ice in mix</option>
                <option value="chilled_water">Chilled mixing water</option>
                <option value="retarder">Set retarder</option>
                <option value="shading">Shading / windbreaks</option>
              </select>
            </Field>
          </FormSection>
        </div>

        <div className="space-y-4">
          <div className="card p-5 sticky top-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2"><Thermometer className="w-4 h-4" /> Live monitoring</h3>
              <StatusBadge value={overall} />
            </div>

            <div className="space-y-3">
              <Result label="Concrete T (placement)" value={concreteT.toFixed(1)} unit="°C" status={c1 ? "pass" : "fail"} />
              <Result label="Internal T (estimated)" value={internal.toFixed(1)} unit="°C" status={c2 ? "pass" : "fail"} />
              <Result label="Δ interior – surface" value={dSurface.toFixed(1)} unit="°C" status={c3 ? "pass" : "fail"} />
              <Result label="Δ interior – ambient" value={dAmbient.toFixed(1)} unit="°C" status={c4 ? "pass" : "fail"} />
              <Result label="Heat-of-hydration index" value={heatIdx.toFixed(0)} status="info" />
            </div>

            <div className="mt-5 pt-4 border-t border-[rgb(var(--border))]">
              <div className="text-xs uppercase tracking-wider text-[rgb(var(--muted))] font-semibold mb-2">
                SBC 304 mandatory limits
              </div>
              <ul className="text-sm space-y-1.5">
                <Limit ok={c1} label="Placement T ≤ 35 °C" />
                <Limit ok={c2} label="Internal T ≤ 65 °C" />
                <Limit ok={c3} label="Interior – surface ≤ 25 °C" />
                <Limit ok={c4} label="Interior – ambient ≤ 20 °C" />
              </ul>
              <p className="text-xs text-[rgb(var(--muted))] mt-3">
                Any single failure → overall FAIL. Cooling measures required before placement.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
