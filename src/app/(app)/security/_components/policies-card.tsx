"use client";

import { Shield } from "lucide-react";
import { useT } from "@/lib/i18n";

const POLICIES = [
  { label: "Password min length", value: "12 characters" },
  { label: "Password complexity", value: "Upper + lower + digit + symbol" },
  { label: "Password rotation", value: "Every 90 days" },
  { label: "Failed attempts", value: "Lock after 5 attempts" },
  { label: "Session timeout", value: "30 minutes idle" },
  { label: "MFA enforcement", value: "Required for Approver, Quality Manager, Tenant Admin" },
  { label: "IP allowlist", value: "Off (toggle per role)" },
  { label: "Device binding", value: "Trusted devices remembered 30 days" },
  { label: "Audit retention", value: "ISO 17025 §8.4 — 7 years" },
];

export function PoliciesCard() {
  const tt = useT();
  return (
    <div className="card p-5 xl:col-span-2">
      <h3 className="font-semibold mb-4 flex items-center gap-2"><Shield className="w-4 h-4" /> {tt("Access policies")}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
        {POLICIES.map((p) => (
          <div key={p.label} className="rounded-lg border border-[rgb(var(--border))] p-3">
            <div className="text-xs text-[rgb(var(--muted))] uppercase tracking-wider">{p.label}</div>
            <div className="font-medium mt-1">{p.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
