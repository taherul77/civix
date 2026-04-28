"use client";

import { useState } from "react";
import { Smartphone, Copy, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

const SECRET = "JBSWY3DPEHPK3PXP";

export function MfaEnrolment() {
  const tt = useT();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [code, setCode] = useState("");

  return (
    <div className="card p-5">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Smartphone className="w-4 h-4" /> {tt("Two-factor authentication")}
      </h3>

      <div className="flex items-center gap-2 mb-4">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className={cn("flex-1 h-1.5 rounded-full", n <= step ? "bg-emerald-500" : "bg-[rgb(var(--border))]")}
          />
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
              <code className="input font-mono">{SECRET}</code>
              <button className="btn btn-outline px-3"><Copy className="w-4 h-4" /></button>
            </div>
          </div>
          <button onClick={() => setStep(2)} className="btn btn-primary w-full">{tt("Continue")}</button>
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
          <button onClick={() => setStep(3)} disabled={code.length !== 6} className="btn btn-primary w-full">
            {tt("Verify")}
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
          <button onClick={() => setStep(1)} className="btn btn-outline w-full">{tt("Re-enrol")}</button>
        </div>
      )}
    </div>
  );
}
