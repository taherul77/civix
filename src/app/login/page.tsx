import { FlaskConical } from "lucide-react";
import { LoginForm } from "./_components/login-form";

export default function LoginPage() {
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
        <LoginForm />
      </div>
    </div>
  );
}
