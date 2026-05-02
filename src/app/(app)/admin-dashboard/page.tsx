import { PageHeader } from "@/components/ui/page-header";
import { AdminKpiRow } from "./_components/admin-kpi-row";
import { UsersByRoleCard, EquipmentFleetCard } from "./_components/charts";
import { RecentAuditCard } from "./_components/recent-audit-card";
import { BillingSnapshotCard } from "./_components/billing-snapshot-card";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin dashboard"
        description="Tenant-wide overview of users, equipment, audit activity, and billing."
      />

      <AdminKpiRow />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <UsersByRoleCard />
        <EquipmentFleetCard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BillingSnapshotCard />
        <RecentAuditCard />
      </div>
    </div>
  );
}
