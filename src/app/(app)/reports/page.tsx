import { PageHeader } from "@/components/ui/page-header";
import { ReportsGrid } from "./_components/reports-grid";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Generated reports with digital signatures and verification QR codes."
      />
      <ReportsGrid />
    </div>
  );
}
