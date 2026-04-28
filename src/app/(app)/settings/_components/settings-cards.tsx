"use client";

import { useApp } from "@/store/app-store";
import { Building2, Globe, Palette, Shield, Database } from "lucide-react";
import { useT } from "@/lib/i18n";

export function SettingsCards() {
  const { lang, theme, setLang, setTheme, user } = useApp();
  const tt = useT();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card icon={<Building2 className="w-4 h-4" />} title={tt("Tenant")}>
        <Row label={tt("Laboratory")} value={user?.tenant ?? "—"} />
        <Row label={tt("CR number")} value="1010-XXXXXX" />
        <Row label={tt("VAT number")} value="3001-XXXXX-XXX" />
        <Row label={tt("Subscription")} value={tt("Enterprise (1,000 tests/month)")} />
      </Card>

      <Card icon={<Palette className="w-4 h-4" />} title={tt("Appearance")}>
        <Row
          label={tt("Theme")}
          value={
            <select className="input w-auto" value={theme} onChange={(e) => setTheme(e.target.value as never)}>
              <option value="light">{tt("Light")}</option>
              <option value="dark">{tt("Dark")}</option>
            </select>
          }
        />
        <Row
          label={tt("Language")}
          value={
            <select className="input w-auto" value={lang} onChange={(e) => setLang(e.target.value as never)}>
              <option value="en">English (LTR)</option>
              <option value="ar">العربية (RTL)</option>
            </select>
          }
        />
      </Card>

      <Card icon={<Globe className="w-4 h-4" />} title={tt("Standards & compliance")}>
        <Row label={tt("Building code")} value="SBC 304:2018" />
        <Row label={tt("Cement")} value="SASO SSA 1" />
        <Row label={tt("Steel")} value="SASO SSA 2-2024" />
        <Row label={tt("Water")} value="SASO 1494 / GSO 1914" />
        <Row label="Aramco" value="09-SAMSS-088 / SAES-Q-006" />
      </Card>

      <Card icon={<Shield className="w-4 h-4" />} title={tt("Security")}>
        <Row label={tt("MFA")} value={<span className="badge badge-pass">{tt("Enabled (TOTP)")}</span>} />
        <Row label={tt("Session timeout")} value={tt("30 minutes")} />
        <Row label={tt("Audit log retention")} value={tt("ISO 17025: 7 years")} />
        <Row label={tt("SAML SSO")} value={<span className="badge badge-info">{tt("Available")}</span>} />
      </Card>

      <Card icon={<Database className="w-4 h-4" />} title={tt("Data & integrations")}>
        <Row label={tt("Equipment integrations")} value="Forney • Controls • Instron • HACH" />
        <Row label={tt("ZATCA e-invoicing")} value={<span className="badge badge-pass">{tt("Phase 2 ready")}</span>} />
        <Row label={tt("Etimad")} value={<span className="badge badge-info">{tt("Configured")}</span>} />
        <Row label={tt("Data residency")} value="AWS me-south-1 (Bahrain)" />
      </Card>
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
