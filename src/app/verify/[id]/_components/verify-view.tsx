"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, ShieldCheck, ShieldAlert, XCircle, FlaskConical, FileSearch } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/server/api";
import type { VerifyResult } from "@/server/contracts";

export function VerifyView({ id }: { id: string }) {
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api.reports.verify(id).then((r) => {
      if (alive) { setResult(r); setLoading(false); }
    });
    return () => { alive = false; };
  }, [id]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[rgb(var(--bg))]">
      <header className="bg-brand-700 text-white py-4 px-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-white/15 grid place-items-center">
          <FlaskConical className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <div className="font-semibold">CiviXLab Report Verification</div>
          <div className="text-xs text-brand-100/80">
            Public verifier — confirms a printed/PDF report against the lab&apos;s audit chain
          </div>
        </div>
        <Link href="/login" className="text-xs underline">Sign in</Link>
      </header>

      <main className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="card p-5">
          <div className="flex items-center gap-2 text-xs text-[rgb(var(--muted))] mb-2">
            <FileSearch className="w-3.5 h-3.5" /> Looking up
          </div>
          <div className="font-mono text-sm break-all">{id}</div>
        </div>

        {loading && (
          <div className="card p-8 text-center text-sm text-[rgb(var(--muted))]">
            Verifying…
          </div>
        )}

        {!loading && result && !result.found && (
          <NotFoundCard reportNumber={id} />
        )}

        {!loading && result && result.found && <ReportCard r={result} />}
      </main>
    </div>
  );
}

function NotFoundCard({ reportNumber }: { reportNumber: string }) {
  return (
    <div className="card p-6 border-rose-300 dark:border-rose-900 bg-rose-50/60 dark:bg-rose-950/30">
      <div className="flex items-start gap-3">
        <XCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold text-rose-700 dark:text-rose-300">No report found</div>
          <div className="text-sm mt-1 text-rose-700/80 dark:text-rose-300/80">
            <span className="font-mono">{reportNumber}</span> does not match any test in this lab.
            The report may have been revoked, the laboratory may be a different tenant, or the QR
            code may have been altered.
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportCard({ r }: { r: VerifyResult }) {
  const conformOk = r.conformity === "conforms";
  const signed = !!r.signatureSerial;
  return (
    <>
      <div
        className={cn(
          "card p-6 border-2",
          conformOk
            ? "border-emerald-500/60 bg-emerald-50/40 dark:bg-emerald-950/20"
            : r.conformity === "does_not_conform"
            ? "border-rose-500/60 bg-rose-50/40 dark:bg-rose-950/20"
            : "border-slate-300 dark:border-slate-800"
        )}
      >
        <div className="flex items-start gap-3">
          {conformOk ? (
            <CheckCircle2 className="w-7 h-7 text-emerald-600 shrink-0 mt-0.5" />
          ) : r.conformity === "does_not_conform" ? (
            <XCircle className="w-7 h-7 text-rose-600 shrink-0 mt-0.5" />
          ) : (
            <ShieldAlert className="w-7 h-7 text-slate-500 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <div className="text-xs uppercase tracking-wider font-semibold opacity-70">
              {r.reportNumber}
            </div>
            <div className="font-bold text-xl mt-1">
              {conformOk
                ? "Conforms"
                : r.conformity === "does_not_conform"
                ? "Does not conform"
                : "Pending result"}
            </div>
            <div className="text-sm text-[rgb(var(--muted))] mt-1">
              Test {r.testCode} · {r.standard}
            </div>
          </div>
        </div>
      </div>

      <div className="card p-5 space-y-3 text-sm">
        <Row label="Signature">
          {signed ? (
            <span className="inline-flex items-center gap-1 text-emerald-600">
              <ShieldCheck className="w-3.5 h-3.5" />
              Digitally signed · cert SN {r.signatureSerial}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-amber-600">
              <ShieldAlert className="w-3.5 h-3.5" /> Unsigned draft
            </span>
          )}
        </Row>
        {r.signedBy && <Row label="Signed by">{r.signedBy}</Row>}
        {r.signedAt && <Row label="Signed at">{r.signedAt}</Row>}
        {r.approvedAt && <Row label="Approved at">{r.approvedAt}</Row>}
        <Row label="Audit chain">
          {r.chainOk ? (
            <span className="inline-flex items-center gap-1 text-emerald-600">
              <ShieldCheck className="w-3.5 h-3.5" /> Intact (ISO 17025 §8.4)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-rose-600">
              <ShieldAlert className="w-3.5 h-3.5" />
              Broken at {r.brokenAt} — DO NOT TRUST
            </span>
          )}
        </Row>
      </div>

      <p className="text-xs text-[rgb(var(--muted))] text-center">
        This page is the public verification endpoint targeted by the QR code on the report PDF.
        It returns a PASS only if the report has been digitally signed, the recorded conformity
        result is &quot;Conforms&quot;, and the lab&apos;s audit chain is intact.
      </p>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[rgb(var(--muted))]">{label}</span>
      <span className="font-medium text-right">{children}</span>
    </div>
  );
}
