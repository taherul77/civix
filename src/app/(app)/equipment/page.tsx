import { PageHeader } from "@/components/ui/page-header";
import { EquipmentStats } from "./_components/equipment-stats";
import { EquipmentTable } from "./_components/equipment-table";
import { NewEquipmentButton } from "./_components/new-equipment-button";

export default function EquipmentPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipment"
        description="Equipment register, calibration tracking, and integration endpoints."
        actions={<NewEquipmentButton />}
      />
      <EquipmentStats />
      <EquipmentTable />
    </div>
  );
}
