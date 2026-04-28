"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, XCircle, MessageSquare, FileSignature, Lock } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { tests } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { useLoc } from "@/lib/i18n-data";
import { useApp } from "@/store/app-store";
import { fmtAny } from "@/lib/utils";

const queue = tests.filter((t) => t.status === "submitted" || t.status === "reviewed");

export default function ReviewPage() {
  const [selected, setSelected] = useState(queue[0]?.id ?? null);
  const [decision, setDecision] = useState<"approve" | "reject" | null>(null);
  const [comment, setComment] = useState("");
  const [signed, setSigned] = useState(false);
  const tt = useT();
  const loc = useLoc();
  const lang = useApp((s) => s.lang);

  const test = queue.find((t) => t.id === selected) ?? queue[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Review & approval"
        description="Quality Manager / Approver queue. Digital signatures lock the result."
      />

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4">
        <div className="card p-3 space-y-1.5 max-h-[600px] overflow-y-auto">
          {queue.map((t) => (
            <button
              key={t.id}
              onClick={() => { setSelected(t.id); setDecision(null); setSigned(false); setComment(""); }}
              className={cn(
                "w-full text-left rounded-lg p-3 transition-colors",
                selected === t.id ? "bg-brand-50 dark:bg-brand-950/40 border border-brand-300 dark:border-brand-700" : "border border-transparent hover:bg-[rgb(var(--border))]/40"
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
                    : "border-rose-500 bg-rose-50 dark:bg-rose-950/40"
                )}>
                  <div className="text-xs uppercase tracking-wider font-bold opacity-80">{loc(test.primaryResult.label)}</div>
                  <div className="text-3xl font-bold mt-1">{fmtAny(test.primaryResult.value, lang)} <span className="text-base">{test.primaryResult.unit}</span></div>
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
              <h3 className="font-semibold flex items-center gap-2"><MessageSquare className="w-4 h-4" /> {tt("Reviewer comments")}</h3>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="input"
                placeholder={tt("Add your review notes (visible in audit log)...")}
              />

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setDecision("approve")}
                  className={cn("btn flex-1 min-w-[200px]",
                    decision === "approve" ? "bg-emerald-600 text-white" : "btn-outline"
                  )}
                >
                  <CheckCircle2 className="w-4 h-4" /> {tt("Approve")}
                </button>
                <button
                  onClick={() => setDecision("reject")}
                  className={cn("btn flex-1 min-w-[200px]",
                    decision === "reject" ? "bg-rose-600 text-white" : "btn-outline"
                  )}
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
                    onClick={() => setSigned(true)}
                    disabled={signed}
                    className="btn btn-primary w-full"
                  >
                    <Lock className="w-4 h-4" /> {signed ? tt("Signed & locked") : tt("Sign with PKCS#12 certificate")}
                  </button>
                  {signed && (
                    <div className="text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Signed by Dr. Abdullah Al-Rashid · {new Date().toLocaleString()} · Cert SN 7B:11:A8:…
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
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
