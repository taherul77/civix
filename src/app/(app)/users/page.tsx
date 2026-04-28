import { PageHeader } from "@/components/ui/page-header";
import { UsersTable } from "./_components/users-table";
import { NewUserButton } from "./_components/new-user-button";

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Users & roles"
        description="11 RBAC roles with ISO 17025 audit trail."
        actions={<NewUserButton />}
      />
      <UsersTable />
    </div>
  );
}
