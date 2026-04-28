import { PageHeader } from "@/components/ui/page-header";
import { DashboardKpiRow } from "./_components/kpi-row";
import { MonthlyVolumeCard, CategoryCard, PassFailCard } from "./_components/charts-row";
import { ActiveProjectsCard } from "./_components/active-projects-card";
import { RecentTestsCard } from "./_components/recent-tests-card";
import { NewTestAction } from "./_components/new-test-action";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of laboratory activity, compliance, and equipment status."
        actions={<NewTestAction />}
      />

      <DashboardKpiRow />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <MonthlyVolumeCard />
        <CategoryCard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <PassFailCard />
        <ActiveProjectsCard />
      </div>

      <RecentTestsCard />
    </div>
  );
}
