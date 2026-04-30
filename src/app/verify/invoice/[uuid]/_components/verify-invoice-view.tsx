"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, ShieldCheck, ShieldAlert, XCircle, Receipt } from "lucide-react";
import { api } from "@/server/api";
import { QrCode } from "@/components/ui/qr-code";
import { decodeZatcaQr } from "@/lib/zatca";

interface State {
  loading: boolean;
  result: Awaited<ReturnType<typeof api.zatca.verifyInvoice>> | null;
}

export function VerifyInvoiceView({ uuid }: { uuid: string }) {
  const [state, setState] = useState<State>({ loading: true, result: null });

  useEffect(() => {
    let alive = true;
    api.zatca.verifyInvoice(uuid).then((r) => {
      if (alive) setState({ loading: false, result: r });
    });
    return () => { alive = false; };
  }, [uuid]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[rgb(var(--bg))]">
      <header className="bg-brand-700 text-white py-4 px-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-white/15 grid place-items-center">
          <Receipt className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <div className="font-semibold">CiviXLab Invoice Verification</div>
          <div className="text-xs text-brand-100/80">
            Public ZATCA Phase 2 verifier — confirms a printed/PDF invoice against its TLV QR
          </div>
        </div>
        <Link href="/login" className="text-xs underline">Sign in</Link>
      </header>

      <main className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="card p-5">
          <div className="text-xs text-[rgb(var(--muted))] mb-1">Looking up UUID</div>
          <div className="font-mono text-sm break-all">{uuid}</div>
        </div>

        {state.loading && (
          <div className="card p-8 text-center text-sm text-[rgb(var(--muted))]">Verifying…</div>
        )}

        {!state.loading && state.result && !state.result.found && (
          <div className="card p-6 border-rose-300 dark:border-rose-900 bg-rose-50/60 dark:bg-rose-950/30">
            <div className="flex items-start gap-3">
              <XCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-rose-700 dark:text-rose-300">No cleared invoice found</div>
                <div className="text-sm mt-1 text-rose-700/80 dark:text-rose-300/80">
                  This UUID was never returned by ZATCA, was issued by another tenant, or the QR has been altered.
                </div>
              </div>
            </div>
          </div>
        )}

        {!state.loading && state.result?.found && <Result result={state.result} />}
      </main>
    </div>
  );
}

function Result({ result }: { result: Extract<Awaited<ReturnType<typeof api.zatca.verifyInvoice>>, { found: true }> }) {
  const decoded = safeDecode(result.qrBase64);
  const scanUrl = typeof window !== "undefined"
    ? `${window.location.origin}/verify/invoice/${result.uuid}`
    : `/verify/invoice/${result.uuid}`;

  return (
    <>
      <div className="card p-6 border-2 border-emerald-500/60 bg-emerald-50/40 dark:bg-emerald-950/20">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-7 h-7 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="text-xs uppercase tracking-wider font-semibold opacity-70">{result.invoiceId}</div>
            <div className="font-bold text-xl mt-1">Cleared</div>
            <div className="text-sm text-[rgb(var(--muted))] mt-1">
              Issued to <strong>{result.client}</strong> on {result.date}
            </div>
          </div>
        </div>
      </div>

      <div className="card p-5 grid grid-cols-1 md:grid-cols-[180px_1fr] gap-4 items-start">
        <div className="p-2 rounded-lg bg-white border border-[rgb(var(--border))] grid place-items-center">
          <QrCode value={scanUrl} size={160} />
        </div>
        <dl className="grid grid-cols-[140px_1fr] text-sm gap-y-2">
          <dt className="text-[rgb(var(--muted))]">Total (with VAT)</dt>
          <dd className="font-mono">SAR {result.total.toLocaleString()}</dd>
          <dt className="text-[rgb(var(--muted))]">VAT (15%)</dt>
          <dd className="font-mono">SAR {result.vat.toLocaleString()}</dd>
          <dt className="text-[rgb(var(--muted))]">Cleared at</dt>
          <dd>{result.clearedAt.replace("T", " ").slice(0, 19)}</dd>
          <dt className="text-[rgb(var(--muted))]">CSID</dt>
          <dd className="font-mono text-xs">
            {result.csidSerial}{" "}
            {result.csidStatus === "active" ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 ml-1">
                <ShieldCheck className="w-3.5 h-3.5" /> active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-600 ml-1">
                <ShieldAlert className="w-3.5 h-3.5" /> rotated since clearance
              </span>
            )}
          </dd>
          <dt className="text-[rgb(var(--muted))]">Invoice hash</dt>
          <dd className="font-mono text-[10px] break-all">{result.invoiceHash}</dd>
        </dl>
      </div>

      {decoded && (
        <div className="card p-5 text-xs">
          <h4 className="font-semibold uppercase tracking-wider text-[rgb(var(--muted))] mb-3">
            TLV-decoded QR fields
          </h4>
          <dl className="grid grid-cols-[180px_1fr] gap-y-1.5">
            <dt className="text-[rgb(var(--muted))]">Tag 1 · Seller</dt><dd>{decoded.sellerName}</dd>
            <dt className="text-[rgb(var(--muted))]">Tag 2 · VAT number</dt><dd className="font-mono">{decoded.vatNumber}</dd>
            <dt className="text-[rgb(var(--muted))]">Tag 3 · Timestamp</dt><dd className="font-mono">{decoded.timestamp}</dd>
            <dt className="text-[rgb(var(--muted))]">Tag 4 · Total</dt><dd className="font-mono">SAR {decoded.invoiceTotal}</dd>
            <dt className="text-[rgb(var(--muted))]">Tag 5 · VAT</dt><dd className="font-mono">SAR {decoded.vatTotal}</dd>
            <dt className="text-[rgb(var(--muted))]">Tag 6 · Hash</dt><dd className="font-mono text-[10px] break-all">{decoded.invoiceHash}</dd>
            <dt className="text-[rgb(var(--muted))]">Tag 7 · Signature</dt><dd className="font-mono text-[10px] break-all">{decoded.signature}</dd>
            <dt className="text-[rgb(var(--muted))]">Tag 9 · Stamp</dt><dd className="font-mono text-[10px] break-all">{decoded.stamp}</dd>
          </dl>
        </div>
      )}

      <p className="text-xs text-[rgb(var(--muted))] text-center">
        ZATCA Phase 2 standard B2B clearance · This page returns a PASS only if the invoice
        was signed with a valid CSID and ZATCA accepted the clearance.
      </p>
    </>
  );
}

function safeDecode(b64: string) {
  try { return decodeZatcaQr(b64); } catch { return null; }
}
