import { PageHeader } from "@/components/ui/page-header";
import { TestsExplorer } from "./_components/tests-explorer";
import { NewTestActions } from "./_components/new-test-actions";

export default function TestsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Tests"
        description="All test runs across projects with full traceability."
        actions={<NewTestActions />}
      />
      <TestsExplorer />
    </div>
  );
}
