import { PageHeader } from "@/components/ui/page-header";
import { SamplesExplorer } from "./_components/samples-explorer";
import { NewSampleButton } from "./_components/new-sample-button";

export default function SamplesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Samples"
        description="All samples received with chain-of-custody tracking."
        actions={<NewSampleButton />}
      />
      <SamplesExplorer />
    </div>
  );
}
