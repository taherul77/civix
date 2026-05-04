"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Crown, Lock, Mail, Loader2, AlertTriangle } from "lucide-react";
import { useApp } from "@/store/app-store";
import { apiFetch } from "@/lib/api-client";
import { api } from "@/server/api";
import type { SessionRecord } from "@/server/contracts";

export function SuperLoginForm() {
  const router = useRouter();
  const user = useApp((s) => s.user);
  const [email, setEmail] = useState("super@civix.sa");
  const [password, setPassword] = useState("demo1234!");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Wait for zustand-persist to rehydrate before deciding whether the user
  // is already signed in. Without this, a reload of /super-login briefly
  // shows the form before the persisted session loads.
  const [hydrated, setHydrated] = useState(() => useApp.persist.hasHydrated());
  useEffect(() => {
    setHydrated(useApp.persist.hasHydrated());
    const unsub = useApp.persist.onFinishHydration(() => setHydrated(true));
    return () => { unsub(); };
  }, []);

  // If a Super Admin reloads this page while still signed in, bounce them
  // straight to /super so they don't have to log in again.
  useEffect(() => {
    if (!hydrated) return;
    if (user?.isSuperAdmin) router.replace("/super");
    else if (user) router.replace("/dashboard");
  }, [hydrated, user, router]);

  if (!hydrated || user) return null;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const out = await apiFetch<
        | {
            kind: "super-admin";
            token: string;
            user: { id: string; email: string; name: string; isSuperAdmin: true };
          }
        | {
            kind: "user";
            userToken: string;
            user: { id: string; email: string; name: string; mfaRequired: boolean; isSuperAdmin: false };
            memberships: unknown[];
          }
      >("/v1/auth/signin", {
        method: "POST",
        noAuth: true,
        body: { email: email.trim(), password },
      });

      if (out.kind !== "super-admin") {
        setError("This account is not a Super Admin. Use the regular sign-in page.");
        return;
      }

      const session: SessionRecord = {
        email: out.user.email,
        name: out.user.name || out.user.email.split("@")[0],
        role: "Super Admin",
        tenant: "—",
        permissions: [],
      };
      useApp.getState().setApiToken(out.token, null);
      useApp.getState().signIn({
        email: session.email,
        name: session.name,
        role: session.role,
        tenant: session.tenant,
        isSuperAdmin: true,
      });

      // Auto-enter the first tenant so all tenant-scoped pages work out of
      // the gate. Super Admin can switch later via /super → Enter. If no
      // tenants exist yet, drop them on /super to create the first one.
      try {
        const list = await apiFetch<{ items: Array<{ id: string }> }>("/v1/super/tenants");
        if (list.items.length > 0) {
          await api.auth.selectTenant(list.items[0].id);
        }
      } catch {
        // ignore — super admin can pick from /super manually
      }

      router.replace("/super");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="w-full max-w-md space-y-5">
      {/* Mobile brand chip */}
      <div className="lg:hidden flex items-center gap-2 mb-6">
        <div className="w-10 h-10 rounded-xl bg-violet-600 grid place-items-center text-white">
          <Crown className="w-5 h-5" />
        </div>
        <div className="text-2xl font-semibold">CiviXLab · Super Admin</div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Crown className="w-5 h-5 text-violet-600" />
          Super Admin sign-in
        </h2>
        <p className="text-sm text-[rgb(var(--muted))] mt-1">
          Restricted area — platform operators only.
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

      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 px-3 py-2 text-sm text-rose-600 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn w-full bg-violet-600 hover:bg-violet-700 text-white"
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>
          : <><Crown className="w-4 h-4" /> Sign in as Super Admin</>}
      </button>

      <p className="text-xs text-[rgb(var(--muted))] text-center">
        Wrong door?{" "}
        <a href="/login" className="text-brand-600 hover:underline">Tenant sign-in</a>
      </p>
    </form>
  );
}
