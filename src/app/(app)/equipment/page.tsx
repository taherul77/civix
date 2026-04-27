"use client";

import { Plus, Wrench, AlertTriangle, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { equipment } from "@/lib/mock-data";

function daysUntil(date: string) {
  const d = (new Date(date).getTime() - Date.now()) / 86400000;
  return Math.round(d);
}

export default function EquipmentPage() {
  const overdueOrSoon = equipment.filter((e) => daysUntil(e.calibrationDue) < 30).length;
  const active = equipment.filter((e) => e.status === "active").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipment"
        description="Equipment register, calibration tracking, and integration endpoints."
        actions={
          <button className="btn btn-primary">
            <Plus className="w-4 h-4" /> Register equipment
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat icon={Wrench} label="Total equipment" value={equipment.length} tone="brand" />
        <Stat icon={CheckCircle2} label="Active & calibrated" value={active} tone="emerald" />
        <Stat icon={AlertTriangle} label="Calibration due ≤ 30d" value={overdueOrSoon} tone="amber" />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="civix">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Manufacturer</th>
                <th>Model</th>
                <th>Serial</th>
                <th>Cal. due</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {equipment.map((e) => {
                const days = daysUntil(e.calibrationDue);
                const tone = days < 0 ? "text-rose-600 font-medium" : days < 30 ? "text-amber-600 font-medium" : "";
                return (
                  <tr key={e.id}>
                    <td className="font-mono text-xs">{e.code}</td>
                    <td className="font-medium">{e.name}</td>
                    <td>{e.manufacturer}</td>
                    <td>{e.model}</td>
                    <td className="font-mono text-xs">{e.serial}</td>
                    <td className={tone}>
                      {e.calibrationDue}
                      <div className="text-xs">
                        {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d remaining`}
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
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone }: { icon: typeof Wrench; label: string; value: number; tone: "brand" | "emerald" | "amber" }) {
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
