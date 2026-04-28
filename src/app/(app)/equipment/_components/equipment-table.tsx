"use client";

import { StatusBadge } from "@/components/ui/status-badge";
import { useEquipmentQuery } from "@/server/queries";
import { useT } from "@/lib/i18n";
import { useLoc } from "@/lib/i18n-data";
import { useApp } from "@/store/app-store";
import { fmtAny } from "@/lib/utils";

function daysUntil(date: string) {
  return Math.round((new Date(date).getTime() - Date.now()) / 86400000);
}

export function EquipmentTable() {
  const tt = useT();
  const loc = useLoc();
  const lang = useApp((s) => s.lang);
  const { data: equipment = [] } = useEquipmentQuery();

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="civix">
          <thead>
            <tr>
              <th>{tt("Code")}</th>
              <th>{tt("Name")}</th>
              <th>{tt("Manufacturer")}</th>
              <th>{tt("Model")}</th>
              <th>{tt("Serial")}</th>
              <th>{tt("Cal. due")}</th>
              <th>{tt("Status")}</th>
            </tr>
          </thead>
          <tbody>
            {equipment.map((e) => {
              const days = daysUntil(e.calibrationDue);
              const tone = days < 0 ? "text-rose-600 font-medium" : days < 30 ? "text-amber-600 font-medium" : "";
              return (
                <tr key={e.id}>
                  <td className="font-mono text-xs">{fmtAny(e.code, lang)}</td>
                  <td className="font-medium">{loc(e.name)}</td>
                  <td>{e.manufacturer}</td>
                  <td>{e.model}</td>
                  <td className="font-mono text-xs">{fmtAny(e.serial, lang)}</td>
                  <td className={tone}>
                    {fmtAny(e.calibrationDue, lang)}
                    <div className="text-xs">
                      {days < 0
                        ? `${fmtAny(Math.abs(days), lang)} ${tt("d overdue")}`
                        : `${fmtAny(days, lang)} ${tt("d remaining")}`}
                    </div>
                  </td>
                  <td><StatusBadge value={e.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
