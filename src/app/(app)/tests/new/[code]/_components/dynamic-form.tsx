"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck, Save, Send } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { FormSection, Field, Result } from "@/components/test-form/section";
import { StatusBadge } from "@/components/ui/status-badge";
import { TestContextBar, makeDefaultContext, type TestContext } from "@/components/test-form/context-bar";
import { schemas } from "@/lib/test-schemas";
import { categoryMeta } from "@/lib/test-catalog";
import { submitTest } from "@/lib/test-submit";
import { cn } from "@/lib/utils";

export function DynamicTestForm({ code }: { code: string }) {
  const schema = schemas[code];
  if (!schema) notFound();

  const router = useRouter();
  const [ctx, setCtx] = useState<TestContext>(makeDefaultContext());

  const initial: Record<string, number | string> = {};
  for (const sec of schema.sections) {
    for (const f of sec.fields) {
      if (f.default !== undefined) initial[f.key] = f.default;
      else if (f.type === "select" && f.options) initial[f.key] = f.options[0].value;
      else if (f.type === "number") initial[f.key] = 0;
      else initial[f.key] = "";
    }
  }
  const [values, setValues] = useState<Record<string, number | string>>(initial);

  const computedResults = useMemo(() => schema.results.map((r) => {
    const raw = r.compute(values);
    const display = typeof raw === "number" ? raw.toFixed(r.decimals ?? 2) : String(raw);
    return { ...r, raw, display };
  }), [schema, values]);

  const passes = schema.passRules.map((r) => ({ label: r.label, ok: r.ok(values) }));
  const overall: "pass" | "fail" | "pending" =
    passes.length === 0 ? "pending" : passes.every((p) => p.ok) ? "pass" : "fail";
  const meta = categoryMeta[schema.category];

  const primary = computedResults.find((r) => typeof r.raw === "number");
  const primaryResult = primary && typeof primary.raw === "number"
    ? { value: +primary.raw.toFixed(primary.decimals ?? 2), unit: primary.unit ?? "", label: primary.label }
    : undefined;

  const handleSubmit = (status: "draft" | "submitted") => {
    const passFail = status === "draft"
      ? "pending"
      : passes.length === 0 ? "pending" : overall;
    submitTest({
      code: schema.code,
      name: schema.name,
      category: schema.category,
      standard: schema.standard,
      ctx,
      status,
      passFail,
      primaryResult,
    });
    router.push("/tests");
  };

  return (
    <div className="space-y-6">
      <Link href="/tests/new" className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to test catalog
      </Link>

      <PageHeader
        title={`${schema.code} — ${schema.name}`}
        description={schema.standard}
        actions={
          <div className="flex items-center gap-2">
            <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-white bg-gradient-to-r", meta.tone)}>
              {meta.label}
            </span>
            {schema.saudiSpecific && (
              <span className="badge badge-pass inline-flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Saudi-specific
              </span>
            )}
            <button className="btn btn-outline" onClick={() => handleSubmit("draft")}>
              <Save className="w-4 h-4" /> Save draft
            </button>
            <button className="btn btn-primary" onClick={() => handleSubmit("submitted")}>
              <Send className="w-4 h-4" /> Submit
            </button>
          </div>
        }
      />

      <p className="text-sm text-[rgb(var(--muted))] -mt-4">{schema.description}</p>

      <TestContextBar value={ctx} onChange={setCtx} defaultCategory={schema.category} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          {schema.sections.map((sec, idx) => (
            <FormSection key={sec.title} step={idx + 1} title={sec.title} description={sec.description}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sec.fields.map((f) => (
                  <Field key={f.key} label={`${f.label}${f.unit ? ` (${f.unit})` : ""}`} required={f.required} help={f.help}>
                    {f.type === "select" ? (
                      <select
                        className="input"
                        value={values[f.key] as string}
                        onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                      >
                        {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    ) : f.type === "date" ? (
                      <input
                        type="date"
                        className="input"
                        value={values[f.key] as string}
                        onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                      />
                    ) : f.type === "text" ? (
                      <input
                        className="input"
                        value={values[f.key] as string}
                        onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                      />
                    ) : (
                      <input
                        type="number"
                        step={f.step ?? "any"}
                        className="input"
                        value={values[f.key] as number}
                        onChange={(e) => setValues({ ...values, [f.key]: e.target.value === "" ? 0 : +e.target.value })}
                      />
                    )}
                  </Field>
                ))}
              </div>
            </FormSection>
          ))}
        </div>

        <div className="space-y-4">
          <div className="card p-5 sticky top-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Live results</h3>
              <StatusBadge value={overall} />
            </div>

            <div className="space-y-3">
              {computedResults.map((r) => (
                <Result
                  key={r.label}
                  label={r.label}
                  value={r.display}
                  unit={r.unit}
                  status="info"
                />
              ))}
            </div>

            {passes.length > 0 && (
              <div className="mt-5 pt-4 border-t border-[rgb(var(--border))]">
                <div className="text-xs uppercase tracking-wider text-[rgb(var(--muted))] font-semibold mb-2">
                  Pass / fail
                </div>
                <ul className="text-sm space-y-1.5">
                  {passes.map((p) => (
                    <li key={p.label} className={p.ok ? "text-emerald-600" : "text-rose-600 font-medium"}>
                      {p.ok ? "✓" : "✗"} {p.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
