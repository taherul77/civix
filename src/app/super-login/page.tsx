import Link from "next/link";
import { Crown, ArrowLeft } from "lucide-react";
import { SuperLoginForm } from "./_components/super-login-form";

export default function SuperLoginPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[rgb(var(--bg))]">
      {/* Left panel — distinct dark/violet treatment so it never gets confused
          with the regular tenant login. */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-violet-700 via-violet-900 to-slate-950 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 grid place-items-center backdrop-blur">
            <Crown className="w-5 h-5" />
          </div>
          <div className="text-2xl font-semibold tracking-tight">CiviXLab · Super Admin</div>
        </div>

        <div className="space-y-6 max-w-lg">
          <h1 className="text-4xl font-semibold leading-tight">
            Platform control for the operator team.
          </h1>
          <p className="text-violet-100/90 text-lg">
            Sign in to provision new companies, assign their first Tenant Admin,
            and inspect cross-tenant health. This area is restricted to platform
            super-admins.
          </p>
          <ul className="space-y-2 text-sm text-violet-100/80">
            <li>• Create &amp; offboard tenants</li>
            <li>• Mint the first Tenant Admin per company</li>
            <li>• Cross-tenant subscription &amp; usage view</li>
            <li>• Bypasses per-tenant page permissions</li>
          </ul>
        </div>

        <div className="text-xs text-violet-200/70">
          © {new Date().getFullYear()} CiviXLab • Operator console
        </div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12 relative">
        <Link
          href="/login"
          className="absolute top-4 left-4 text-xs text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3 h-3" /> Tenant sign-in
        </Link>
        <SuperLoginForm />
      </div>
    </div>
  );
}
