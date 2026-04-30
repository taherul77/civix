"use client";

import { useData } from "@/store/data-store";
import { ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";

export function ReadingsTable({ equipmentId }: { equipmentId: string }) {
  const readings = useData((s) => s.equipmentReadings.filter((r) => r.equipmentId === equipmentId));

  if (readings.length === 0) {
    return (
      <div className="card p-8 text-center text-sm text-[rgb(var(--muted))]">
        No readings yet. Poll the integration or import a file to capture one.
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <h3 className="font-semibold p-4 border-b border-[rgb(var(--border))]">Recent readings</h3>
      <div className="overflow-x-auto">
        <table className="civix">
          <thead>
            <tr>
              <th>Captured</th>
              <th>Vendor</th>
              <th>Test type</th>
              <th>Samples</th>
              <th>Final result</th>
              <th>Calibration</th>
              <th>Note</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {readings.map((r) => {
              const Icon = r.calibrationStatus === "valid" ? ShieldCheck
                         : r.calibrationStatus === "warning" ? ShieldAlert : ShieldX;
              const tone = r.calibrationStatus === "valid" ? "text-emerald-600"
                         : r.calibrationStatus === "warning" ? "text-amber-600" : "text-rose-600";
              return (
                <tr key={r.id} className={r.consumed ? "opacity-60" : ""}>
                  <td className="font-mono text-xs">{r.capturedAt.replace("T", " ").slice(0, 19)}</td>
                  <td className="capitalize">{r.vendor}</td>
                  <td className="text-xs">{r.testType ?? "—"}</td>
                  <td className="text-xs">{r.samples.length}</td>
                  <td className="font-medium">
                    {r.finalResult
                      ? `${r.finalResult.value.toLocaleString()} ${r.finalResult.unit} (${r.finalResult.label})`
                      : "—"}
                  </td>
                  <td>
                    <span className={`inline-flex items-center gap-1 text-xs ${tone}`}>
                      <Icon className="w-3.5 h-3.5" /> {r.calibrationStatus}
                    </span>
                  </td>
                  <td className="text-xs text-[rgb(var(--muted))]">{r.note ?? "—"}</td>
                  <td className="text-xs">
                    {r.consumed
                      ? <span className="badge badge-muted">consumed</span>
                      : <span className="badge badge-info">available</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
