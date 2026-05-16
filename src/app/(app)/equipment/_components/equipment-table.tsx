"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { useEquipmentQuery } from "@/server/queries";
import { useT } from "@/lib/i18n";
import { useLoc } from "@/lib/i18n-data";
import { useApp } from "@/store/app-store";
import { useData } from "@/store/data-store";
import { fmtAny } from "@/lib/utils";
import { Plug, Unplug } from "lucide-react";
import type { EquipmentRecord } from "@/server/contracts";

function daysUntil(date: string) {
  return Math.round((new Date(date).getTime() - Date.now()) / 86400000);
}

export function EquipmentTable() {
  const tt = useT();
  const loc = useLoc();
  const lang = useApp((s) => s.lang);
  const { data: equipment = [], isLoading, error } = useEquipmentQuery();
  const connections = useData((s) => s.equipmentConnections);

  const columns: ColumnDef<EquipmentRecord>[] = [
    {
      key: "code",
      header: tt("Code"),
      cell: (e) => <span className="font-mono text-xs">{fmtAny(e.code, lang)}</span>,
      sort: (a, b) => String(a.code).localeCompare(String(b.code)),
    },
    {
      key: "name",
      header: tt("Name"),
      cell: (e) => (
        <Link href={`/equipment/${e.id}`} className="font-medium hover:text-brand-600 hover:underline">
          {loc(e.name)}
        </Link>
      ),
      sort: (a, b) => loc(a.name).localeCompare(loc(b.name)),
    },
    {
      key: "manufacturer",
      header: tt("Manufacturer"),
      cell: (e) => e.manufacturer,
      sort: (a, b) => (a.manufacturer ?? "").localeCompare(b.manufacturer ?? ""),
    },
    {
      key: "model",
      header: tt("Model"),
      cell: (e) => e.model,
      sort: (a, b) => (a.model ?? "").localeCompare(b.model ?? ""),
    },
    {
      key: "serial",
      header: tt("Serial"),
      cell: (e) => <span className="font-mono text-xs">{fmtAny(e.serial, lang)}</span>,
    },
    {
      key: "calibrationDue",
      header: tt("Cal. due"),
      cell: (e) => {
        const days = daysUntil(e.calibrationDue);
        const tone = days < 0 ? "text-rose-600 font-medium" : days < 30 ? "text-amber-600 font-medium" : "";
        return (
          <div className={tone}>
            {fmtAny(e.calibrationDue, lang)}
            <div className="text-xs">
              {days < 0
                ? `${fmtAny(Math.abs(days), lang)} ${tt("d overdue")}`
                : `${fmtAny(days, lang)} ${tt("d remaining")}`}
            </div>
          </div>
        );
      },
      sort: (a, b) => new Date(a.calibrationDue).getTime() - new Date(b.calibrationDue).getTime(),
    },
    {
      key: "integration",
      header: tt("Integration"),
      cell: (e) => {
        const conn = connections[e.id];
        return conn ? (
          <span className="badge badge-pass inline-flex items-center gap-1">
            <Plug className="w-3 h-3" /> {conn.vendor}
          </span>
        ) : (
          <span className="badge badge-muted inline-flex items-center gap-1">
            <Unplug className="w-3 h-3" /> none
          </span>
        );
      },
    },
    {
      key: "status",
      header: tt("Status"),
      cell: (e) => <StatusBadge value={e.status} />,
      sort: (a, b) => String(a.status).localeCompare(String(b.status)),
    },
  ];

  return (
    <DataTable
      rows={equipment}
      columns={columns}
      getRowId={(e) => e.id}
      loading={isLoading}
      error={error?.message ?? null}
      searchable
      searchPlaceholder={tt("Search equipment…")}
      searchFilter={(e, q) =>
        [String(e.code), loc(e.name), e.manufacturer ?? "", e.model ?? "", String(e.serial)]
          .join(" ").toLowerCase().includes(q)
      }
      empty={tt("No equipment")}
    />
  );
}
