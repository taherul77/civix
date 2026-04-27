"use client";

import { useState } from "react";
import { Shield, Smartphone, KeyRound, Copy, CheckCircle2, Building2, Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";

const samlProviders = [
  { id: "azure",  name: "Azure AD",        status: "configured", users: 41, color: "from-sky-600 to-blue-700" },
  { id: "okta",   name: "Okta",            status: "available",  users: 0,  color: "from-blue-600 to-indigo-700" },
  { id: "google", name: "Google Workspace",status: "configured", users: 18, color: "from-red-500 to-amber-500" },
  { id: "ms365",  name: "Microsoft 365",   status: "available",  users: 0,  color: "from-cyan-600 to-sky-700" },
];

export default function SecurityPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [code, setCode] = useState("");
  const secret = "JBSWY3DPEHPK3PXP";

  return (
    <div className="space-y-6">
      <PageHeader title="Security" description="MFA enrolment, SSO providers, and access policies." />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* MFA */}
        <div className="card p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Smartphone className="w-4 h-4" /> Two-factor authentication</h3>

          <div className="flex items-center gap-2 mb-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className={cn(
                "flex-1 h-1.5 rounded-full",
                n <= step ? "bg-emerald-500" : "bg-[rgb(var(--border))]"
              )} />
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-[rgb(var(--muted))]">
                Scan this QR code with Google Authenticator, Authy, or 1Password.
              </p>
              <div className="grid place-items-center">
                <div className="w-48 h-48 grid grid-cols-12 grid-rows-12 gap-px bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">
                  {Array.from({ length: 144 }).map((_, i) => (
                    <div key={i} className={Math.random() > 0.5 ? "bg-slate-900 dark:bg-slate-100" : ""} />
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs text-[rgb(var(--muted))] mb-1">Or enter this secret manually:</div>
                <div className="flex items-center gap-2">
                  <code className="input font-mono">{secret}</code>
                  <button className="btn btn-outline px-3"><Copy className="w-4 h-4" /></button>
                </div>
              </div>
              <button onClick={() => setStep(2)} className="btn btn-primary w-full">Continue</button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm">Enter the 6-digit code from your authenticator app to verify the device.</p>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="input text-center font-mono text-2xl tracking-widest"
                placeholder="• • •  • • •"
              />
              <button
                onClick={() => setStep(3)}
                disabled={code.length !== 6}
                className="btn btn-primary w-full"
              >
                Verify
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                <div>
                  <div className="font-semibold text-emerald-700 dark:text-emerald-300">MFA enabled</div>
                  <div className="text-sm text-emerald-600/80 dark:text-emerald-400/80">
                    Save these recovery codes in a secure location.
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wider text-[rgb(var(--muted))] mb-2 font-semibold">Recovery codes</div>
                <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                  {["A4F2-9X1B","K88P-LZ2W","T9E1-3MQ4","HV7K-22TX","M0NP-X44L","PR1E-9LH3","8BCJ-Q1RR","QQ77-DXEC"].map((c) => (
                    <div key={c} className="px-3 py-2 rounded bg-[rgb(var(--border))]/50">{c}</div>
                  ))}
                </div>
              </div>
              <button onClick={() => setStep(1)} className="btn btn-outline w-full">Re-enrol</button>
            </div>
          )}
        </div>

        {/* SAML / SSO */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2"><Building2 className="w-4 h-4" /> SAML 2.0 SSO</h3>
            <button className="btn btn-outline px-3"><Plus className="w-4 h-4" /> Add</button>
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
                    {p.status === "configured" ? `${p.users} users via SSO` : "Not configured"}
                  </div>
                </div>
                <span className={`badge ${p.status === "configured" ? "badge-pass" : "badge-muted"}`}>{p.status}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-[rgb(var(--border))] text-xs text-[rgb(var(--muted))] space-y-1">
            <div>Service Provider EntityID: <span className="font-mono">civixlab.sa/saml/{`{tenant}`}</span></div>
            <div>ACS URL: <span className="font-mono">civixlab.sa/api/saml/acs</span></div>
            <div>Assertion encryption: <span className="font-mono">AES-256-CBC</span></div>
          </div>
        </div>

        {/* Policies */}
        <div className="card p-5 xl:col-span-2">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Shield className="w-4 h-4" /> Access policies</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <Policy label="Password min length" value="12 characters" />
            <Policy label="Password complexity" value="Upper + lower + digit + symbol" />
            <Policy label="Password rotation" value="Every 90 days" />
            <Policy label="Failed attempts" value="Lock after 5 attempts" />
            <Policy label="Session timeout" value="30 minutes idle" />
            <Policy label="MFA enforcement" value="Required for Approver, Quality Manager, Tenant Admin" />
            <Policy label="IP allowlist" value="Off (toggle per role)" />
            <Policy label="Device binding" value="Trusted devices remembered 30 days" />
            <Policy label="Audit retention" value="ISO 17025 §8.4 — 7 years" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Policy({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[rgb(var(--border))] p-3">
      <div className="text-xs text-[rgb(var(--muted))] uppercase tracking-wider">{label}</div>
      <div className="font-medium mt-1">{value}</div>
    </div>
  );
}
