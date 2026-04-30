/**
 * Forney Vault adapter — concrete compression machines (F-505, VFD).
 *
 * Real REST endpoint: GET {endpoint}/api/v2/tests?since=ISO
 *   Authorization: Bearer <api-key>
 *
 * Response shape (Forney Vault firmware ≥ 4.2):
 * {
 *   tests: [{
 *     id, started_at, operator, specimen_id,
 *     readings: [{ t_ms, load_kn }],
 *     peak_load_kn, loading_rate_mpa_s, calibration_status
 *   }]
 * }
 *
 * For the demo build the adapter generates a deterministic stress-strain
 * curve from the equipment serial, so every poll returns the same record
 * until you "reset" the equipment.
 */

import type {
  AdapterConfig, AdapterContext, EquipmentAdapter, EquipmentReading, PollResult,
} from "./contract";

function seededRandom(seed: string): () => number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822519); h = Math.imul(h ^ (h >>> 13), 3266489917); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
}

function calibrationVerdict(dueIso: string) {
  const days = Math.round((new Date(dueIso).getTime() - Date.now()) / 86400000);
  if (days < 0) return "expired" as const;
  if (days < 30) return "warning" as const;
  return "valid" as const;
}

export const forneyAdapter: EquipmentAdapter = {
  vendor: "forney",
  displayName: "Forney Vault",
  requiresEndpoint: true,
  async poll(_cfg: AdapterConfig, _since: string | null, ctx: AdapterContext): Promise<PollResult> {
    // Simulated capture: 150-mm cube to peak ~870 kN at 0.25 MPa/s.
    const rng = seededRandom(`forney|${ctx.serialNumber}|${Date.now() >> 17}`);
    const peakKn = 850 + rng() * 60;          // 850-910 kN
    const loadingRate = 0.22 + rng() * 0.08;  // 0.22-0.30 MPa/s
    // Standard run produces ~70 s to peak; sample every 0.5 s.
    const totalT = peakKn / 1000 / loadingRate / (150 * 150 / 1e6); // crude, kN/s → time
    const dt = 0.5;
    const samples: EquipmentReading["samples"] = [];
    for (let t = 0; t <= totalT; t += dt) {
      const frac = t / totalT;
      const value = peakKn * (frac < 1 ? frac ** 1.05 : 1) + (rng() - 0.5) * 4;
      samples.push({ t, value: +value.toFixed(2), unit: "kN", parameter: "load" });
    }
    const reading: EquipmentReading = {
      equipmentId: ctx.equipmentId,
      equipmentCode: ctx.equipmentCode,
      vendor: "forney",
      model: ctx.model,
      serialNumber: ctx.serialNumber,
      capturedAt: new Date().toISOString(),
      operator: "Forney Vault auto-capture",
      testType: "compressive_strength",
      samples,
      finalResult: { value: +peakKn.toFixed(2), unit: "kN", label: "Peak load" },
      environmental: { temperatureC: 23, humidityPercent: 55 },
      calibrationStatus: calibrationVerdict(ctx.calibrationDue),
      rawDataRef: `forney://vault/test/${ctx.serialNumber}/${samples.length}`,
      note: `Forney VFD continuous load capture · loading rate ${loadingRate.toFixed(2)} MPa/s`,
    };
    return { readings: [reading], skipped: 0 };
  },
};
