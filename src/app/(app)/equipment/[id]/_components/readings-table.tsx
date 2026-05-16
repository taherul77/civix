"use client";

import { useData, type EquipmentReadingRecord } from "@/store/data-store";
import { ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";

export function ReadingsTable({ equipmentId }: { equipmentId: string }) {
  const readings = useData((s) => s.equipmentReadings.filter((r) => r.equipmentId === equipmentId));

  const columns: ColumnDef<EquipmentReadingRecord>[] = [
    {
      key: "capturedAt",
      header: "Captured",
      cell: (r) => <span className="font-mono text-xs">{r.capturedAt.replace("T", " ").slice(0, 19)}</span>,
      sort: (a, b) => a.capturedAt.localeCompare(b.capturedAt),
    },
    {
      key: "vendor",
      header: "Vendor",
      cell: (r) => <span className="capitalize">{r.vendor}</span>,
      sort: (a, b) => a.vendor.localeCompare(b.vendor),
    },
    {
      key: "testType",
      header: "Test type",
      cell: (r) => <span className="text-xs">{r.testType ?? "—"}</span>,
    },
    {
      key: "samples",
      header: "Samples",
      cell: (r) => <span className="text-xs">{r.samples.length}</span>,
      align: "right",
    },
    {
      key: "finalResult",
      header: "Final result",
      cell: (r) => (
        <span className="font-medium">
          {r.finalResult
            ? `${r.finalResult.value.toLocaleString()} ${r.finalResult.unit} (${r.finalResult.label})`
            : "—"}
        </span>
      ),
    },
    {
      key: "calibration",
      header: "Calibration",
      cell: (r) => {
        const Icon = r.calibrationStatus === "valid" ? ShieldCheck
                   : r.calibrationStatus === "warning" ? ShieldAlert : ShieldX;
        const tone = r.calibrationStatus === "valid" ? "text-emerald-600"
                   : r.calibrationStatus === "warning" ? "text-amber-600" : "text-rose-600";
        return (
          <span className={`inline-flex items-center gap-1 text-xs ${tone}`}>
            <Icon className="w-3.5 h-3.5" /> {r.calibrationStatus}
          </span>
        );
      },
      sort: (a, b) => a.calibrationStatus.localeCompare(b.calibrationStatus),
    },
    {
      key: "note",
      header: "Note",
      cell: (r) => <span className="text-xs text-[rgb(var(--muted))]">{r.note ?? "—"}</span>,
    },
    {
      key: "consumed",
      header: "",
      cell: (r) => r.consumed
        ? <span className="badge badge-muted">consumed</span>
        : <span className="badge badge-info">available</span>,
    },
  ];

  return (
    <DataTable
      rows={readings}
      columns={columns}
      getRowId={(r) => r.id}
      rowClassName={(r) => r.consumed ? "opacity-60" : undefined}
      empty="No readings yet. Poll the integration or import a file to capture one."
    />
  );
}
