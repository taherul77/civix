import { PageHeader } from "@/components/ui/page-header";
import { DepartmentsTable } from "./_components/departments-table";
import { NewDepartmentButton } from "./_components/new-department-button";

export default function DepartmentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Department setup"
        description="Manage departments for this tenant — used to scope users, samples, and tests."
        actions={<NewDepartmentButton />}
      />
      <DepartmentsTable />
    </div>
  );
}
