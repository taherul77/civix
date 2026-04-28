import { PageHeader } from "@/components/ui/page-header";
import { FieldAppMock } from "./_components/field-app-mock";

export default function FieldPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Field sampling (mobile)"
        description="Field-tech preview — capture sample with GPS, barcode and photo. Works offline."
      />
      <FieldAppMock />
    </div>
  );
}
