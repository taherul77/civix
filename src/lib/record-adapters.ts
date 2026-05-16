/**
 * Backend row → frontend record adapters.
 *
 * The Fastify schema (spec §4) uses Postgres-friendly camelCase fields like
 * `projectCode` / `projectName`, while the frontend mock-data types use
 * shorter `code` / `name` (with optional bilingual `LocStr` strings).
 *
 * These shims keep the swap invisible to UI components: every list screen,
 * detail page, and report renderer keeps reading the same fields it always
 * has, regardless of whether the data came from Zustand or the API.
 */

import type { Project, Sample, Test, Equipment } from "@/lib/mock-data";
import type { User, AuditEntry } from "@/store/data-store";

type AuditDiff = NonNullable<AuditEntry["diff"]>[number];

const CATEGORIES = new Set<Sample["type"]>([
  "concrete", "soil", "aggregate", "asphalt", "steel", "cement", "masonry", "water",
]);

function asCategory(t: string | undefined | null): Sample["type"] {
  return t && CATEGORIES.has(t as Sample["type"]) ? (t as Sample["type"]) : "concrete";
}

function isoDate(v: string | Date | null | undefined): string {
  if (!v) return "";
  return typeof v === "string" ? v.slice(0, 10) : v.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Project
// ---------------------------------------------------------------------------

export interface ApiProject {
  id: string;
  projectCode: string;
  projectName: string;
  clientName?: string | null;
  clientEmail?: string | null;
  city?: string | null;
  region?: string | null;
  engineerName?: string | null;
  engineerLicense?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  contractValue?: string | number | null;
  status: string;
  // Aggregates computed by the backend so the projects table doesn't have to
  // load every sample/test row just to render two counts. Optional so older
  // payloads still parse.
  sampleCount?: number | null;
  testCount?: number | null;
}

export function projectFromApi(p: ApiProject): Project {
  return {
    id: p.id,
    code: p.projectCode,
    name: p.projectName,
    client: p.clientName ?? "",
    clientEmail: p.clientEmail ?? null,
    city: p.city ?? "",
    engineer: p.engineerName ?? "",
    status: (["active", "on_hold", "completed"].includes(p.status) ? p.status : "active") as Project["status"],
    startDate: isoDate(p.startDate),
    endDate: isoDate(p.endDate),
    contractValue: typeof p.contractValue === "string" ? Number(p.contractValue) : (p.contractValue ?? 0),
    sampleCount: p.sampleCount ?? undefined,
    testCount:   p.testCount   ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// Sample
// ---------------------------------------------------------------------------

export interface ApiSample {
  id: string;
  projectId: string;
  sampleCode: string;
  sampleType: string;
  sampleDate: string;
  sampledBy?: string | null;
  sampleLocation?: string | null;
  status: string;
}

export function sampleFromApi(s: ApiSample): Sample {
  const status: Sample["status"] =
    s.status === "in_progress" ? "in_test" :
    s.status === "completed"   ? "completed" :
    "pending";
  return {
    id: s.id,
    code: s.sampleCode,
    type: asCategory(s.sampleType),
    projectId: s.projectId,
    date: isoDate(s.sampleDate),
    location: s.sampleLocation ?? "",
    sampledBy: s.sampledBy ?? "",
    status,
  };
}

// ---------------------------------------------------------------------------
// Test
// ---------------------------------------------------------------------------

export interface ApiTest {
  id: string;
  sampleId: string;
  projectId: string;
  testType: string;
  testCode: string;
  standardBody?: string | null;
  standardNumber?: string | null;
  testDate?: string | null;
  status: string;
  passFailStatus?: string | null;
  calculatedResults?: { primaryResult?: { value: number; unit: string; label?: string } } | Record<string, unknown> | null;
}

export function testFromApi(t: ApiTest): Test {
  const status: Test["status"] =
    t.status === "submitted" ? "submitted" :
    t.status === "reviewed"  ? "reviewed"  :
    t.status === "approved"  ? "approved"  :
    t.status === "signed"    ? "approved"  : // UI doesn't model "signed" yet
    "draft";

  const primary = (t.calculatedResults as { primaryResult?: { value: number; unit: string; label?: string } } | null)?.primaryResult;

  return {
    id: t.id,
    code: t.testCode,
    name: t.testType,
    category: asCategory(t.testType),
    standard: [t.standardBody, t.standardNumber].filter(Boolean).join(" "),
    sampleId: t.sampleId,
    projectId: t.projectId,
    testDate: isoDate(t.testDate),
    technician: "",
    status,
    passFail:
      t.passFailStatus === "pass" ? "pass" :
      t.passFailStatus === "fail" ? "fail" : "pending",
    primaryResult: primary
      ? { value: primary.value, unit: primary.unit, label: primary.label ?? "" }
      : undefined,
  };
}

// ---------------------------------------------------------------------------
// Equipment
// ---------------------------------------------------------------------------

export interface ApiEquipment {
  id: string;
  equipmentCode: string;
  equipmentName: string;
  manufacturer?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  calibrationDueDate?: string | null;
  status: string;
}

export function equipmentFromApi(e: ApiEquipment): Equipment {
  return {
    id: e.id,
    code: e.equipmentCode,
    name: e.equipmentName,
    manufacturer: e.manufacturer ?? "",
    model: e.model ?? "",
    serial: e.serialNumber ?? "",
    calibrationDue: isoDate(e.calibrationDueDate),
    status: (["active", "calibration_due", "out_of_service"].includes(e.status)
      ? e.status
      : "active") as Equipment["status"],
  };
}

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------

export interface ApiUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  /** Primary role — convenience field. Older endpoints set this only;
   *  newer ones also send `roles[]`. */
  role: string;
  /** Full list of roles assigned to this membership. */
  roles?: string[] | null;
  department?: string | null;
  isActive: boolean;
  membershipActive?: boolean;
  mfaEnabled: boolean;
  lastLoginAt?: string | null;
}

export function userFromApi(u: ApiUser): User {
  // membershipActive (per-tenant) overrides isActive (global) when present —
  // a Tenant Admin who deactivates someone for THIS company shouldn't have
  // to also disable their global account.
  const active = u.membershipActive ?? u.isActive;
  const roles = (u.roles && u.roles.length > 0) ? u.roles : (u.role ? [u.role] : []);
  return {
    id: u.id,
    name: [u.firstName, u.lastName].filter(Boolean).join(" ") || (u.email.split("@")[0] ?? u.email),
    email: u.email,
    phone: u.phone ?? undefined,
    role: roles[0] ?? "",
    roles,
    dept: u.department ?? "",
    status: active ? "active" : "inactive",
    mfa: u.mfaEnabled,
  };
}

// ---------------------------------------------------------------------------
// Audit
// ---------------------------------------------------------------------------

export interface ApiAudit {
  id: string;
  ts: string;
  user: string;
  action: string;
  entity: string;
  entityId: string;
  diff: unknown;
  ip: string | null;
  prevHash: string | null;
  hash: string | null;
}

export function auditFromApi(a: ApiAudit): AuditEntry {
  const diff: AuditDiff[] | undefined =
    Array.isArray(a.diff) ? (a.diff as AuditDiff[]) : undefined;
  return {
    id: a.id,
    ts: a.ts,
    user: a.user,
    email: a.user,
    action: a.action as AuditEntry["action"],
    entity: a.entity as AuditEntry["entity"],
    entityId: a.entityId,
    diff,
    ip: a.ip ?? "",
    prevHash: a.prevHash ?? undefined,
    hash: a.hash ?? undefined,
  };
}
