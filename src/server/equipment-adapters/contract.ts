/**
 * Equipment integration adapter contract (spec §8).
 *
 * Every supported testing machine has an adapter implementing this contract.
 * The shape is identical regardless of whether the source is a REST API
 * (Forney Vault, Controls Group Automax, Instron Bluehill), a serial-port
 * gateway (Modbus/RS-232 + ASCII), or a file import (CSV/Excel/XML).
 *
 * When the real Fastify backend lands, the adapter implementations here move
 * server-side; the contract and the `EquipmentReading` payload stay
 * unchanged so the frontend only needs to swap import paths.
 */

export type EquipmentVendor =
  | "forney"
  | "controls"
  | "instron"
  | "mts"
  | "toni"
  | "zwick"
  | "ele"
  | "hach"
  | "lovibond"
  | "csv-generic"
  | "xml-generic";

export type CalibrationStatus = "valid" | "warning" | "expired";

export interface EquipmentReading {
  /** Adapter-supplied unique id for this reading (auto-generated when missing). */
  id?: string;
  equipmentId: string;       // CiviXLab equipment record id
  equipmentCode: string;     // EQ-CMP-01 …
  vendor: EquipmentVendor;
  model: string;
  serialNumber: string;
  capturedAt: string;        // ISO datetime
  operator?: string;
  testType?: string;         // e.g. "compressive_strength"
  /** Streamed sensor samples — `[{ t: seconds, value, unit }]`. */
  samples: { t: number; value: number; unit: string; parameter?: string }[];
  /** Adapter-derived final result for the test (peak load, modulus, etc.). */
  finalResult?: { value: number; unit: string; label: string };
  /** Environmental snapshot at the time of capture. */
  environmental?: { temperatureC?: number; humidityPercent?: number };
  /** Calibration verdict at capture time. */
  calibrationStatus: CalibrationStatus;
  /** Source raw data (URL or inline CSV) for audit. */
  rawDataRef?: string;
  /** Human-readable note. */
  note?: string;
}

/** Adapter-specific connection settings persisted on the equipment record. */
export interface AdapterConfig {
  vendor: EquipmentVendor;
  endpoint?: string;            // REST base URL or serial-gateway URL
  apiKey?: string;
  pollIntervalSeconds?: number;
  authMode?: "api-key" | "oauth2" | "none";
}

export interface PollResult {
  readings: EquipmentReading[];
  /** Number of skipped (already-seen) readings. Adapters de-dupe by id. */
  skipped: number;
}

export interface EquipmentAdapter {
  vendor: EquipmentVendor;
  /** Vendor-readable label for UI selectors. */
  displayName: string;
  /** True if the adapter requires a network endpoint (vs file import). */
  requiresEndpoint: boolean;
  /** Pull readings produced since `since` (ISO timestamp). */
  poll: (cfg: AdapterConfig, since: string | null, ctx: AdapterContext) => Promise<PollResult>;
  /** Optional file-import path. */
  importFile?: (file: File, ctx: AdapterContext) => Promise<EquipmentReading[]>;
}

/** Resolution context that adapters use to map vendor-side keys to records. */
export interface AdapterContext {
  equipmentId: string;
  equipmentCode: string;
  vendor: EquipmentVendor;
  model: string;
  serialNumber: string;
  /** Calibration due date for the connected machine (ISO). */
  calibrationDue: string;
}
