"use client";

import Link from "next/link";
import { Receipt, FileText, ShieldCheck, Download, ExternalLink, Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { useT } from "@/lib/i18n";

const invoices = [
  { id: "INV-2026-0418", client: "NEOM Co.",          amount: 87_500,  vat: 13_125, status: "paid",     date: "2026-04-12", zatca: "ZX-A8B12C" },
  { id: "INV-2026-0419", client: "Red Sea Global",    amount: 42_300,  vat:  6_345, status: "paid",     date: "2026-04-15", zatca: "ZX-7D11E9" },
  { id: "INV-2026-0420", client: "Qiddiya Investment",amount: 21_800,  vat:  3_270, status: "sent",     date: "2026-04-22", zatca: "ZX-4F88AA" },
  { id: "INV-2026-0421", client: "Diriyah Company",   amount: 38_400,  vat:  5_760, status: "draft",    date: "2026-04-27", zatca: "—" },
];

export default function BillingPage() {
  const tt = useT();
  const totalInv = invoices.reduce((a, b) => a + b.amount + b.vat, 0);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing — ZATCA & Etimad"
        description="VAT e-invoicing (Phase 2) and government procurement integration."
        actions={<button className="btn btn-primary"><Plus className="w-4 h-4" /> {tt("New invoice")}</button>}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Stat label={tt("Invoices YTD")} value={invoices.length} icon={Receipt} />
        <Stat label={tt("Revenue YTD (SAR)")} value={totalInv.toLocaleString()} icon={FileText} />
        <Stat label={tt("ZATCA compliance")} value="Phase 2 ✓" icon={ShieldCheck} tone="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> ZATCA e-invoicing
          </h3>
          <dl className="text-sm space-y-3">
            <Row label="Phase" value={<span className="badge badge-pass">Phase 2 (integration)</span>} />
            <Row label="CSID status" value={<span className="text-emerald-600">Active · expires 2027-01-15</span>} />
            <Row label="Cryptographic stamp" value="ECDSA P-256 · last rotated 2026-02-04" />
            <Row label="QR codes" value="Embedded in every PDF (TLV-encoded)" />
            <Row label="Reporting mode" value="Standard B2B (cleared in real-time)" />
          </dl>
          <Link href="#" className="btn btn-outline w-full mt-4">
            <ExternalLink className="w-4 h-4" /> Open ZATCA portal
          </Link>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-600" /> Etimad procurement
          </h3>
          <dl className="text-sm space-y-3">
            <Row label="Vendor ID" value={<span className="font-mono text-xs">ETMD-7711-2A</span>} />
            <Row label="Active contracts" value="4 (NEOM, Red Sea, Qiddiya, Diriyah)" />
            <Row label="Submitted bids" value="11 awaiting evaluation" />
            <Row label="Compliance score" value={<span className="text-emerald-600 font-medium">94 / 100</span>} />
          </dl>
          <Link href="#" className="btn btn-outline w-full mt-4">
            <ExternalLink className="w-4 h-4" /> Open Etimad
          </Link>
        </div>
      </div>

      <div className="card overflow-hidden">
        <h3 className="font-semibold p-4 border-b border-[rgb(var(--border))]">{tt("Recent invoices")}</h3>
        <div className="overflow-x-auto">
          <table className="civix">
            <thead>
              <tr>
                <th>{tt("Invoice")}</th>
                <th>{tt("Client")}</th>
                <th>{tt("Date")}</th>
                <th>{tt("Amount")}</th>
                <th>{tt("VAT (15%)")}</th>
                <th>{tt("ZATCA UUID")}</th>
                <th>{tt("Status")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="font-mono text-xs">{inv.id}</td>
                  <td>{inv.client}</td>
                  <td>{inv.date}</td>
                  <td className="font-mono text-sm">SAR {inv.amount.toLocaleString()}</td>
                  <td className="font-mono text-sm">SAR {inv.vat.toLocaleString()}</td>
                  <td className="font-mono text-xs">{inv.zatca}</td>
                  <td>
                    <span className={`badge ${inv.status === "paid" ? "badge-pass" : inv.status === "sent" ? "badge-info" : "badge-muted"}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-ghost px-2"><Download className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon, tone = "brand" }: { label: string; value: string | number; icon: typeof Receipt; tone?: "brand" | "emerald" }) {
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

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-[rgb(var(--muted))]">{label}</dt>
      <dd className="font-medium text-right">{value}</dd>
    </div>
  );
}
