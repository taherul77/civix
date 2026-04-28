"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FlaskConical, Lock, Mail, Building2, ShieldCheck } from "lucide-react";
import { useApp } from "@/store/app-store";
import { useData } from "@/store/data-store";
import { ALL_ROLES } from "@/lib/rbac";

const tenants = [
  { id: "aramco-lab", name: "Saudi Aramco Materials Lab" },
  { id: "neom-cmt", name: "NEOM Construction Materials Testing" },
  { id: "redsea-lab", name: "Red Sea Project Lab" },
  { id: "qiddiya-lab", name: "Qiddiya QA Lab" },
];

export function LoginForm() {
  const router = useRouter();
  const signIn = useApp((s) => s.signIn);
  const log = useData((s) => s.log);
  const [email, setEmail] = useState("eng.fahad@aramco-lab.sa");
  const [password, setPassword] = useState("demo");
  const [tenant, setTenant] = useState(tenants[0].id);
  const [role, setRole] = useState<string>("Lab Engineer");
  const [loading, setLoading] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const tenantName = tenants.find((t) => t.id === tenant)?.name ?? "Lab";
      const name = email
        .split("@")[0]
        .split(".")
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(" ");
      signIn({ email, name, role, tenant: tenantName });
      log({
        user: `${name} (${role})`,
        email,
        action: "login",
        entity: "session",
        entityId: email,
      });
      router.replace("/dashboard");
    }, 400);
  };

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
