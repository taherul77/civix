import { PageHeader } from "@/components/ui/page-header";
import { CompanyForm } from "./_components/company-form";

export default function CompanyPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Company setup"
        description="Edit your laboratory's profile, billing identity, and subscription details."
      />
      <CompanyForm />
    </div>
  );
}
