"use client";

import { useApp } from "@/store/app-store";
import { PageHeader } from "@/components/ui/page-header";
import { Building2, Globe, Palette, Shield, Database } from "lucide-react";

export default function SettingsPage() {
  const { lang, theme, setLang, setTheme, user } = useApp();

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Tenant, preferences, security and integrations." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card icon={<Building2 className="w-4 h-4" />} title="Tenant">
          <Row label="Laboratory" value={user?.tenant ?? "—"} />
          <Row label="CR number" value="1010-XXXXXX" />
          <Row label="VAT number" value="3001-XXXXX-XXX" />
          <Row label="Subscription" value="Enterprise (1,000 tests/month)" />
        </Card>

        <Card icon={<Palette className="w-4 h-4" />} title="Appearance">
          <Row
            label="Theme"
            value={
              <select className="input w-auto" value={theme} onChange={(e) => setTheme(e.target.value as never)}>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            }
          />
          <Row
            label="Language"
            value={
              <select className="input w-auto" value={lang} onChange={(e) => setLang(e.target.value as never)}>
                <option value="en">English (LTR)</option>
                <option value="ar">العربية (RTL)</option>
              </select>
            }
          />
        </Card>

        <Card icon={<Globe className="w-4 h-4" />} title="Standards & compliance">
          <Row label="Building code" value="SBC 304:2018" />
          <Row label="Cement" value="SASO SSA 1" />
          <Row label="Steel" value="SASO SSA 2-2024" />
          <Row label="Water" value="SASO 1494 / GSO 1914" />
          <Row label="Aramco" value="09-SAMSS-088 / SAES-Q-006" />
        </Card>

        <Card icon={<Shield className="w-4 h-4" />} title="Security">
          <Row label="MFA" value={<span className="badge badge-pass">Enabled (TOTP)</span>} />
          <Row label="Session timeout" value="30 minutes" />
          <Row label="Audit log retention" value="ISO 17025: 7 years" />
          <Row label="SAML SSO" value={<span className="badge badge-info">Available</span>} />
        </Card>

        <Card icon={<Database className="w-4 h-4" />} title="Data & integrations">
          <Row label="Equipment integrations" value="Forney • Controls • Instron • HACH" />
          <Row label="ZATCA e-invoicing" value={<span className="badge badge-pass">Phase 2 ready</span>} />
          <Row label="Etimad" value={<span className="badge badge-info">Configured</span>} />
          <Row label="Data residency" value="AWS me-south-1 (Bahrain)" />
        </Card>
      </div>
    </div>
  );
}

function Card({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <h3 className="font-semibold mb-4 inline-flex items-center gap-2">{icon} {title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-[rgb(var(--muted))]">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
