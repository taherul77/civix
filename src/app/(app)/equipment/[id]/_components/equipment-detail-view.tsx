"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Wrench, AlertTriangle, CheckCircle2, Calendar } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { useEquipmentQuery } from "@/server/queries";
import { useLoc } from "@/lib/i18n-data";
import { useT } from "@/lib/i18n";
import { useApp } from "@/store/app-store";
import { fmtAny } from "@/lib/utils";
import { IntegrationPanel } from "./integration-panel";
import { ReadingsTable } from "./readings-table";

export function EquipmentDetailView({ id }: { id: string }) {
  const tt = useT();
  const loc = useLoc();
  const lang = useApp((s) => s.lang);
  const { data: equipment = [] } = useEquipmentQuery();
  const eq = equipment.find((e) => e.id === id);

  if (!eq) notFound();

  const days = Math.round((new Date(eq.calibrationDue).getTime() - Date.now()) / 86400000);
  const calIcon = days < 0 ? AlertTriangle : days < 30 ? AlertTriangle : CheckCircle2;
  const calTone = days < 0 ? "text-rose-600" : days < 30 ? "text-amber-600" : "text-emerald-600";

  return (
    <div className="space-y-6">
      <Link href="/equipment" className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to equipment
      </Link>

      <PageHeader
        title={loc(eq.name)}
        description={`${fmtAny(eq.code, lang)} · ${eq.manufacturer} ${eq.model}`}
        actions={<StatusBadge value={eq.status} />}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Info icon={Wrench}   label={tt("Manufacturer")} value={`${eq.manufacturer} ${eq.model}`} />
        <Info icon={Wrench}   label={tt("Serial")}       value={fmtAny(eq.serial, lang)} mono />
        <Info icon={Calendar} label={tt("Cal. due")}     value={fmtAny(eq.calibrationDue, lang)} />
        <Info
          icon={calIcon}
          label="Calibration status"
          value={days < 0 ? `${Math.abs(days)} d overdue` : `${days} d remaining`}
          tone={calTone}
        />
      </div>

      <IntegrationPanel equipmentId={eq.id} />
      <ReadingsTable equipmentId={eq.id} />
    </div>
  );
}

function Info({
  icon: Icon, label, value, tone, mono,
}: {
  icon: typeof Wrench; label: string; value: string; tone?: string; mono?: boolean;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[rgb(var(--muted))] mb-1">
        <Icon className={`w-3.5 h-3.5 ${tone ?? ""}`} /> {label}
      </div>
      <div className={`font-medium ${mono ? "font-mono text-sm" : ""} ${tone ?? ""}`}>{value}</div>
    </div>
  );
}
