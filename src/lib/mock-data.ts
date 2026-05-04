// LocStr lets each text field be either a plain string (English) or a
// bilingual object { en, ar } as returned by the API.
import type { LocStr } from "@/lib/i18n-data";

export interface Project {
  id: string;
  code: string;
  name: LocStr;
  client: LocStr;
  city: LocStr;
  engineer: LocStr;
  status: "active" | "on_hold" | "completed";
  startDate: string;
  endDate: string;
  contractValue: number;
}

export interface Sample {
  id: string;
  code: string;
  type: "concrete" | "soil" | "aggregate" | "asphalt" | "steel" | "cement" | "masonry" | "water";
  projectId: string;
  date: string;
  location: LocStr;
  sampledBy: LocStr;
  status: "pending" | "in_test" | "completed";
}

export interface Test {
  id: string;
  code: string;
  name: LocStr;
  category: Sample["type"];
  standard: string;
  sampleId: string;
  projectId: string;
  testDate: string;
  technician: LocStr;
  status: "draft" | "submitted" | "reviewed" | "approved";
  passFail: "pass" | "fail" | "pending";
  primaryResult?: { value: number; unit: string; label: LocStr };
}

export interface Equipment {
  id: string;
  code: string;
  name: LocStr;
  manufacturer: string; // brand name — kept as-is
  model: string;        // model number — kept as-is
  serial: string;
  calibrationDue: string;
  status: "active" | "calibration_due" | "out_of_service";
}

// Seed arrays were removed — every list comes from the backend now.
// Empty exports kept so legacy imports (`import { projects } from
// "@/lib/mock-data"`) still resolve while we migrate call sites.
export const projects: Project[]   = [];
export const samples:  Sample[]    = [];
export const tests:    Test[]      = [];
export const equipment: Equipment[] = [];

export function projectById(_id: string): Project | undefined { return undefined; }
export function sampleById(_id: string):  Sample | undefined  { return undefined; }
export function testById(_id: string):    Test | undefined    { return undefined; }
