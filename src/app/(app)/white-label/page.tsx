import { PageHeader } from "@/components/ui/page-header";
import { BrandingEditor } from "./_components/branding-editor";
import { SaveButton } from "./_components/save-button";

export default function WhiteLabelPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="White-label & report template"
        description="Customize branding, colors, headers and disclaimers per tenant."
        actions={<SaveButton />}
      />
      <BrandingEditor />
    </div>
  );
}
