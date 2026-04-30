/**
 * File-import adapter for legacy testing equipment that can only export
 * CSV/XML. Accepts:
 *
 *   1. CSV:  `t,load_kn` (headers required) — used by older Instron Series IX
 *      and many in-house spreadsheets.
 *   2. XML:  `<TestRun><Sample t="..." load="..."/></TestRun>` — used by some
 *      Toni Technik exports.
 *
 * Both produce one `EquipmentReading` per file. The peak-load is the
 * maximum value seen; the rest is mapped 1:1 to `samples[]`.
 */

import type {
  AdapterContext, EquipmentAdapter, EquipmentReading,
} from "./contract";

function cal(dueIso: string) {
  const d = (new Date(dueIso).getTime() - Date.now()) / 86400000;
  return d < 0 ? "expired" as const : d < 30 ? "warning" as const : "valid" as const;
}

function parseCsv(text: string): { t: number; value: number }[] {
  const rows = text.split(/\r?\n/).filter((r) => r.trim().length > 0);
  if (rows.length < 2) return [];
  const header = rows[0].toLowerCase().split(",").map((s) => s.trim());
  const tIdx = header.findIndex((h) => /^(t|time|seconds|s)$/.test(h));
  const vIdx = header.findIndex((h) => /load|kn|stress|force/.test(h));
  if (tIdx < 0 || vIdx < 0) return [];
  return rows.slice(1).map((row) => {
    const cols = row.split(",");
    return { t: Number(cols[tIdx]), value: Number(cols[vIdx]) };
  }).filter((p) => Number.isFinite(p.t) && Number.isFinite(p.value));
}

function parseXml(text: string): { t: number; value: number }[] {
  if (typeof window === "undefined") return [];
  const doc = new DOMParser().parseFromString(text, "application/xml");
  if (doc.querySelector("parsererror")) return [];
  const nodes = Array.from(doc.querySelectorAll("Sample, sample"));
  return nodes.map((n) => ({
    t: Number(n.getAttribute("t") ?? n.getAttribute("time") ?? 0),
    value: Number(n.getAttribute("load") ?? n.getAttribute("value") ?? 0),
  })).filter((p) => Number.isFinite(p.t) && Number.isFinite(p.value));
}

export const csvAdapter: EquipmentAdapter = {
  vendor: "csv-generic",
  displayName: "CSV import (generic)",
  requiresEndpoint: false,
  async poll() { return { readings: [], skipped: 0 }; },
  async importFile(file: File, ctx: AdapterContext): Promise<EquipmentReading[]> {
    const text = await file.text();
    const samples = parseCsv(text).map((s) => ({ t: s.t, value: s.value, unit: "kN", parameter: "load" }));
    if (samples.length === 0) throw new Error("No valid rows found in CSV (expected columns t, load_kn).");
    const peak = samples.reduce((a, s) => Math.max(a, s.value), 0);
    return [{
      equipmentId: ctx.equipmentId,
      equipmentCode: ctx.equipmentCode,
      vendor: "csv-generic",
      model: ctx.model,
      serialNumber: ctx.serialNumber,
      capturedAt: new Date().toISOString(),
      testType: "imported",
      samples,
      finalResult: { value: +peak.toFixed(2), unit: "kN", label: "Peak load (CSV)" },
      calibrationStatus: cal(ctx.calibrationDue),
      rawDataRef: `csv://${file.name}`,
      note: `Imported ${samples.length} rows from ${file.name}`,
    }];
  },
};

export const xmlAdapter: EquipmentAdapter = {
  vendor: "xml-generic",
  displayName: "XML import (Toni Technik etc.)",
  requiresEndpoint: false,
  async poll() { return { readings: [], skipped: 0 }; },
  async importFile(file: File, ctx: AdapterContext): Promise<EquipmentReading[]> {
    const text = await file.text();
    const samples = parseXml(text).map((s) => ({ t: s.t, value: s.value, unit: "kN", parameter: "load" }));
    if (samples.length === 0) throw new Error("No <Sample> nodes found in XML.");
    const peak = samples.reduce((a, s) => Math.max(a, s.value), 0);
    return [{
      equipmentId: ctx.equipmentId,
      equipmentCode: ctx.equipmentCode,
      vendor: "xml-generic",
      model: ctx.model,
      serialNumber: ctx.serialNumber,
      capturedAt: new Date().toISOString(),
      testType: "imported",
      samples,
      finalResult: { value: +peak.toFixed(2), unit: "kN", label: "Peak load (XML)" },
      calibrationStatus: cal(ctx.calibrationDue),
      rawDataRef: `xml://${file.name}`,
      note: `Imported ${samples.length} samples from ${file.name}`,
    }];
  },
};
