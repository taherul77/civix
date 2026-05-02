"use client";

import { Users, ShieldCheck, Wrench, Activity } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { useUsersQuery, useEquipmentQuery, useAuditQuery } from "@/server/queries";
import { useT } from "@/lib/i18n";

export function AdminKpiRow() {
  const tt = useT();
  const { data: users = [] }     = useUsersQuery();
  const { data: equipment = [] } = useEquipmentQuery();
  const { data: audit = [] }     = useAuditQuery();

  const activeUsers = users.filter((u) => u.status === "active").length;
  const mfaEnrolled = users.filter((u) => u.mfa).length;
  const mfaPct = users.length ? Math.round((mfaEnrolled / users.length) * 100) : 0;

  const eqActive   = equipment.filter((e) => e.status === "active").length;
  const eqDue      = equipment.filter((e) => e.status === "calibration_due").length;
  const eqOut      = equipment.filter((e) => e.status === "out_of_service").length;
  const fleetHealth = equipment.length ? Math.round((eqActive / equipment.length) * 100) : 0;

  const today = new Date().toISOString().slice(0, 10);
  const eventsToday = audit.filter((a) => a.ts.startsWith(today)).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard
        label={tt("Active users")}
        value={activeUsers}
        delta={{ value: tt(`${users.length} total`), trend: "flat" }}
        icon={Users}
        tone="brand"
      />
      <KpiCard
        label={tt("MFA enrolment")}
        value={`${mfaPct}%`}
        delta={{
          value: tt(`${mfaEnrolled}/${users.length}`),
          trend: mfaPct >= 80 ? "up" : mfaPct >= 50 ? "flat" : "down",
        }}
        icon={ShieldCheck}
        tone="emerald"
      />
      <KpiCard
        label={tt("Equipment fleet health")}
        value={`${fleetHealth}%`}
        delta={{
          value: tt(`${eqDue} due · ${eqOut} OOS`),
          trend: eqOut === 0 && eqDue === 0 ? "up" : eqOut > 0 ? "down" : "flat",
        }}
        icon={Wrench}
        tone="ocean"
      />
      <KpiCard
        label={tt("Audit events today")}
        value={eventsToday}
        delta={{ value: tt(`${audit.length} all-time`), trend: "flat" }}
        icon={Activity}
        tone="sunset"
      />
    </div>
  );
}
