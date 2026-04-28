import { PageHeader } from "@/components/ui/page-header";
import { CalendarGrid } from "./_components/calendar-grid";

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar"
        description="Upcoming tests, sampling visits and calibration due dates."
      />
      <CalendarGrid />
    </div>
  );
}
