import { PageHeader } from "@/components/ui/page-header";
import { SampleMap } from "./_components/sample-map";

export default function MapPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Sample map" description="GPS-tagged sample collection locations across Saudi Arabia." />
      <SampleMap />
    </div>
  );
}
