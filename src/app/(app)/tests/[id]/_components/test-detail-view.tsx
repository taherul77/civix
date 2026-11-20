"use client";

import Link from "next/link";
import { useState } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft, FileCheck, FileText, Send, RotateCcw, Pencil, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Modal } from "@/components/ui/modal";
import { CommentThread } from "@/components/tests/comment-thread";
import { catalog } from "@/lib/test-catalog";
import { useTestQuery, useSampleQuery, useProjectQuery, useAuditQuery, useTestCommentsQuery } from "@/server/queries";
import { api } from "@/server/api";
import { mutate } from "@/server/mutate";
import { useLoc } from "@/lib/i18n-data";
import { useT } from "@/lib/i18n";
import { useApp } from "@/store/app-store";
import { fmtAny } from "@/lib/utils";
import { useCan } from "@/lib/auth-context";

export function TestDetailView({ id }: { id: string }) {
  const tt = useT();
  const loc = useLoc();
  const lang = useApp((s) => s.lang);
  const { data: test, isLoading: testLoading } = useTestQuery(id);
  const { data: sample } = useSampleQuery(test?.sampleId);
  const { data: project } = useProjectQuery(test?.projectId);
  const { data: audit = [] } = useAuditQuery();

  const canSubmit = useCan("test:submit");
  const canReview = useCan("test:review");
  const { data: thread = [] } = useTestCommentsQuery(id);
  const [returning, setReturning] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  // 404 only after the lookup finished; at first render `test` is still undefined.
  if (!test) {
    if (testLoading) return <div className="card p-10 text-center text-sm text-[rgb(var(--muted))]">{tt("Loading…")}</div>;
    notFound();
  }
  const testAudit = audit.filter((a) => a.entity === "test" && a.entityId === test.id);
  const lastByAction = (action: string) => testAudit.find((a) => a.action === action);
  const submitEvt   = lastByAction("submit");
  const reviewEvt   = lastByAction("review");
  const approveEvt  = lastByAction("approve");
  const signEvt     = lastByAction("sign");
  // A returned/draft test is outside the review cycle: earlier review/approval events no longer count.
  const cycleOpen = test.status === "returned" || test.status === "draft";
  const lastReturn = [...thread].reverse().find((c) => c.kind === "return");
  // Bespoke forms (A1/A4/H1) cannot be reopened for editing yet; every catalog form that uses the generic form can.
  const BESPOKE_FORMS = ["A1", "A4", "H1"];
  const editHref = !BESPOKE_FORMS.includes(test.code) && catalog.some((c) => c.code === test.code)
    ? `/tests/new/${test.code}?edit=${test.id}`
    : null;

  const doReturn = async () => {
    setBusy(true);
    try {
      const ok = await mutate(() => api.tests.return(test.id, { comment: reason.trim() }), "Returned for correction");
      if (ok !== null) { setReturning(false); setReason(""); } // null = failed (toast already shown)
    } finally {
      setBusy(false);
    }
  };

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
            {test.status === "draft" && (
              <button
                onClick={() => mutate(() => api.tests.submit(test.id), "Submitted for review")}
                disabled={!canSubmit}
                className="btn btn-outline"
                title={canSubmit ? "" : tt("Requires Lab Engineer / Technician role")}
              >
                <Send className="w-4 h-4" /> {tt("Submit for review")}
              </button>
            )}
            {(test.status === "submitted" || test.status === "reviewed") && (
              <button
                onClick={() => setReturning(true)}
                disabled={!canReview}
                className="btn btn-outline"
                title={canReview ? "" : tt("Requires a reviewer role")}
              >
                <RotateCcw className="w-4 h-4" /> {tt("Return for correction")}
              </button>
            )}
            {test.status === "returned" && editHref && (
              <Link href={editHref} className="btn btn-outline">
                <Pencil className="w-4 h-4" /> {tt("Edit and resubmit")}
              </Link>
            )}
            {test.status === "returned" && (
              <button
                onClick={() => mutate(() => api.tests.submit(test.id), "Resubmitted for review")}
                disabled={!canSubmit}
                className="btn btn-outline"
                title={tt("Send back for review without changing the data")}
              >
                <Send className="w-4 h-4" /> {tt("Resubmit unchanged")}
              </button>
            )}
            <Link href={`/tests/${test.id}/report`} className="btn btn-primary">
              <FileCheck className="w-4 h-4" /> {tt("View report")}
            </Link>
          </div>
        }
      />

      {test.status === "returned" && (
        <div className="rounded-lg border-2 border-amber-400/70 bg-amber-50 dark:bg-amber-950/20 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <div className="font-semibold text-amber-800 dark:text-amber-200">{tt("Returned for correction")}</div>
            {lastReturn && (
              <div className="text-sm mt-1 whitespace-pre-wrap break-words">
                <span className="text-[rgb(var(--muted))]">{lastReturn.authorName || lastReturn.authorEmail}: </span>{lastReturn.body}
              </div>
            )}
            <div className="text-xs text-[rgb(var(--muted))] mt-1.5">
              {editHref
                ? tt("Fix the data with Edit and resubmit, or resubmit unchanged if no change is needed.")
                : tt("This form cannot be reopened for editing yet. Resubmit unchanged, or enter a corrected test.")}
            </div>
          </div>
        </div>
      )}

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
          <Step
            done
            label={tt("Created")}
            by={loc(test.technician)}
            at={fmtAny(test.testDate, lang)}
          />
          <Step
            done={(!cycleOpen && !!submitEvt) || ["submitted","reviewed","approved"].includes(test.status)}
            label={tt("Submitted for review")}
            by={submitEvt?.user ?? loc(test.technician)}
            at={submitEvt?.ts ?? "—"}
          />
          <Step
            done={(!cycleOpen && !!reviewEvt) || ["reviewed","approved"].includes(test.status)}
            label={tt("Reviewed")}
            by={reviewEvt?.user ?? tt("Quality Manager")}
            at={reviewEvt?.ts ?? "—"}
          />
          <Step
            done={(!cycleOpen && !!approveEvt) || test.status === "approved"}
            label={tt("Approved")}
            by={approveEvt?.user ?? tt("Approver")}
            at={approveEvt?.ts ?? "—"}
          />
          <Step
            done={!cycleOpen && !!signEvt}
            label={tt("Digitally signed")}
            by={signEvt?.user ?? "—"}
            at={signEvt?.ts ?? "—"}
          />
          <div className="pt-3 border-t border-[rgb(var(--border))]">
            <Link href={`/tests/${test.id}/report`} className="btn btn-outline w-full"><FileText className="w-4 h-4" /> {tt("Open report / PDF")}</Link>
          </div>
        </div>
      </div>

      <CommentThread testId={test.id} />

      <Modal
        open={returning}
        onClose={() => setReturning(false)}
        title={tt("Return for correction")}
        size="md"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setReturning(false)}>{tt("Cancel")}</button>
            <button className="btn btn-primary" onClick={doReturn} disabled={busy || reason.trim().length < 3}>
              <RotateCcw className="w-4 h-4" /> {tt("Return to technician")}
            </button>
          </>
        }
      >
        <p className="text-sm text-[rgb(var(--muted))] mb-2">{tt("Say what needs to be corrected. The technician sees this on the test.")}</p>
        <textarea
          className="input min-h-[110px]"
          autoFocus
          value={reason}
          maxLength={2000}
          onChange={(e) => setReason(e.target.value)}
          placeholder={tt("e.g. The load reading looks wrong, please re-check the gauge and re-enter it.")}
        />
        {reason.trim().length > 0 && reason.trim().length < 3 && (
          <p className="text-xs text-rose-600 mt-1">{tt("Please write a few words.")}</p>
        )}
      </Modal>
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
