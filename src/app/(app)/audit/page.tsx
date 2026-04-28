import { PageHeader } from "@/components/ui/page-header";
import { AuditLogExplorer } from "./_components/audit-log-explorer";
import { ExportCsvButton } from "./_components/export-csv-button";

export default function AuditPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit log"
        description="ISO 17025 §8.4 immutable audit trail. 7-year retention."
        actions={<ExportCsvButton />}
      />
      <AuditLogExplorer />
    </div>
  );
}
