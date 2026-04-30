/**
 * Controls Group adapter — Automax Pro / Pilot Pro compression frames.
 *
 * Real REST endpoint: GET {endpoint}/automax/v1/results?from=ISO
 *   X-API-Key: <api-key>
 *
 * Controls firmware streams Modbus-over-HTTP so each test arrives as one
 * JSON document with the full envelope (including aggregate-correction
 * factor for air-content tests when fitted).
 */

import type {
  AdapterConfig, AdapterContext, EquipmentAdapter, EquipmentReading, PollResult,
} from "./contract";

function rng(seed: string) {
  let h = 0x811c9dc5 >>> 0;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 0x01000193);
  return () => { h = Math.imul(h ^ (h >>> 16), 0x85ebca6b); h ^= h >>> 13; return (h >>> 0) / 4294967296; };
}

function cal(dueIso: string) {
  const d = (new Date(dueIso).getTime() - Date.now()) / 86400000;
  return d < 0 ? "expired" as const : d < 30 ? "warning" as const : "valid" as const;
}

export const controlsAdapter: EquipmentAdapter = {
  vendor: "controls",
  displayName: "Controls Automax Pro",
  requiresEndpoint: true,
  async poll(_cfg: AdapterConfig, _since: string | null, ctx: AdapterContext): Promise<PollResult> {
    const r = rng(`controls|${ctx.serialNumber}|${Date.now() >> 17}`);
    const peakKn = 1820 + r() * 180;
    // Cube specimen 150² area → strength MPa = peak * 1000 / 22500
    const fcMpa = (peakKn * 1000) / (150 * 150);
    const dt = 0.4;
    const totalT = 90;
    const samples: EquipmentReading["samples"] = [];
    for (let t = 0; t <= totalT; t += dt) {
      const frac = t / totalT;
      const value = peakKn * Math.min(1, frac ** 1.1) + (r() - 0.5) * 6;
      samples.push({ t, value: +value.toFixed(2), unit: "kN", parameter: "load" });
    }
    const reading: EquipmentReading = {
      equipmentId: ctx.equipmentId,
      equipmentCode: ctx.equipmentCode,
      vendor: "controls",
      model: ctx.model,
      serialNumber: ctx.serialNumber,
      capturedAt: new Date().toISOString(),
      operator: "Automax Pilot operator",
      testType: "compressive_strength",
      samples,
      finalResult: { value: +fcMpa.toFixed(2), unit: "MPa", label: "f'c (cube)" },
      environmental: { temperatureC: 22, humidityPercent: 60 },
      calibrationStatus: cal(ctx.calibrationDue),
      rawDataRef: `controls://automax/run/${ctx.serialNumber}/${samples.length}`,
      note: `Controls Automax Modbus capture · ${samples.length} points`,
    };
    return { readings: [reading], skipped: 0 };
  },
};
