/**
 * Equipment adapter registry — exposes a single dispatcher keyed by vendor.
 *
 * Pages call `getAdapter(vendor)` from `api.equipment.*`; they never import
 * adapter modules directly. This way swapping in real network calls when
 * the backend lands is a one-file change.
 */

import type { EquipmentAdapter, EquipmentVendor } from "./contract";
import { forneyAdapter } from "./forney";
import { controlsAdapter } from "./controls";
import { instronAdapter } from "./instron";
import { csvAdapter, xmlAdapter } from "./file-import";

export const ADAPTERS: Record<EquipmentVendor, EquipmentAdapter | null> = {
  forney:       forneyAdapter,
  controls:     controlsAdapter,
  instron:      instronAdapter,
  mts:          null,
  toni:         null,
  zwick:        null,
  ele:          null,
  hach:         null,
  lovibond:     null,
  "csv-generic": csvAdapter,
  "xml-generic": xmlAdapter,
};

export function getAdapter(vendor: EquipmentVendor): EquipmentAdapter | null {
  return ADAPTERS[vendor];
}

export const SUPPORTED_VENDORS: { vendor: EquipmentVendor; label: string; requiresEndpoint: boolean }[] =
  Object.entries(ADAPTERS)
    .filter(([, a]) => a !== null)
    .map(([k, a]) => ({
      vendor: k as EquipmentVendor,
      label: a!.displayName,
      requiresEndpoint: a!.requiresEndpoint,
    }));

export type { EquipmentAdapter, EquipmentVendor, EquipmentReading, AdapterConfig, AdapterContext, PollResult, CalibrationStatus } from "./contract";
