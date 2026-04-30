"use client";

import { useEffect, useState } from "react";
import { Smartphone, Copy, CheckCircle2, ShieldOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { useApp } from "@/store/app-store";
import { useActor } from "@/lib/auth-context";
import { api } from "@/server/api";
import { mutate } from "@/server/mutate";
import { toast } from "@/components/ui/toast";
import { QrCode } from "@/components/ui/qr-code";
import { secondsLeft } from "@/lib/totp";

type Step = "idle" | "scan" | "verify" | "done";

export function MfaEnrolment() {
  const tt = useT();
  const actor = useActor();
  const enrolled = useApp((s) => (actor ? s.mfa[actor.email] : undefined));

  const [step, setStep] = useState<Step>("idle");
  const [secret, setSecret] = useState<string>("");
  const [uri, setUri] = useState<string>("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const [tick, setTick] = useState(secondsLeft());

  // 1-second clock so the "expires in" indicator updates.
  useEffect(() => {
    const id = setInterval(() => setTick(secondsLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  const begin = async () => {
    const init = await mutate(() => api.auth.beginMfaEnrolment());
    if (!init) return;
    setSecret(init.secret);
    setUri(init.otpauthUri);
    setRecoveryCodes(init.recoveryCodes);
    setStep("scan");
  };

  const confirm = async () => {
    if (code.length !== 6) return;
    const ok = await mutate(
      () => api.auth.confirmMfaEnrolment(secret, recoveryCodes, { code }),
      "MFA enabled"
    );
    if (!ok) return;
    setStep("done");
  };

  const disable = async () => {
    const ok = await mutate(() => api.auth.disableMfa(), "MFA disabled");
    if (!ok) return;
    setStep("idle"); setSecret(""); setUri(""); setRecoveryCodes([]); setCode("");
  };

  const isEnrolled = !!enrolled && step !== "scan" && step !== "verify" && step !== "done";

  return (
    <div className="card p-5">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Smartphone className="w-4 h-4" /> {tt("Two-factor authentication")}
      </h3>

      {!actor && (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 p-4 text-sm">
          Sign in first to enrol MFA.
        </div>
      )}

      {actor && isEnrolled && (
        <div className="space-y-4">
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
            <div>
              <div className="font-semibold text-emerald-700 dark:text-emerald-300">
                MFA enabled (TOTP)
              </div>
              <div className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1">
                Enrolled {new Date(enrolled.enrolledAt).toLocaleString()} ·{" "}
                {enrolled.recoveryCodes.length} unused recovery codes remaining.
              </div>
            </div>
          </div>
          <button onClick={disable} className="btn btn-outline w-full">
            <ShieldOff className="w-4 h-4" /> Disable MFA
          </button>
        </div>
      )}

      {actor && !isEnrolled && step === "idle" && (
        <div className="space-y-3">
          <p className="text-sm text-[rgb(var(--muted))]">
            Add a TOTP authenticator app (Google Authenticator, Authy, 1Password) to require a
            6-digit code at sign-in.
          </p>
          <button onClick={begin} className="btn btn-primary w-full">
            Set up 2FA
          </button>
        </div>
      )}

      {actor && step === "scan" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            {[1, 2, 3].map((n) => (
              <div key={n} className={cn("flex-1 h-1.5 rounded-full", n <= 1 ? "bg-emerald-500" : "bg-[rgb(var(--border))]")} />
            ))}
          </div>
          <p className="text-sm text-[rgb(var(--muted))]">
            Scan this QR code with your authenticator app. Code rotates every 30s.
          </p>
          <div className="grid place-items-center">
            <div className="p-3 rounded-lg bg-white border border-[rgb(var(--border))]">
              <QrCode value={uri} size={192} />
            </div>
          </div>
          <div>
            <div className="text-xs text-[rgb(var(--muted))] mb-1">Or enter this secret manually:</div>
            <div className="flex items-center gap-2">
              <code className="input font-mono">{secret}</code>
              <button
                type="button"
                className="btn btn-outline px-3"
                onClick={() => { void navigator.clipboard.writeText(secret); toast.info("Secret copied"); }}
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
          <button onClick={() => setStep("verify")} className="btn btn-primary w-full">
            {tt("Continue")}
          </button>
        </div>
      )}

      {actor && step === "verify" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            {[1, 2, 3].map((n) => (
              <div key={n} className={cn("flex-1 h-1.5 rounded-full", n <= 2 ? "bg-emerald-500" : "bg-[rgb(var(--border))]")} />
            ))}
          </div>
          <p className="text-sm">Enter the 6-digit code from your app to confirm enrolment.</p>
          <div>
            <input
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="input text-center font-mono text-2xl tracking-widest"
              placeholder="• • •  • • •"
            />
            <div className="text-[10px] text-[rgb(var(--muted))] mt-1 text-right">
              Current code expires in {tick}s
            </div>
          </div>
          <button onClick={confirm} disabled={code.length !== 6} className="btn btn-primary w-full">
            {tt("Verify")}
          </button>
        </div>
      )}

      {actor && step === "done" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex-1 h-1.5 rounded-full bg-emerald-500" />
            ))}
          </div>
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
            <div>
              <div className="font-semibold text-emerald-700 dark:text-emerald-300">MFA enabled</div>
              <div className="text-sm text-emerald-600/80 dark:text-emerald-400/80">
                Save these recovery codes in a secure location. Each can be used once if you lose your device.
              </div>
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-[rgb(var(--muted))] mb-2 font-semibold">
              Recovery codes
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono text-sm">
              {recoveryCodes.map((c) => (
                <div key={c} className="px-3 py-2 rounded bg-[rgb(var(--border))]/50">{c}</div>
              ))}
            </div>
          </div>
          <button
            onClick={() => { void navigator.clipboard.writeText(recoveryCodes.join("\n")); toast.success("Recovery codes copied"); }}
            className="btn btn-outline w-full"
          >
            <Copy className="w-4 h-4" /> Copy recovery codes
          </button>
          <button onClick={() => setStep("idle")} className="btn btn-ghost w-full">
            Done
          </button>
        </div>
      )}
    </div>
  );
}
