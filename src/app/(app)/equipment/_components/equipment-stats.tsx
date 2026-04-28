"use client";

import { Wrench, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useData } from "@/store/data-store";
import { useT } from "@/lib/i18n";

function daysUntil(date: string) {
  return Math.round((new Date(date).getTime() - Date.now()) / 86400000);
}

export function EquipmentStats() {
  const tt = useT();
  const equipment = useData((s) => s.equipment);
  const overdueOrSoon = equipment.filter((e) => daysUntil(e.calibrationDue) < 30).length;
  const active = equipment.filter((e) => e.status === "active").length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Stat icon={Wrench} label={tt("Total equipment")} value={equipment.length} tone="brand" />
      <Stat icon={CheckCircle2} label={tt("Active & calibrated")} value={active} tone="emerald" />
      <Stat icon={AlertTriangle} label={tt("Calibration due ≤ 30d")} value={overdueOrSoon} tone="amber" />
    </div>
  );
}

function Stat({
  icon: Icon, label, value, tone,
}: {
  icon: typeof Wrench; label: string; value: number; tone: "brand" | "emerald" | "amber";
}) {
  const tones = {
    brand: "bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300",
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  };
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl grid place-items-center ${tones[tone]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-xs uppercase tracking-wider text-[rgb(var(--muted))] font-medium">{label}</div>
        <div className="text-2xl font-semibold mt-0.5">{value}</div>
      </div>
    </div>
  );
}
