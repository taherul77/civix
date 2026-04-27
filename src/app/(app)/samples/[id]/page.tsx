"use client";

import Link from "next/link";
import { use } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Calendar, User, Beaker, FileSignature } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { sampleById, projectById, tests } from "@/lib/mock-data";

interface CocStep { ts: string; user: string; action: string; notes?: string; signature?: boolean }

const cocSteps: CocStep[] = [
  { ts: "2026-04-26 09:32", user: "T. Ahmed (Field)",   action: "Sample collected on site", signature: true,
    notes: "Pile cap PC-14, 3 cubes. Collected per ASTM C172. GPS: 28.0001N 35.4022E" },
  { ts: "2026-04-26 11:08", user: "T. Ahmed (Field)",   action: "Transported to lab in cooler box", notes: "Sealed bag SB-441" },
  { ts: "2026-04-26 12:14", user: "Y. Saad (Receiver)", action: "Sample received at lab",   signature: true,
    notes: "Visual check OK · weight 22.6 kg · seal SB-441 intact" },
  { ts: "2026-04-26 14:00", user: "Eng. Fahad",          action: "Stored in moist-curing tank T-3", notes: "23 ± 2 °C · RH 96%" },
  { ts: "2026-04-27 09:00", user: "Eng. Fahad",          action: "Tested (compressive strength @ 28d)", signature: true },
];

export default function SampleDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const sample = sampleById(id);
  if (!sample) notFound();
  const project = projectById(sample.projectId);
  const sampleTests = tests.filter((t) => t.sampleId === sample.id);

  return (
    <div className="space-y-6">
      <Link href="/samples" className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to samples
      </Link>

      <PageHeader
        title={`Sample ${sample.code}`}
        description={`${sample.type.toUpperCase()} · ${project?.name}`}
        actions={<StatusBadge value={sample.status} />}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Info icon={Beaker} label="Type" value={sample.type} />
        <Info icon={MapPin} label="Location" value={sample.location} />
        <Info icon={User} label="Sampled by" value={sample.sampledBy} />
        <Info icon={Calendar} label="Sample date" value={sample.date} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><FileSignature className="w-4 h-4" /> Chain of custody</h3>
          <ol className="relative border-l-2 border-[rgb(var(--border))] ml-3 space-y-6">
            {cocSteps.map((s, i) => (
              <li key={i} className="ml-6">
                <div className="absolute -left-[9px] w-4 h-4 rounded-full bg-brand-600 ring-4 ring-[rgb(var(--card))]" />
                <div className="flex items-baseline justify-between">
                  <div className="font-medium">{s.action}</div>
                  <div className="text-xs text-[rgb(var(--muted))] font-mono">{s.ts}</div>
                </div>
                <div className="text-sm text-[rgb(var(--muted))]">by {s.user}</div>
                {s.notes && <div className="text-sm mt-1">{s.notes}</div>}
                {s.signature && (
                  <div className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-600">
                    <FileSignature className="w-3.5 h-3.5" /> Digitally signed
                  </div>
                )}
              </li>
            ))}
          </ol>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold mb-3">Tests on this sample ({sampleTests.length})</h3>
          {sampleTests.length === 0 ? (
            <p className="text-sm text-[rgb(var(--muted))]">No tests yet.</p>
          ) : (
            <ul className="space-y-2">
              {sampleTests.map((t) => (
                <li key={t.id} className="border border-[rgb(var(--border))] rounded-lg p-3 hover:bg-[rgb(var(--border))]/30">
                  <Link href={`/tests/${t.id}`} className="block">
                    <div className="text-xs font-mono text-[rgb(var(--muted))]">{t.code}</div>
                    <div className="font-medium leading-tight">{t.name}</div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-xs">{t.primaryResult ? `${t.primaryResult.value} ${t.primaryResult.unit}` : "—"}</div>
                      <StatusBadge value={t.passFail} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof Beaker; label: string; value: string }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[rgb(var(--muted))] mb-1">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <div className="font-medium capitalize">{value}</div>
    </div>
  );
}
