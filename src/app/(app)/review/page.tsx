import { PageHeader } from "@/components/ui/page-header";
import { ReviewWorkbench } from "./_components/review-workbench";

export default function ReviewPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Review & approval"
        description="Quality Manager / Approver queue. Digital signatures lock the result."
      />
      <ReviewWorkbench />
    </div>
  );
}
