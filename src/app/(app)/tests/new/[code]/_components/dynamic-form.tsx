"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams, notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck, Save, Send, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { FormSection, Field, Result } from "@/components/test-form/section";
import { StatusBadge } from "@/components/ui/status-badge";
import { TestContextBar, makeDefaultContext, type TestContext } from "@/components/test-form/context-bar";
import { schemas } from "@/lib/test-schemas";
import { categoryMeta } from "@/lib/test-catalog";
import { submitTest, resubmitTest } from "@/lib/test-submit";
import { useTestQuery, useTestCommentsQuery } from "@/server/queries";
import { toast } from "@/components/ui/toast";
import { evaluateTest, isBackendActive, type EngineEvaluation } from "@/lib/api-client";
import { cn } from "@/lib/utils";

/** Shows why the reviewer returned the test while the technician edits it. */
function ReturnReason({ testId }: { testId: string }) {
  const { data: thread = [] } = useTestCommentsQuery(testId);
  const last = [...thread].reverse().find((c) => c.kind === "return");
  if (!last) return null;
  return (
    <div className="rounded-lg border-2 border-amber-400/70 bg-amber-50 dark:bg-amber-950/20 p-4 flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
      <div className="min-w-0">
        <div className="font-semibold text-amber-800 dark:text-amber-200">Returned for correction</div>
        <div className="text-sm mt-1 whitespace-pre-wrap break-words">
          <span className="text-[rgb(var(--muted))]">{last.authorName || last.authorEmail}: </span>{last.body}
        </div>
      </div>
    </div>
  );
}

export function DynamicTestForm({ code }: { code: string }) {
  const schema = schemas[code];
  if (!schema) notFound();

  const router = useRouter();
  const [ctx, setCtx] = useState<TestContext>(makeDefaultContext());
  const [saving, setSaving] = useState(false);

  // Edit mode: /tests/new/<code>?edit=<test id> reopens a draft or returned test.
  const editId = useSearchParams().get("edit");
  const { data: editTest, isLoading: editLoading } = useTestQuery(editId ?? undefined);
  const [prefilled, setPrefilled] = useState(false);
  const editProblem =
    !editId ? null
    : editLoading ? null
    : !editTest ? "That test could not be found."
    : editTest.code !== schema.code ? `That test was created with form ${editTest.code}, not ${schema.code}.`
    : editTest.status !== "returned" && editTest.status !== "draft" ? "This test is in review or approved and can no longer be edited."
    : null;

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

  useEffect(() => {
    if (!editTest || prefilled || editProblem) return;
    const known = new Set(schema.sections.flatMap((sec) => sec.fields.map((f) => f.key)));
    const saved = editTest.inputData ?? {};
    setValues((v) => {
      const next = { ...v };
      for (const [k, val] of Object.entries(saved)) {
        if (known.has(k) && (typeof val === "number" || typeof val === "string")) next[k] = val;
      }
      return next;
    });
    setCtx((c) => ({ ...c, projectId: editTest.projectId, sampleId: editTest.sampleId, testDate: editTest.testDate.slice(0, 10) }));
    setPrefilled(true);
  }, [editTest, prefilled, editProblem, schema]);

  const computedResults = useMemo(() => schema.results.map((r) => {
    const raw = r.compute(values);
    const display = typeof raw === "number" ? raw.toFixed(r.decimals ?? 2) : String(raw);
    return { ...r, raw, display };
  }), [schema, values]);

  // Server-authoritative evaluation. When signed in against the backend, the
  // engine's verdict replaces the local one (local math stays as instant/offline preview).
  const [server, setServer] = useState<EngineEvaluation | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  useEffect(() => {
    if (!isBackendActive()) return;
    let cancelled = false;
    const t = setTimeout(() => {
      evaluateTest(schema.code, values)
        .then((r) => { if (!cancelled) { setServer(r); setServerError(null); } })
        .catch((e: Error) => { if (!cancelled) { setServer(null); setServerError(e.message); } });
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [schema.code, values]);

  const localPasses = schema.passRules.map((r) => ({ label: r.label, ok: r.ok(values) }));
  const passes = server
    ? server.checks.filter((c) => c.status !== "info").map((c) => ({ label: c.label, ok: c.status !== "fail" }))
    : localPasses;
  const localOverall: "pass" | "fail" | "pending" =
    localPasses.length === 0 ? "pending" : localPasses.every((p) => p.ok) ? "pass" : "fail";
  const overall: "pass" | "fail" | "pending" = server
    ? (server.overall === "warning" ? "pass" : server.overall)
    : localOverall;
  const meta = categoryMeta[schema.category];

  const primary = computedResults.find((r) => typeof r.raw === "number");
  const primaryResult = primary && typeof primary.raw === "number"
    ? { value: +primary.raw.toFixed(primary.decimals ?? 2), unit: primary.unit ?? "", label: primary.label }
    : undefined;

  const handleSubmit = async (status: "draft" | "submitted") => {
    const passFail = status === "draft"
      ? "pending"
      : passes.length === 0 ? "pending" : overall;
    // What gets stored with the test: the entered values and the engine's results.
    const calculatedResults: Record<string, unknown> = server
      ? server.results
      : Object.fromEntries(computedResults.map((r) => [r.label, r.raw]));
    setSaving(true);
    try {
      if (editId) {
        await resubmitTest(editId, {
          inputData: values,
          calculatedResults: { ...calculatedResults, ...(primaryResult ? { primaryResult } : {}) },
          passFail: passes.length === 0 ? "pending" : overall,
          testDate: ctx.testDate,
        });
        toast.success("Corrections saved and test resubmitted");
        router.push(`/tests/${editId}`);
      } else {
        await submitTest({
          code: schema.code,
          name: schema.name,
          category: schema.category,
          standard: schema.standard,
          ctx,
          status,
          passFail,
          primaryResult,
          inputData: values,
          calculatedResults,
        });
        router.push("/tests");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save the test");
    } finally {
      setSaving(false);
    }
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
            {!editId && (
              <button className="btn btn-outline" onClick={() => handleSubmit("draft")} disabled={saving}>
                <Save className="w-4 h-4" /> Save draft
              </button>
            )}
            <button
              className="btn btn-primary"
              onClick={() => handleSubmit("submitted")}
              disabled={saving || (!!editId && (!prefilled || !!editProblem))}
            >
              <Send className="w-4 h-4" /> {editId ? "Save corrections & resubmit" : "Submit"}
            </button>
          </div>
        }
      />

      <p className="text-sm text-[rgb(var(--muted))] -mt-4">{schema.description}</p>

      {editId && !editProblem && <ReturnReason testId={editId} />}
      {editProblem && (
        <div className="rounded-lg border border-rose-300 bg-rose-50 dark:bg-rose-950/30 p-3 text-sm text-rose-700 dark:text-rose-300">
          {editProblem} <Link href={editTest ? `/tests/${editTest.id}` : "/tests"} className="underline">Back to the test</Link>
        </div>
      )}

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
            {server && (
              <p className="-mt-2 mb-3 text-[11px] text-emerald-600 inline-flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Verified by server
              </p>
            )}
            {serverError && (
              <p className="-mt-2 mb-3 text-[11px] text-amber-600">Server check unavailable: {serverError}. Showing local preview.</p>
            )}
            {server?.warnings.map((w) => (
              <p key={w} className="mb-2 text-xs text-amber-600">⚠ {w}</p>
            ))}

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
