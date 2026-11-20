"use client";

import { Building2, KeyRound, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

// SSO is on the roadmap (enterprise tier) but not implemented yet, so every
// provider is listed as "coming soon" instead of showing made-up user counts.
const samlProviders = [
  { id: "azure",  name: "Azure AD",         color: "from-sky-600 to-blue-700" },
  { id: "okta",   name: "Okta",             color: "from-blue-600 to-indigo-700" },
  { id: "google", name: "Google Workspace", color: "from-red-500 to-amber-500" },
  { id: "ms365",  name: "Microsoft 365",    color: "from-cyan-600 to-sky-700" },
];

export function SsoProvidersCard() {
  const tt = useT();
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2"><Building2 className="w-4 h-4" /> {tt("SAML 2.0 SSO")}</h3>
        <button className="btn btn-outline px-3" disabled title={tt("Coming soon")}><Plus className="w-4 h-4" /> {tt("Add")}</button>
      </div>
      <div className="space-y-3">
        {samlProviders.map((p) => (
          <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg border border-[rgb(var(--border))]">
            <div className={cn("w-10 h-10 rounded-lg grid place-items-center text-white bg-gradient-to-br", p.color)}>
              <KeyRound className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="font-medium">{p.name}</div>
              <div className="text-xs text-[rgb(var(--muted))]">
                {tt("Not configured")}
              </div>
            </div>
            <span className="badge badge-muted">{tt("Coming soon")}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 pt-4 border-t border-[rgb(var(--border))] text-xs text-[rgb(var(--muted))] space-y-1">
        <div>Service Provider EntityID: <span className="font-mono">civixlab.sa/saml/{`{tenant}`}</span></div>
        <div>ACS URL: <span className="font-mono">civixlab.sa/api/saml/acs</span></div>
        <div>Assertion encryption: <span className="font-mono">AES-256-CBC</span></div>
      </div>
    </div>
  );
}
