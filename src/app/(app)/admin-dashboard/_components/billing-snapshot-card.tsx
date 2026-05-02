"use client";

import Link from "next/link";
import { ArrowRight, FileCheck2, FileClock, FileText } from "lucide-react";
import { useInvoicesQuery } from "@/server/queries";
import { useT } from "@/lib/i18n";

const sar = (v: number) =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(v) + " SAR";

export function BillingSnapshotCard() {
  const tt = useT();
  const { data: invoices = [] } = useInvoicesQuery();

  const draft = invoices.filter((i) => i.status === "draft");
  const sent  = invoices.filter((i) => i.status === "sent");
  const paid  = invoices.filter((i) => i.status === "paid");
  const cleared = invoices.filter((i) => !!i.zatcaPayload);

  const sum = (arr: typeof invoices) => arr.reduce((t, i) => t + i.amount + i.vat, 0);
  const grandTotal = sum(invoices);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">{tt("Billing snapshot")}</h3>
        <Link href="/billing" className="text-xs text-brand-600 hover:underline inline-flex items-center gap-1">
          {tt("Open billing")} <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {invoices.length === 0 ? (
        <div className="text-sm text-[rgb(var(--muted))] py-8 text-center">
          {tt("No invoices yet")}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <StatusTile icon={FileText}   label={tt("Draft")} count={draft.length} amount={sum(draft)} tone="slate" />
            <StatusTile icon={FileClock}  label={tt("Sent")}  count={sent.length}  amount={sum(sent)}  tone="amber" />
            <StatusTile icon={FileCheck2} label={tt("Paid")}  count={paid.length}  amount={sum(paid)}  tone="emerald" />
          </div>

          <div className="flex items-center justify-between text-sm pt-3 border-t border-[rgb(var(--border))]">
            <span className="text-[rgb(var(--muted))]">{tt("Total billed (incl. VAT)")}</span>
            <span className="font-semibold">{sar(grandTotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1.5">
            <span className="text-[rgb(var(--muted))]">{tt("ZATCA cleared")}</span>
            <span className="font-mono">{cleared.length} / {invoices.length}</span>
          </div>
        </>
      )}
    </div>
  );
}

const TONE: Record<string, string> = {
  slate:   "bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-200",
  amber:   "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
};

function StatusTile({
  icon: Icon, label, count, amount, tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
  amount: number;
  tone: keyof typeof TONE;
}) {
  return (
    <div className="rounded-xl border border-[rgb(var(--border))] p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg ${TONE[tone]}`}>
          <Icon className="w-3.5 h-3.5" />
        </span>
        <span className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">
          {label}
        </span>
      </div>
      <div className="text-2xl font-bold leading-none">{count}</div>
      <div className="text-xs text-[rgb(var(--muted))] mt-1">{sar(amount)}</div>
    </div>
  );
}
