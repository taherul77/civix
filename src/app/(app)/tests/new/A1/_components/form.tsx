"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldCheck, Save, Send } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { FormSection, Field, Result } from "@/components/test-form/section";
import { StatusBadge } from "@/components/ui/status-badge";
import { TestContextBar, makeDefaultContext, type TestContext } from "@/components/test-form/context-bar";
import { submitTest } from "@/lib/test-submit";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from "recharts";

const ldCorrection: { ld: number; f: number }[] = [
  { ld: 1.0, f: 0.87 }, { ld: 1.25, f: 0.93 },
  { ld: 1.5, f: 0.96 }, { ld: 1.75, f: 0.98 }, { ld: 1.8, f: 1.0 },
];

function ldFactor(ld: number) {
  if (ld >= 1.8) return 1;
  if (ld <= 1) return 0.87;
  for (let i = 0; i < ldCorrection.length - 1; i++) {
    const a = ldCorrection[i], b = ldCorrection[i + 1];
    if (ld >= a.ld && ld <= b.ld) {
      const r = (ld - a.ld) / (b.ld - a.ld);
      return a.f + r * (b.f - a.f);
    }
  }
  return 1;
}

export function A1Form() {
  const [specType, setSpecType] = useState<"cube_150" | "cyl_150x300" | "cyl_100x200">("cube_150");
  const [castDate, setCastDate] = useState("2026-04-01");
  const [testDate, setTestDate] = useState("2026-04-29");
  const [age, setAge] = useState(28);
  const [diameter, setDiameter] = useState(150);
  const [height, setHeight] = useState(150);
  const [load, setLoad] = useState(875);
  const [temp, setTemp] = useState(23);
  const [humidity, setHumidity] = useState(96);
  const [designStrength, setDesignStrength] = useState(35);
  const [loadingRate, setLoadingRate] = useState(0.25);
  const [capping, setCapping] = useState("neoprene_pads");
  const [condition, setCondition] = useState("saturated");

  // 3-specimen mock
  const [specimens, setSpecimens] = useState([
    { id: "C-1", load: 875 },
    { id: "C-2", load: 862 },
    { id: "C-3", load: 891 },
  ]);

  const isCube = specType === "cube_150";
  const area = useMemo(
    () => (isCube ? diameter * diameter : Math.PI * (diameter / 2) ** 2),
    [diameter, isCube]
  );
  const ld = isCube ? 1 : height / diameter;
  const correction = ldFactor(ld);

  const calc = (loadKn: number) => {
    const fc = (loadKn * 1000) / area;
    const fcCorr = isCube ? fc : fc * correction;
    return { fc, fcCorr };
  };

  const main = calc(load);
  const allFc = specimens.map((s) => calc(s.load).fcCorr);
  const avgFc = allFc.reduce((a, b) => a + b, 0) / allFc.length;

  const designOk = main.fcCorr >= 0.85 * designStrength;
  const avgOk = avgFc >= designStrength;
  const overall = designOk && avgOk ? "pass" : "fail";

  const tempWarn = temp < 18 || temp > 28 ? "Outside 20 ± 2 °C standard curing band" : undefined;
  const humWarn = humidity < 95 ? "SBC 304 requires RH ≥ 95% for moist curing" : undefined;
  const cubeWarn = !isCube ? "Saudi (SBC 304) projects should use 150 mm cubes" : undefined;

  const router = useRouter();
  const [ctx, setCtx] = useState<TestContext>(makeDefaultContext());
  const handleSubmit = (status: "draft" | "submitted") => {
    const passFail = status === "draft" ? "pending" : (overall as "pass" | "fail");
    submitTest({
      code: "A1",
      name: "Compressive Strength of Concrete",
      category: "concrete",
      standard: "SASO GSO ASTM C39 / C94",
      ctx: { ...ctx, testDate: testDate || ctx.testDate },
      status,
      passFail,
      primaryResult: { value: +main.fcCorr.toFixed(2), unit: "MPa", label: `f'c @ ${age}d` },
    });
    router.push("/tests");
  };

  return (
    <div className="space-y-6">
      <Link href="/tests/new" className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to test catalog
      </Link>

      <PageHeader
        title="A1 — Compressive Strength of Concrete"
        description="SASO GSO ASTM C39 / C94 — 150 mm cubes per SBC 304"
        actions={
          <div className="flex items-center gap-2">
            <span className="badge badge-pass inline-flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Saudi-specific
            </span>
            <button className="btn btn-outline" onClick={() => handleSubmit("draft")}>
              <Save className="w-4 h-4" /> Save draft
            </button>
            <button className="btn btn-primary" onClick={() => handleSubmit("submitted")}>
              <Send className="w-4 h-4" /> Submit for review
            </button>
          </div>
        }
      />

      <TestContextBar value={ctx} onChange={setCtx} defaultCategory="concrete" />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          <FormSection step={1} title="Specimen information" description="Geometry and identification">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Specimen type" required help="SBC 304 mandates 150 mm cubes">
                <select className="input" value={specType} onChange={(e) => {
                  const v = e.target.value as typeof specType;
                  setSpecType(v);
                  if (v === "cube_150") { setDiameter(150); setHeight(150); }
                  if (v === "cyl_150x300") { setDiameter(150); setHeight(300); }
                  if (v === "cyl_100x200") { setDiameter(100); setHeight(200); }
                }}>
                  <option value="cube_150">Cube 150 × 150 × 150 mm</option>
                  <option value="cyl_150x300">Cylinder 150 × 300 mm</option>
                  <option value="cyl_100x200">Cylinder 100 × 200 mm</option>
                </select>
              </Field>
              <Field label="Casting date" required>
                <input type="date" className="input" value={castDate} onChange={(e) => setCastDate(e.target.value)} />
              </Field>
              <Field label="Test date" required>
                <input type="date" className="input" value={testDate} onChange={(e) => setTestDate(e.target.value)} />
              </Field>
              <Field label="Age (days)" required>
                <select className="input" value={age} onChange={(e) => setAge(+e.target.value)}>
                  {[3, 7, 28, 56, 90].map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </Field>
              <Field label={isCube ? "Side length (mm)" : "Diameter (mm)"} required warning={cubeWarn}>
                <input type="number" className="input" value={diameter} onChange={(e) => setDiameter(+e.target.value)} />
              </Field>
              <Field label="Height (mm)" required>
                <input type="number" className="input" value={height} onChange={(e) => setHeight(+e.target.value)} />
              </Field>
            </div>
          </FormSection>

          <FormSection step={2} title="Loading & conditions" description="Per ASTM C39: 0.14-0.34 MPa/s">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Max load (kN)" required>
                <input type="number" className="input" value={load} onChange={(e) => setLoad(+e.target.value)} />
              </Field>
              <Field label="Loading rate (MPa/s)">
                <input type="number" step="0.01" className="input" value={loadingRate} onChange={(e) => setLoadingRate(+e.target.value)} />
              </Field>
              <Field label="Capping material">
                <select className="input" value={capping} onChange={(e) => setCapping(e.target.value)}>
                  <option value="sulfur_mortar">Sulfur mortar</option>
                  <option value="neoprene_pads">Neoprene pads</option>
                  <option value="grinding">Grinding</option>
                  <option value="none">None</option>
                </select>
              </Field>
              <Field label="Specimen condition">
                <select className="input" value={condition} onChange={(e) => setCondition(e.target.value)}>
                  <option value="as_received">As received</option>
                  <option value="saturated">Saturated</option>
                  <option value="air_dry">Air dry</option>
                  <option value="oven_dry">Oven dry</option>
                </select>
              </Field>
              <Field label="Temperature (°C)" warning={tempWarn}>
                <input type="number" step="0.1" className="input" value={temp} onChange={(e) => setTemp(+e.target.value)} />
              </Field>
              <Field label="Humidity (%)" warning={humWarn}>
                <input type="number" className="input" value={humidity} onChange={(e) => setHumidity(+e.target.value)} />
              </Field>
            </div>
          </FormSection>

          <FormSection step={3} title="Specifications" description="For pass/fail determination">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Design strength f'c (MPa)" required>
                <input type="number" step="0.1" className="input" value={designStrength} onChange={(e) => setDesignStrength(+e.target.value)} />
              </Field>
            </div>
          </FormSection>

          <FormSection step={4} title="Three-specimen set" description="ASTM C39: average of 3 specimens within 15%">
            <div className="overflow-x-auto">
              <table className="civix">
                <thead>
                  <tr><th>Specimen</th><th>Load (kN)</th><th>Strength (MPa)</th><th>Δ from avg</th></tr>
                </thead>
                <tbody>
                  {specimens.map((s, i) => {
                    const fc = calc(s.load).fcCorr;
                    const dev = ((fc - avgFc) / avgFc) * 100;
                    return (
                      <tr key={s.id}>
                        <td className="font-mono text-xs">{s.id}</td>
                        <td>
                          <input
                            type="number"
                            className="input w-28"
                            value={s.load}
                            onChange={(e) => {
                              const next = [...specimens];
                              next[i] = { ...s, load: +e.target.value };
                              setSpecimens(next);
                            }}
                          />
                        </td>
                        <td className="font-medium">{fc.toFixed(2)}</td>
                        <td className={Math.abs(dev) > 15 ? "text-rose-600 font-medium" : ""}>
                          {dev.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </FormSection>
        </div>

        <div className="space-y-4">
          <div className="card p-5 sticky top-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Live results</h3>
              <StatusBadge value={overall} />
            </div>

            <div className="space-y-3">
              <Result label="Cross-sectional area" value={area.toFixed(1)} unit="mm²" />
              <Result
                label="Compressive strength"
                value={main.fcCorr.toFixed(2)}
                unit="MPa"
                status={designOk ? "pass" : "fail"}
              />
              <Result
                label="Average (3 specimens)"
                value={avgFc.toFixed(2)}
                unit="MPa"
                status={avgOk ? "pass" : "fail"}
              />
              {!isCube && (
                <Result label="L/D ratio · correction" value={`${ld.toFixed(2)} · ${correction.toFixed(3)}`} status="info" />
              )}
              <Result
                label="Strength (psi)"
                value={(main.fcCorr * 145.038).toFixed(0)}
                unit="psi"
                status="info"
              />
            </div>

            <div className="mt-5 pt-4 border-t border-[rgb(var(--border))]">
              <div className="text-xs uppercase tracking-wider text-[rgb(var(--muted))] font-semibold mb-2">
                SBC 304 Pass / Fail
              </div>
              <ul className="text-sm space-y-1.5">
                <li className={designOk ? "text-emerald-600" : "text-rose-600"}>
                  {designOk ? "✓" : "✗"} Individual ≥ 0.85 × f'c ({(0.85 * designStrength).toFixed(1)} MPa)
                </li>
                <li className={avgOk ? "text-emerald-600" : "text-rose-600"}>
                  {avgOk ? "✓" : "✗"} Average ≥ f'c ({designStrength} MPa)
                </li>
              </ul>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold mb-3">Specimens vs design</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={specimens.map((s) => ({ name: s.id, strength: +calc(s.load).fcCorr.toFixed(2) }))}
                margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
                <XAxis dataKey="name" stroke="rgb(var(--muted))" fontSize={11} />
                <YAxis stroke="rgb(var(--muted))" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "rgb(var(--card))",
                    border: "1px solid rgb(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <ReferenceLine y={designStrength} stroke="#2563eb" strokeDasharray="4 4" label={{ value: `f'c = ${designStrength}`, fontSize: 10, fill: "#2563eb" }} />
                <ReferenceLine y={0.85 * designStrength} stroke="#f59e0b" strokeDasharray="4 4" />
                <Bar dataKey="strength" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
