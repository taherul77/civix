"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, XCircle, MessageSquare, FileSignature, Lock, AlertTriangle } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { useTestsQuery } from "@/server/queries";
import { api } from "@/server/api";
import { mutate } from "@/server/mutate";
import { cn, fmtAny } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { useLoc } from "@/lib/i18n-data";
import { useApp } from "@/store/app-store";
import { useActor, useCan } from "@/lib/auth-context";

export function ReviewWorkbench() {
  const tt = useT();
  const loc = useLoc();
  const lang = useApp((s) => s.lang);
  const actor = useActor();

  const { data: submittedTests = [] } = useTestsQuery({ status: "submitted" });
  const { data: reviewedTests = [] }  = useTestsQuery({ status: "reviewed" });
  const queue = [...submittedTests, ...reviewedTests];
  const [selected, setSelected] = useState<string | null>(null);
  const [decision, setDecision] = useState<"approve" | "reject" | null>(null);
  const [comment, setComment] = useState("");
  const [signed, setSigned] = useState(false);
  const [signedSerial, setSignedSerial] = useState<string | null>(null);

  const test = queue.find((t) => t.id === selected) ?? queue[0];

  const canReview  = useCan("test:review");
  const canApprove = useCan("test:approve");
  const canSign    = useCan("test:sign");

  const reset = () => { setDecision(null); setComment(""); setSigned(false); setSignedSerial(null); };

  const onMarkReviewed = async () => {
    if (!test) return;
    const ok = await mutate(() => api.tests.review(test.id, { comment }), "Marked as reviewed");
    if (ok !== null) reset();
  };

  const onReject = async () => {
    if (!test) return;
    const ok = await mutate(() => api.tests.reject(test.id, { comment }), "Returned for correction");
    if (ok !== null) reset();
  };

  const onApprove = () => setDecision("approve");

  const onSign = async () => {
    if (!test) return;
    const serial = `7B:11:A8:${Math.random().toString(16).slice(2, 6).toUpperCase()}`;
    const signOk = await mutate(() => api.tests.sign(test.id, { certificateSerial: serial }));
    if (signOk === null) return;
    const apvOk = await mutate(() => api.tests.approve(test.id, { comment }), "Approved & locked");
    if (apvOk === null) return;
    setSigned(true);
    setSignedSerial(serial);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4">
      <div className="card p-3 space-y-1.5 max-h-[600px] overflow-y-auto">
        {queue.length === 0 && (
          <div className="text-sm text-[rgb(var(--muted))] p-4 text-center">
            {tt("Review queue empty.")}
          </div>
        )}
        {queue.map((t) => (
          <button
            key={t.id}
            onClick={() => { setSelected(t.id); reset(); }}
            className={cn(
              "w-full text-left rounded-lg p-3 transition-colors",
              (selected ?? queue[0]?.id) === t.id
                ? "bg-brand-50 dark:bg-brand-950/40 border border-brand-300 dark:border-brand-700"
                : "border border-transparent hover:bg-[rgb(var(--border))]/40"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-[rgb(var(--muted))]">{fmtAny(t.code, lang)}</span>
              <StatusBadge value={t.status} />
            </div>
            <div className="font-medium text-sm leading-tight mt-1">{loc(t.name)}</div>
            <div className="flex items-center justify-between mt-2 text-xs text-[rgb(var(--muted))]">
              <span>{fmtAny(t.testDate, lang)}</span>
              <StatusBadge value={t.passFail} />
            </div>
          </button>
        ))}
      </div>

      {test && (
        <div className="space-y-4">
          {!actor && (
            <RoleNotice tone="rose" icon={<AlertTriangle className="w-4 h-4" />}>
              {tt("Sign in to act on this test.")}
            </RoleNotice>
          )}
          {actor && !canReview && !canApprove && (
            <RoleNotice tone="amber" icon={<AlertTriangle className="w-4 h-4" />}>
              {tt("Your role")} <strong>{actor.role}</strong> {tt("cannot review or approve tests.")}
            </RoleNotice>
          )}

          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xs font-mono text-[rgb(var(--muted))]">{fmtAny(test.code, lang)}</div>
                <h2 className="text-xl font-semibold">{loc(test.name)}</h2>
                <div className="text-sm text-[rgb(var(--muted))] mt-1">{test.standard}</div>
              </div>
              <Link href={`/tests/${test.id}/report`} className="btn btn-outline">{tt("View report →")}</Link>
            </div>

            {test.primaryResult && (
              <div className={cn(
                "rounded-lg border-2 p-4 mt-4",
                test.passFail === "pass"
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40"
                  : test.passFail === "fail"
                  ? "border-rose-500 bg-rose-50 dark:bg-rose-950/40"
                  : "border-slate-300 bg-slate-50 dark:bg-slate-900/30"
              )}>
                <div className="text-xs uppercase tracking-wider font-bold opacity-80">{loc(test.primaryResult.label)}</div>
                <div className="text-3xl font-bold mt-1">
                  {fmtAny(test.primaryResult.value, lang)} <span className="text-base">{test.primaryResult.unit}</span>
                </div>
                <div className="mt-2"><StatusBadge value={test.passFail} /></div>
              </div>
            )}

            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <KV label={tt("Tested by")} value={loc(test.technician)} />
              <KV label={tt("Test date")} value={fmtAny(test.testDate, lang)} />
              <KV label={tt("Status")}    value={<StatusBadge value={test.status} />} />
            </div>
          </div>

          <div className="card p-5 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> {tt("Reviewer comments")}
            </h3>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="input"
              placeholder={tt("Add your review notes (visible in audit log)...")}
              disabled={!actor || (!canReview && !canApprove)}
            />

            <div className="flex flex-wrap gap-2">
              {test.status === "submitted" && (
                <button
                  onClick={onMarkReviewed}
                  disabled={!canReview}
                  className="btn btn-outline flex-1 min-w-[200px]"
                  title={canReview ? "" : tt("Requires Quality Manager / Reviewer role")}
                >
                  <CheckCircle2 className="w-4 h-4" /> {tt("Mark reviewed")}
                </button>
              )}

              <button
                onClick={onApprove}
                disabled={!canApprove}
                className={cn("btn flex-1 min-w-[200px]",
                  decision === "approve" ? "bg-emerald-600 text-white" : "btn-outline"
                )}
                title={canApprove ? "" : tt("Requires Approver / Quality Manager role")}
              >
                <CheckCircle2 className="w-4 h-4" /> {tt("Approve")}
              </button>

              <button
                onClick={onReject}
                disabled={!canReview && !canApprove}
                className="btn btn-outline flex-1 min-w-[200px]"
              >
                <XCircle className="w-4 h-4" /> {tt("Return for correction")}
              </button>
            </div>

            {decision === "approve" && (
              <div className="rounded-lg border border-brand-300 dark:border-brand-700 bg-brand-50 dark:bg-brand-950/40 p-4 space-y-3">
                <div className="text-sm font-semibold flex items-center gap-2">
                  <FileSignature className="w-4 h-4" /> {tt("Digital signature required")}
                </div>
                <p className="text-xs">
                  By signing, you certify the result conforms to the referenced standard. The test
                  record will be locked. PKCS#12 cert &middot; Saudi Electronic Transactions Law (ETL).
                </p>
                <button
                  onClick={onSign}
                  disabled={signed || !canSign}
                  className="btn btn-primary w-full"
                  title={canSign ? "" : tt("Only Approvers can sign.")}
                >
                  <Lock className="w-4 h-4" /> {signed ? tt("Signed & locked") : tt("Sign with PKCS#12 certificate")}
                </button>
                {signed && actor && (
                  <div className="text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Signed by {actor.name} · {new Date().toLocaleString()} · Cert SN {signedSerial}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-[rgb(var(--muted))] font-medium">{label}</div>
      <div className="font-medium mt-1">{value}</div>
    </div>
  );
}

function RoleNotice({
  tone, icon, children,
}: {
  tone: "rose" | "amber"; icon: React.ReactNode; children: React.ReactNode;
}) {
  const toneCls = tone === "rose"
    ? "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200"
    : "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200";
  return (
    <div className={cn("flex items-start gap-3 rounded-lg border p-3 text-sm", toneCls)}>
      <span className="mt-0.5">{icon}</span>
      <span>{children}</span>
    </div>
  );
}
