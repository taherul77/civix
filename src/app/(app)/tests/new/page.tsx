import { PageHeader } from "@/components/ui/page-header";
import { TestCatalogBrowser } from "./_components/test-catalog-browser";

export default function NewTestPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="New test"
        description="Choose from the curated catalog of 75 tests for the Middle East."
      />
      <TestCatalogBrowser />
    </div>
  );
}
