import { PageHeader } from "@/components/ui/page-header";
import { MfaEnrolment } from "./_components/mfa-enrolment";
import { SsoProvidersCard } from "./_components/sso-providers-card";
import { PoliciesCard } from "./_components/policies-card";

export default function SecurityPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Security" description="MFA enrolment, SSO providers, and access policies." />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <MfaEnrolment />
        <SsoProvidersCard />
        <PoliciesCard />
      </div>
    </div>
  );
}
