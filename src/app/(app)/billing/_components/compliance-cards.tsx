import Link from "next/link";
import { ShieldCheck, ExternalLink } from "lucide-react";

export function ComplianceCards() {
  return (
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
