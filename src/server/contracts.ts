/**
 * API contracts — DTOs and request/response shapes for the (future) Fastify API
 * described in §4. These types are the only source of truth shared between
 * pages and the service layer. The current implementation in `src/server/api.ts`
 * resolves them against the local Zustand store; a future swap to `fetch()`
 * preserves these shapes byte-for-byte.
 */

import type { Project, Sample, Test, Equipment } from "@/lib/mock-data";
import type { User, Invoice, AuditEntry } from "@/store/data-store";
import type { Role, Permission } from "@/lib/rbac";

// ---------------------------------------------------------------------------
// Records (read shapes)
// ---------------------------------------------------------------------------

export type ProjectRecord  = Project;
export type SampleRecord   = Sample;
export type TestRecord     = Test;
export type EquipmentRecord = Equipment;
export type UserRecord     = User;
export type InvoiceRecord  = Invoice;
export type AuditRecord    = AuditEntry;

export interface SessionRecord {
  email: string;
  name: string;
  role: Role | string;
  tenant: string;
  permissions: Permission[];
}

// ---------------------------------------------------------------------------
// List query params (mirrors how a real REST API would filter server-side)
// ---------------------------------------------------------------------------

export interface ListProjectsParams {
  status?: ProjectRecord["status"] | "all";
  q?: string;
}

export interface ListSamplesParams {
  type?: SampleRecord["type"] | "all";
  projectId?: string;
  q?: string;
}

export interface ListTestsParams {
  status?: TestRecord["status"] | "all";
  category?: TestRecord["category"] | "all";
  projectId?: string;
  sampleId?: string;
  q?: string;
}

export interface ListAuditParams {
  q?: string;
  entity?: AuditRecord["entity"] | "all";
  limit?: number;
}

export interface PagedResponse<T> {
  items: T[];
  total: number;
}

// ---------------------------------------------------------------------------
// Mutation inputs
// ---------------------------------------------------------------------------

export type CreateProjectInput   = Omit<ProjectRecord, "id">;
export type CreateSampleInput    = Omit<SampleRecord, "id">;
export type CreateTestInput      = Omit<TestRecord, "id">;
export type CreateEquipmentInput = Omit<EquipmentRecord, "id">;
export type InviteUserInput      = Omit<UserRecord, "id">;
export type CreateInvoiceInput   = InvoiceRecord;

export interface SignInInput {
  email: string;
  password: string;
  tenant: string;
  role: string;
}

export interface WorkflowComment { comment?: string }

export interface SignInput { certificateSerial: string }

// ---------------------------------------------------------------------------
// Dashboard aggregate (KPI tiles + charts data)
// ---------------------------------------------------------------------------

export interface DashboardStats {
  testsToday: number;
  pendingReview: number;
  approvedThisMonth: number;
  overdueCalibrations: number;
  monthlyVolume: { month: string; tests: number; passed: number }[];
  byCategory: { name: string; value: number }[];
  passFailByCategory: { category: string; pass: number; fail: number }[];
  activeProjects: ProjectRecord[];
  recentTests: TestRecord[];
}
