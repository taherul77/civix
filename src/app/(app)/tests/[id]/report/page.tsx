import { ReportToolbar } from "./_components/report-toolbar";
import { ReportDocument } from "./_components/report-document";

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="space-y-4">
      <ReportToolbar testId={id} />
      {/* The report is a fixed paper layout: on phones it scrolls sideways instead of overflowing the page. */}
      <div className="overflow-x-auto print:overflow-visible">
        <ReportDocument id={id} />
      </div>
    </div>
  );
}
