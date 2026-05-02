"use client";

import { useMemo } from "react";
import { CategoryPie } from "@/components/dashboard/charts";
import { useUsersQuery, useEquipmentQuery } from "@/server/queries";
import { useT } from "@/lib/i18n";

export function UsersByRoleCard() {
  const tt = useT();
  const { data: users = [] } = useUsersQuery();
  const data = useMemo(() => {
    const counts = new Map<string, number>();
    for (const u of users) counts.set(u.role, (counts.get(u.role) ?? 0) + 1);
    return Array.from(counts, ([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [users]);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">{tt("Users by role")}</h3>
        <span className="text-xs text-[rgb(var(--muted))]">{tt(`${users.length} total`)}</span>
      </div>
      {data.length === 0 ? (
        <div className="h-[260px] grid place-items-center text-sm text-[rgb(var(--muted))]">
          {tt("No users yet")}
        </div>
      ) : (
        <CategoryPie data={data} />
      )}
    </div>
  );
}

export function EquipmentFleetCard() {
  const tt = useT();
  const { data: equipment = [] } = useEquipmentQuery();
  const data = useMemo(() => {
    const counts = { active: 0, calibration_due: 0, out_of_service: 0 };
    for (const e of equipment) counts[e.status]++;
    return [
      { name: "Active",          value: counts.active },
      { name: "Calibration due", value: counts.calibration_due },
      { name: "Out of service",  value: counts.out_of_service },
    ].filter((d) => d.value > 0);
  }, [equipment]);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">{tt("Equipment fleet")}</h3>
        <span className="text-xs text-[rgb(var(--muted))]">{tt(`${equipment.length} units`)}</span>
      </div>
      {data.length === 0 ? (
        <div className="h-[260px] grid place-items-center text-sm text-[rgb(var(--muted))]">
          {tt("No equipment registered")}
        </div>
      ) : (
        <CategoryPie data={data} />
      )}
    </div>
  );
}
