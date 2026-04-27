"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FlaskConical, Lock, Mail, Building2 } from "lucide-react";
import { useApp } from "@/store/app-store";

const tenants = [
  { id: "aramco-lab", name: "Saudi Aramco Materials Lab" },
  { id: "neom-cmt", name: "NEOM Construction Materials Testing" },
  { id: "redsea-lab", name: "Red Sea Project Lab" },
  { id: "qiddiya-lab", name: "Qiddiya QA Lab" },
];

export default function LoginPage() {
  const router = useRouter();
  const signIn = useApp((s) => s.signIn);
  const [email, setEmail] = useState("eng.fahad@aramco-lab.sa");
  const [password, setPassword] = useState("demo");
  const [tenant, setTenant] = useState(tenants[0].id);
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
      signIn({ email, name, role: "Lab Engineer", tenant: tenantName });
      router.replace("/dashboard");
    }, 400);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 grid place-items-center backdrop-blur">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div className="text-2xl font-semibold tracking-tight">CiviXLab</div>
        </div>

        <div className="space-y-6 max-w-lg">
          <h1 className="text-4xl font-semibold leading-tight">
            Multi-tenant lab testing for Saudi Arabia &amp; the GCC.
          </h1>
          <p className="text-brand-100/90 text-lg">
            SBC 304 compliant. SASO &amp; GSO standards. ISO 17025 audit trail. 75 curated tests
            spanning concrete, soil, aggregate, asphalt, steel, cement, masonry &amp; water.
          </p>
          <ul className="space-y-2 text-sm text-brand-100/80">
            <li>• 150 mm cube specimens (SBC 304)</li>
            <li>• Concrete placement temperature ≤ 35 °C enforced</li>
            <li>• SASO 1494 potable water quality limits</li>
            <li>• Multi-tenant with row-level security</li>
          </ul>
        </div>

        <div className="text-xs text-brand-200/70">
          © {new Date().getFullYear()} CiviXLab • SAAC-ready • ZATCA Phase 2
        </div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12">
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
              <select
                value={tenant}
                onChange={(e) => setTenant(e.target.value)}
                className="input pl-9"
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
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
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary w-full">
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <p className="text-xs text-[rgb(var(--muted))] text-center">
            By signing in you agree to the SAAC accreditation scope and ISO 17025 audit policy.
          </p>
        </form>
      </div>
    </div>
  );
}
