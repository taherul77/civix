import { PageHeader } from "@/components/ui/page-header";
import { SettingsCards } from "./_components/settings-cards";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Tenant, preferences, security and integrations." />
      <SettingsCards />
    </div>
  );
}
