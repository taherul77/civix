"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FlaskConical, Lock, Mail, Building2, KeyRound, ArrowLeft } from "lucide-react";
import { api } from "@/server/api";
import { mutate } from "@/server/mutate";
import { secondsLeft } from "@/lib/totp";
import type { MembershipChoice } from "@/server/contracts";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Company picker — only shown when the user has 2+ memberships.
  const [memberships, setMemberships] = useState<MembershipChoice[] | null>(null);

  // MFA challenge state
  const [mfaForEmail, setMfaForEmail] = useState<string | null>(null);
  const [mfaName, setMfaName] = useState<string>("");
  const [mfaCode, setMfaCode] = useState("");
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState("");
  const [tick, setTick] = useState(secondsLeft());

  useEffect(() => {
    if (!mfaForEmail) return;
    const id = setInterval(() => setTick(secondsLeft()), 1000);
    return () => clearInterval(id);
  }, [mfaForEmail]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await mutate(() => api.auth.signIn({ email, password }));
    setLoading(false);
    if (!result) return;
    if (result.kind === "session") {
      router.replace("/dashboard");
      return;
    }
    if (result.kind === "pick-tenant") {
      setMemberships(result.memberships);
      return;
    }
    setMfaForEmail(result.email);
    setMfaName(result.name);
  };

  const onPickTenant = async (m: MembershipChoice) => {
    setLoading(true);
    const result = await mutate(
      () => api.auth.selectTenant(m.tenantId),
      `Signed in to ${m.tenantName}`
    );
    setLoading(false);
    if (result?.kind === "session") router.replace("/dashboard");
  };

  const onVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mfaCode.length !== 6) return;
    setLoading(true);
    const session = await mutate(() => api.auth.verifyMfa({ code: mfaCode }), "Signed in");
    setLoading(false);
    if (session) router.replace("/dashboard");
  };

  const onRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryCode.trim()) return;
    setLoading(true);
    const session = await mutate(
      () => api.auth.verifyRecoveryCode({ recoveryCode: recoveryCode.trim() }),
      "Signed in via recovery code"
    );
    setLoading(false);
    if (session) router.replace("/dashboard");
  };

  const cancelMfa = async () => {
    await api.auth.cancelMfa();
    setMfaForEmail(null);
    setMfaCode("");
    setRecoveryMode(false);
    setRecoveryCode("");
  };

  // ---------- Company picker view ----------
  if (memberships) {
    return (
      <div className="w-full max-w-md space-y-5">
        <div className="lg:hidden flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-600 grid place-items-center text-white">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div className="text-2xl font-semibold">CiviXLab</div>
        </div>

        <button
          type="button"
          onClick={() => setMemberships(null)}
          className="text-sm text-brand-600 hover:underline inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> Back to sign-in
        </button>

        <div>
          <h2 className="text-2xl font-semibold">Pick a company</h2>
          <p className="text-sm text-[rgb(var(--muted))] mt-1">
            You belong to multiple labs — choose which one to enter.
          </p>
        </div>

        <ul className="space-y-2">
          {memberships.map((m) => (
            <li key={m.tenantId}>
              <button
                type="button"
                onClick={() => onPickTenant(m)}
                disabled={loading}
                className="w-full flex items-center gap-3 p-4 rounded-xl border border-[rgb(var(--border))] hover:border-brand-500 hover:bg-brand-500/5 text-left transition-colors disabled:opacity-50"
              >
                <div className="w-12 h-12 rounded-xl bg-[rgb(var(--bg-soft))] grid place-items-center overflow-hidden shrink-0">
                  {m.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.logoUrl} alt="" className="w-full h-full object-contain" />
                  ) : (
                    <Building2 className="w-5 h-5 text-[rgb(var(--muted))]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{m.tenantName}</div>
                  <div className="text-xs text-[rgb(var(--muted))]">
                    <span className="font-mono">{m.subdomain}.civixlab.com</span>
                    <span className="mx-2">·</span>
                    <span>{m.role}</span>
                    {m.department && (
                      <>
                        <span className="mx-2">·</span>
                        <span>{m.department}</span>
                      </>
                    )}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // ---------- MFA view ----------
  if (mfaForEmail) {
    return (
      <form onSubmit={recoveryMode ? onRecover : onVerify} className="w-full max-w-md space-y-5">
        <div className="lg:hidden flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-600 grid place-items-center text-white">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div className="text-2xl font-semibold">CiviXLab</div>
        </div>

        <button type="button" onClick={cancelMfa} className="text-sm text-brand-600 hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Cancel sign-in
        </button>

        <div>
          <h2 className="text-2xl font-semibold">Two-factor authentication</h2>
          <p className="text-sm text-[rgb(var(--muted))] mt-1">
            Hi {mfaName} — enter the 6-digit code from your authenticator app.
          </p>
        </div>

        {!recoveryMode ? (
          <>
            <div>
              <label className="label">Authentication code</label>
              <input
                autoFocus
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="input text-center font-mono text-2xl tracking-widest"
                placeholder="• • •  • • •"
              />
              <div className="text-[10px] text-[rgb(var(--muted))] mt-1 text-right">
                Current code expires in {tick}s
              </div>
            </div>

            <button type="submit" disabled={loading || mfaCode.length !== 6} className="btn btn-primary w-full">
              {loading ? "Verifying…" : "Verify & sign in"}
            </button>

            <button
              type="button"
              onClick={() => setRecoveryMode(true)}
              className="btn btn-ghost w-full text-sm"
            >
              <KeyRound className="w-4 h-4" /> Use a recovery code instead
            </button>
          </>
        ) : (
          <>
            <div>
              <label className="label">Recovery code</label>
              <input
                autoFocus
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                className="input font-mono"
                placeholder="XXXX-XXXX"
              />
              <p className="help mt-1">Each recovery code can be used once.</p>
            </div>

            <button type="submit" disabled={loading || !recoveryCode.trim()} className="btn btn-primary w-full">
              {loading ? "Verifying…" : "Sign in with recovery code"}
            </button>

            <button
              type="button"
              onClick={() => setRecoveryMode(false)}
              className="btn btn-ghost w-full text-sm"
            >
              Back to authenticator code
            </button>
          </>
        )}
      </form>
    );
  }

  // ---------- Credentials view ----------
  return (
    <form onSubmit={onSubmit} className="w-full max-w-md space-y-5">
      <div className="lg:hidden flex items-center gap-2 mb-6">
        <div className="w-10 h-10 rounded-xl bg-brand-600 grid place-items-center text-white">
          <FlaskConical className="w-5 h-5" />
        </div>
        <div className="text-2xl font-semibold">CiviXLab</div>
      </div>
      <div>
        <h2 className="text-2xl font-semibold">Sign in</h2>
        <p className="text-sm text-[rgb(var(--muted))] mt-1">
          Use the credentials your company admin provided.
        </p>
      </div>

      <div>
        <label className="label">Email</label>
        <div className="relative">
          <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))]" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input pl-9"
            autoComplete="email"
            placeholder="you@example.com"
          />
        </div>
      </div>

      <div>
        <label className="label">Password</label>
        <div className="relative">
          <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))]" />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input pl-9"
            autoComplete="current-password"
          />
        </div>
      </div>

      <button type="submit" disabled={loading} className="btn btn-primary w-full">
        {loading ? "Signing in…" : "Sign in"}
      </button>

      <p className="text-xs text-[rgb(var(--muted))] text-center">
        By signing in you agree to the SAAC accreditation scope and ISO 17025 audit policy.
      </p>

      <p className="text-xs text-center text-[rgb(var(--muted))]">
        Platform operator?{" "}
        <a href="/super-login" className="text-violet-600 hover:underline">
          Super Admin sign-in
        </a>
      </p>
    </form>
  );
}
