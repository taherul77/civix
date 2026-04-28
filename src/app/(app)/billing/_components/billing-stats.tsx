"use client";

import { Receipt, FileText, ShieldCheck } from "lucide-react";
import { useInvoicesQuery } from "@/server/queries";
import { useT } from "@/lib/i18n";

export function BillingStats() {
  const tt = useT();
  const { data: invoices = [] } = useInvoicesQuery();
  const totalInv = invoices.reduce((a, b) => a + b.amount + b.vat, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Stat label={tt("Invoices YTD")} value={invoices.length} icon={Receipt} />
      <Stat label={tt("Revenue YTD (SAR)")} value={totalInv.toLocaleString()} icon={FileText} />
      <Stat label={tt("ZATCA compliance")} value="Phase 2 ✓" icon={ShieldCheck} tone="emerald" />
    </div>
  );
}

function Stat({
  label, value, icon: Icon, tone = "brand",
}: {
  label: string; value: string | number; icon: typeof Receipt; tone?: "brand" | "emerald";
}) {
  const toneCls = tone === "emerald"
    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
    : "bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300";
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl grid place-items-center ${toneCls}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-xs uppercase tracking-wider text-[rgb(var(--muted))] font-medium">{label}</div>
        <div className="text-2xl font-semibold mt-0.5">{value}</div>
      </div>
    </div>
  );
}
