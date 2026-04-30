"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FlaskConical, Lock, Mail, Building2, ShieldCheck, KeyRound, ArrowLeft } from "lucide-react";
import { api } from "@/server/api";
import { mutate } from "@/server/mutate";
import { ALL_ROLES } from "@/lib/rbac";
import { secondsLeft } from "@/lib/totp";

const tenants = [
  { id: "aramco-lab", name: "Saudi Aramco Materials Lab" },
  { id: "neom-cmt", name: "NEOM Construction Materials Testing" },
  { id: "redsea-lab", name: "Red Sea Project Lab" },
  { id: "qiddiya-lab", name: "Qiddiya QA Lab" },
];

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("eng.fahad@aramco-lab.sa");
  const [password, setPassword] = useState("demo");
  const [tenant, setTenant] = useState(tenants[0].id);
  const [role, setRole] = useState<string>("Lab Engineer");
  const [loading, setLoading] = useState(false);

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
    const tenantName = tenants.find((t) => t.id === tenant)?.name ?? "Lab";
    const result = await mutate(() => api.auth.signIn({ email, password, role, tenant: tenantName }));
    setLoading(false);
    if (!result) return;
    if (result.kind === "session") {
      router.replace("/dashboard");
      return;
    }
    setMfaForEmail(result.email);
    setMfaName(result.name);
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

  const cancel = async () => {
    await api.auth.cancelMfa();
    setMfaForEmail(null);
    setMfaCode("");
    setRecoveryMode(false);
    setRecoveryCode("");
  };

  if (mfaForEmail) {
    return (
      <form onSubmit={recoveryMode ? onRecover : onVerify} className="w-full max-w-md space-y-5">
        <div className="lg:hidden flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-600 grid place-items-center text-white">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div className="text-2xl font-semibold">CiviXLab</div>
        </div>

        <button type="button" onClick={cancel} className="text-sm text-brand-600 hover:underline inline-flex items-center gap-1">
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
          Use any credentials — this is a demo build.
        </p>
      </div>

      <div>
        <label className="label">Laboratory</label>
        <div className="relative">
          <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))]" />
          <select value={tenant} onChange={(e) => setTenant(e.target.value)} className="input pl-9">
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Email</label>
        <div className="relative">
          <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))]" />
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input pl-9" />
        </div>
      </div>

      <div>
        <label className="label">Password</label>
        <div className="relative">
          <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))]" />
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input pl-9" />
        </div>
      </div>

      <div>
        <label className="label">Role</label>
        <div className="relative">
          <ShieldCheck className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))]" />
          <select value={role} onChange={(e) => setRole(e.target.value)} className="input pl-9">
            {ALL_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <p className="help mt-1">
          Demo only — pick the role you want to test (e.g. <em>Approver</em> to sign reports,
          <em> Quality Manager</em> to review, <em>Lab Technician</em> to enter data).
        </p>
      </div>

      <button type="submit" disabled={loading} className="btn btn-primary w-full">
        {loading ? "Signing in…" : "Sign in"}
      </button>

      <p className="text-xs text-[rgb(var(--muted))] text-center">
        By signing in you agree to the SAAC accreditation scope and ISO 17025 audit policy.
      </p>
    </form>
  );
}
