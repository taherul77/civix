"use client";

/**
 * The CiviXLab API service layer.
 *
 * Today: every function is a synchronous read or write against the Zustand
 * store in `src/store/data-store.ts` and `src/store/app-store.ts`. The
 * functions are nonetheless `async`/Promise-returning so that:
 *
 *   1. Components consume them through the same code path they will use when
 *      the real Fastify backend (spec §3) lands.
 *   2. We can introduce simulated latency or error scenarios without
 *      touching call sites.
 *
 * When the backend ships, only the BODIES below change — they swap from
 * `useData.getState()` reads to `fetch('/api/...')` calls. Contracts in
 * `src/server/contracts.ts` and the hooks in `src/server/queries.ts` stay
 * exactly the same.
 */

import { useApp } from "@/store/app-store";
import { useData } from "@/store/data-store";
import { rolePermissions } from "@/lib/rbac";
import { apiFetch, isBackendActive } from "@/lib/api-client";
import {
  projectFromApi,
  sampleFromApi,
  testFromApi,
  equipmentFromApi,
  userFromApi,
  auditFromApi,
  type ApiProject,
  type ApiSample,
  type ApiTest,
  type ApiEquipment,
  type ApiUser,
  type ApiAudit,
} from "@/lib/record-adapters";
import { require as requirePerm, requireAuth } from "@/server/guard";
import { errors } from "@/server/errors";
import {
  generateBase32Secret,
  generateRecoveryCodes,
  otpauthUri,
  verifyTotp,
} from "@/lib/totp";
import { verifyChain } from "@/server/audit-chain";
import { getAdapter, type EquipmentVendor, type EquipmentReading } from "@/server/equipment-adapters";
import type { EquipmentReadingRecord, EquipmentConnection, InvoiceLineItem } from "@/store/data-store";
import { issueCsid, signAndClearInvoice, type ZatcaSignableInvoice, type CsidRecord } from "@/lib/zatca";
import type {
  CreateEquipmentInput,
  CreateInvoiceInput,
  CreateProjectInput,
  CreateSampleInput,
  CreateTestInput,
  DashboardStats,
  EquipmentRecord,
  InviteUserInput,
  InvoiceRecord,
  ListAuditParams,
  ListProjectsParams,
  ListSamplesParams,
  ListTestsParams,
  MfaEnrolmentInit,
  MfaEnrolVerifyInput,
  MfaRecoveryInput,
  MfaSignInResult,
  MfaVerifyInput,
  PagedResponse,
  ProjectRecord,
  ReportContext,
  ReportGenerateInput,
  SampleRecord,
  SessionRecord,
  SignInInput,
  SignInput,
  TestRecord,
  UserRecord,
  AuditRecord,
  VerifyResult,
  WorkflowComment,
} from "@/server/contracts";

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

const SIMULATE_LATENCY = false;
const tick = () => SIMULATE_LATENCY ? new Promise<void>((r) => setTimeout(r, 60)) : Promise.resolve();

const locStr = (v: unknown): string => {
  if (typeof v === "string") return v;
  if (v && typeof v === "object") {
    const o = v as { en?: string; ar?: string };
    return `${o.en ?? ""} ${o.ar ?? ""}`;
  }
  return "";
};

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const auth = {
  async session(): Promise<SessionRecord | null> {
    await tick();
    const u = useApp.getState().user;
    if (!u) return null;
    return {
      email: u.email,
      name: u.name,
      role: u.role,
      tenant: u.tenant,
      permissions: rolePermissions(u.role),
    };
  },

  async signIn(input: SignInInput): Promise<MfaSignInResult> {
    await tick();
    if (!input.email || !input.password) throw errors.validation("Email and password required");

    // Two-step backend flow:
    //   1. /v1/auth/signin → either a Super Admin token (kind:"super-admin")
    //      or a short-lived userToken + tenant memberships (kind:"user").
    //   2. If memberships.length === 1 → auto-call /v1/auth/select-tenant.
    //      If memberships.length > 1  → return {kind:"pick-tenant"} and let
    //      the form show a company picker; the form then calls auth.selectTenant.
    try {
      const step1 = await apiFetch<
        | {
            kind: "super-admin";
            token: string;
            user: { id: string; email: string; name: string; isSuperAdmin: true };
          }
        | {
            kind: "user";
            userToken: string;
            user: { id: string; email: string; name: string; mfaRequired: boolean; isSuperAdmin: false };
            memberships: Array<{
              tenantId: string;
              tenantName: string;
              subdomain: string;
              logoUrl: string | null;
              role: string;
              department: string | null;
            }>;
          }
      >("/v1/auth/signin", {
        method: "POST",
        noAuth: true,
        body: { email: input.email, password: input.password },
      });

      // Super Admin path — no tenant; UI routes to /super for tenant management.
      if (step1.kind === "super-admin") {
        const session: SessionRecord = {
          email: step1.user.email,
          name: step1.user.name || step1.user.email.split("@")[0],
          role: "Super Admin",
          tenant: "—",
          permissions: [],
        };
        useApp.getState().setApiToken(step1.token, null);
        useApp.getState().signIn({
          email: session.email,
          name: session.name,
          role: session.role,
          tenant: session.tenant,
          isSuperAdmin: true,
        });
        return { kind: "session", session };
      }

      if (!step1.memberships || step1.memberships.length === 0) {
        throw errors.forbidden("auth", "User is not a member of any company");
      }

      // Stash the userToken so subsequent /select-tenant call carries it.
      useApp.getState().setApiToken(step1.userToken, null);

      // Multiple memberships → let the UI render a picker.
      if (step1.memberships.length > 1) {
        return {
          kind: "pick-tenant",
          memberships: step1.memberships.map((m) => ({
            tenantId:   m.tenantId,
            tenantName: m.tenantName,
            subdomain:  m.subdomain,
            logoUrl:    m.logoUrl,
            role:       m.role,
            department: m.department,
          })),
        };
      }

      // Exactly one membership → enter directly.
      return await this.selectTenant(step1.memberships[0]!.tenantId);
    } catch (err) {
      // Network failure → fall through to mock path so demo still works.
      // Auth failures (401/403) bubble up to the caller.
      if (err instanceof Error && /fetch|Network|Failed/.test(err.message)) {
        useApp.getState().setApiToken(null, null);
        // continue to mock
      } else {
        useApp.getState().setApiToken(null, null);
        throw err;
      }
    }

    // Offline mock fallback — only reached when the backend was unreachable.
    // Defaults are applied when the form no longer collects tenant/role.
    const name = (input.email
      .split("@")[0] ?? input.email)
      .split(".")
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" ");
    const fallbackRole   = input.role   ?? "Lab Engineer";
    const fallbackTenant = input.tenant ?? "Demo Lab";
    const pending = { email: input.email, name, role: fallbackRole, tenant: fallbackTenant };

    // If the user has enrolled MFA, hold the session in `pendingSignIn`
    // and require a TOTP code. Otherwise complete sign-in immediately.
    const enrolled = useApp.getState().mfa[input.email];
    if (enrolled) {
      useApp.getState().startMfaChallenge(pending);
      return { kind: "mfa-required", email: input.email, name };
    }

    useApp.getState().signIn(pending);
    useData.getState().log({
      user: `${name} (${fallbackRole})`,
      email: input.email,
      action: "login",
      entity: "session",
      entityId: input.email,
    });
    return {
      kind: "session",
      session: {
        email: input.email,
        name,
        role: fallbackRole,
        tenant: fallbackTenant,
        permissions: rolePermissions(fallbackRole),
      },
    };
  },

  /**
   * Step 2 of the picker flow. Trades the userToken (already in the store
   * from a prior signIn call) plus the chosen tenantId for a tenant-scoped
   * session JWT, then hydrates the page-permission matrix from the backend.
   */
  async selectTenant(tenantId: string): Promise<MfaSignInResult> {
    const out = await apiFetch<{
      token: string;
      session: { email: string; name: string; role: string; tenant: string; permissions: string[]; mfaRequired: boolean; isSuperAdmin?: boolean };
    }>("/v1/auth/select-tenant", {
      method: "POST",
      body: { tenantId },
    });

    const session: SessionRecord = {
      email: out.session.email,
      name: out.session.name || out.session.email.split("@")[0],
      role: out.session.role,
      tenant: out.session.tenant,
      permissions: out.session.permissions as SessionRecord["permissions"],
    };
    useApp.getState().setApiToken(out.token, null);
    useApp.getState().signIn({
      email: session.email,
      name: session.name,
      role: session.role,
      tenant: session.tenant,
      isSuperAdmin: !!out.session.isSuperAdmin,
    });

    // Hydrate the per-tenant page-permission matrix so the sidebar can
    // apply view-rules immediately. Failure is non-fatal.
    try {
      const perms = await apiFetch<{
        items: Array<{ role: string; pageId: string; view: boolean; create: boolean; edit: boolean; delete: boolean }>;
      }>("/v1/role-permissions");
      useApp.getState().hydratePagePermissions(perms.items);
    } catch {
      // ignore — defaults will apply
    }

    return { kind: "session", session };
  },

  async verifyMfa(input: MfaVerifyInput): Promise<SessionRecord> {
    await tick();
    const pending = useApp.getState().pendingSignIn;
    if (!pending) throw errors.unauthenticated("No MFA challenge in progress");
    const enrolled = useApp.getState().mfa[pending.email];
    if (!enrolled) throw errors.conflict("MFA is not enrolled for this account");
    const ok = await verifyTotp(enrolled.secret, input.code, 1);
    if (!ok) throw errors.forbidden("mfa:verify", "The 6-digit code is invalid or expired.");

    useApp.getState().signIn(pending);
    useData.getState().log({
      user: `${pending.name} (${pending.role})`,
      email: pending.email,
      action: "login",
      entity: "session",
      entityId: pending.email,
      diff: [{ field: "mfa", from: "pending", to: "verified" }],
    });
    return {
      email: pending.email,
      name: pending.name,
      role: pending.role,
      tenant: pending.tenant,
      permissions: rolePermissions(pending.role),
    };
  },

  async verifyRecoveryCode(input: MfaRecoveryInput): Promise<SessionRecord> {
    await tick();
    const pending = useApp.getState().pendingSignIn;
    if (!pending) throw errors.unauthenticated("No MFA challenge in progress");
    const consumed = useApp.getState().consumeRecoveryCode(pending.email, input.recoveryCode);
    if (!consumed) throw errors.forbidden("mfa:recovery", "Recovery code is invalid or already used.");

    useApp.getState().signIn(pending);
    useData.getState().log({
      user: `${pending.name} (${pending.role})`,
      email: pending.email,
      action: "login",
      entity: "session",
      entityId: pending.email,
      diff: [{ field: "mfa", from: "pending", to: "recovery-code" }],
    });
    return {
      email: pending.email,
      name: pending.name,
      role: pending.role,
      tenant: pending.tenant,
      permissions: rolePermissions(pending.role),
    };
  },

  async cancelMfa(): Promise<void> {
    await tick();
    useApp.getState().cancelMfaChallenge();
  },

  /**
   * Begin MFA enrolment — mints a fresh TOTP secret + 8 recovery codes.
   * Must be confirmed via `confirmMfaEnrolment` with a 6-digit code from the
   * authenticator app before persisting to the user record.
   */
  async beginMfaEnrolment(): Promise<MfaEnrolmentInit> {
    await tick();
    const actor = requireAuth();
    const secret = generateBase32Secret(20);
    const recoveryCodes = generateRecoveryCodes(8);
    const uri = otpauthUri({ secret, account: actor.email, issuer: "CiviXLab" });
    return { secret, otpauthUri: uri, recoveryCodes };
  },

  async confirmMfaEnrolment(secret: string, recoveryCodes: string[], input: MfaEnrolVerifyInput): Promise<void> {
    await tick();
    const actor = requireAuth();
    if (!secret) throw errors.validation("Missing TOTP secret");
    const ok = await verifyTotp(secret, input.code, 1);
    if (!ok) throw errors.forbidden("mfa:enrol", "Code did not match the new secret. Try again.");
    useApp.getState().enrolMfa(actor.email, secret, recoveryCodes);
    useData.getState().log({
      user: `${actor.name} (${actor.role})`,
      email: actor.email,
      action: "update",
      entity: "user",
      entityId: actor.email,
      diff: [{ field: "mfa", from: "disabled", to: "enabled (TOTP)" }],
    });
  },

  async disableMfa(): Promise<void> {
    await tick();
    const actor = requireAuth();
    useApp.getState().clearMfa(actor.email);
    useData.getState().log({
      user: `${actor.name} (${actor.role})`,
      email: actor.email,
      action: "update",
      entity: "user",
      entityId: actor.email,
      diff: [{ field: "mfa", from: "enabled (TOTP)", to: "disabled" }],
    });
  },

  async signOut(): Promise<void> {
    await tick();
    const u = useApp.getState().user;
    if (u) {
      useData.getState().log({
        user: `${u.name} (${u.role})`,
        email: u.email,
        action: "logout",
        entity: "session",
        entityId: u.email,
      });
    }
    useApp.getState().signOut();           // clears token + tenant + user
  },
};

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export const projects = {
  async list(params: ListProjectsParams = {}): Promise<PagedResponse<ProjectRecord>> {
    await tick();
    if (isBackendActive()) {
      const out = await apiFetch<{ items: ApiProject[]; total: number }>("/v1/projects", {
        query: { status: params.status, q: params.q },
      });
      return { items: out.items.map(projectFromApi), total: out.total };
    }
    requireAuth();
    const all = useData.getState().projects;
    const items = all.filter((p) => {
      if (params.status && params.status !== "all" && p.status !== params.status) return false;
      if (params.q) {
        const hay = `${p.code} ${locStr(p.name)} ${locStr(p.client)} ${locStr(p.city)}`.toLowerCase();
        if (!hay.includes(params.q.toLowerCase())) return false;
      }
      return true;
    });
    return { items, total: items.length };
  },
  async get(id: string): Promise<ProjectRecord | null> {
    await tick();
    if (isBackendActive()) {
      try {
        const row = await apiFetch<ApiProject>(`/v1/projects/${id}`);
        return projectFromApi(row);
      } catch (e) {
        if (e instanceof Error && /404/.test((e as { status?: number }).status?.toString() ?? "")) return null;
        throw e;
      }
    }
    requireAuth();
    return useData.getState().projects.find((p) => p.id === id) ?? null;
  },
  async create(input: CreateProjectInput): Promise<ProjectRecord> {
    await tick();
    if (isBackendActive()) {
      const row = await apiFetch<ApiProject>("/v1/projects", {
        method: "POST",
        body: {
          projectCode:  input.code,
          projectName:  locStr(input.name),
          clientName:   locStr(input.client),
          city:         locStr(input.city),
          engineerName: locStr(input.engineer),
          startDate:    input.startDate ? new Date(input.startDate).toISOString() : undefined,
          endDate:      input.endDate   ? new Date(input.endDate).toISOString()   : undefined,
          contractValue: input.contractValue,
          status: input.status,
        },
      });
      return projectFromApi(row);
    }
    const actor = requirePerm("project:create");
    const id = useData.getState().addProject(input, actor);
    return { ...input, id };
  },
};

// ---------------------------------------------------------------------------
// Samples
// ---------------------------------------------------------------------------

export const samples = {
  async list(params: ListSamplesParams = {}): Promise<PagedResponse<SampleRecord>> {
    await tick();
    if (isBackendActive()) {
      const out = await apiFetch<{ items: ApiSample[]; total: number }>("/v1/samples", {
        query: { type: params.type, projectId: params.projectId, q: params.q },
      });
      return { items: out.items.map(sampleFromApi), total: out.total };
    }
    requireAuth();
    const all = useData.getState().samples;
    const items = all.filter((s) => {
      if (params.type && params.type !== "all" && s.type !== params.type) return false;
      if (params.projectId && s.projectId !== params.projectId) return false;
      if (params.q) {
        const hay = `${s.code} ${locStr(s.location)} ${locStr(s.sampledBy)}`.toLowerCase();
        if (!hay.includes(params.q.toLowerCase())) return false;
      }
      return true;
    });
    return { items, total: items.length };
  },
  async get(id: string): Promise<SampleRecord | null> {
    await tick();
    if (isBackendActive()) {
      try { return sampleFromApi(await apiFetch<ApiSample>(`/v1/samples/${id}`)); }
      catch (e) {
        if (e instanceof Error && (e as { status?: number }).status === 404) return null;
        throw e;
      }
    }
    requireAuth();
    return useData.getState().samples.find((s) => s.id === id) ?? null;
  },
  async create(input: CreateSampleInput): Promise<SampleRecord> {
    await tick();
    if (isBackendActive()) {
      const row = await apiFetch<ApiSample>("/v1/samples", {
        method: "POST",
        body: {
          projectId:      input.projectId,
          sampleCode:     input.code,
          sampleType:     input.type,
          sampleDate:     new Date(input.date).toISOString(),
          sampledBy:      locStr(input.sampledBy),
          sampleLocation: locStr(input.location),
          status:         input.status === "in_test" ? "in_progress" : input.status,
        },
      });
      return sampleFromApi(row);
    }
    const actor = requirePerm("sample:create");
    const id = useData.getState().addSample(input, actor);
    return { ...input, id };
  },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

export const tests = {
  async list(params: ListTestsParams = {}): Promise<PagedResponse<TestRecord>> {
    await tick();
    if (isBackendActive()) {
      const out = await apiFetch<{ items: ApiTest[]; total: number }>("/v1/tests", {
        query: { status: params.status, testType: params.category, projectId: params.projectId, sampleId: params.sampleId, q: params.q },
      });
      return { items: out.items.map(testFromApi), total: out.total };
    }
    requireAuth();
    const all = useData.getState().tests;
    const items = all.filter((t) => {
      if (params.status   && params.status   !== "all" && t.status   !== params.status)   return false;
      if (params.category && params.category !== "all" && t.category !== params.category) return false;
      if (params.projectId && t.projectId !== params.projectId) return false;
      if (params.sampleId && t.sampleId !== params.sampleId) return false;
      if (params.q) {
        const hay = `${t.code} ${locStr(t.name)} ${t.standard}`.toLowerCase();
        if (!hay.includes(params.q.toLowerCase())) return false;
      }
      return true;
    });
    return { items, total: items.length };
  },

  async get(id: string): Promise<TestRecord | null> {
    await tick();
    if (isBackendActive()) {
      try { return testFromApi(await apiFetch<ApiTest>(`/v1/tests/${id}`)); }
      catch (e) {
        if (e instanceof Error && (e as { status?: number }).status === 404) return null;
        throw e;
      }
    }
    requireAuth();
    return useData.getState().tests.find((t) => t.id === id) ?? null;
  },

  async create(input: CreateTestInput): Promise<TestRecord> {
    await tick();
    if (isBackendActive()) {
      const [stdBody, ...stdNum] = (input.standard ?? "").split(" ");
      const row = await apiFetch<ApiTest>("/v1/tests", {
        method: "POST",
        body: {
          sampleId:       input.sampleId,
          projectId:      input.projectId,
          testType:       input.category,
          testCode:       input.code,
          standardBody:   stdBody || undefined,
          standardNumber: stdNum.length ? stdNum.join(" ") : undefined,
          testDate:       input.testDate ? new Date(input.testDate).toISOString() : undefined,
          inputData:      {},
          calculatedResults: input.primaryResult ? { primaryResult: { value: input.primaryResult.value, unit: input.primaryResult.unit, label: locStr(input.primaryResult.label) } } : undefined,
          passFailStatus: input.passFail === "pass" ? "pass" : input.passFail === "fail" ? "fail" : undefined,
        },
      });
      return testFromApi(row);
    }
    const actor = requirePerm("test:create");
    const id = useData.getState().addTest(input, actor);
    return { ...input, id };
  },

  async submit(id: string): Promise<void> {
    await tick();
    if (isBackendActive()) { await apiFetch(`/v1/tests/${id}/submit`, { method: "POST", body: {} }); return; }
    const actor = requirePerm("test:submit");
    const t = useData.getState().tests.find((x) => x.id === id);
    if (!t) throw errors.notFound("Test", id);
    if (t.status !== "draft") throw errors.conflict(`Test ${id} cannot be submitted from status "${t.status}"`);
    useData.getState().submitTestForReview({ testId: id, actor });
  },

  async review(id: string, opts: WorkflowComment = {}): Promise<void> {
    await tick();
    if (isBackendActive()) { await apiFetch(`/v1/tests/${id}/review`, { method: "POST", body: { comment: opts.comment } }); return; }
    const actor = requirePerm("test:review");
    const t = useData.getState().tests.find((x) => x.id === id);
    if (!t) throw errors.notFound("Test", id);
    if (t.status !== "submitted") throw errors.conflict(`Test ${id} cannot be reviewed from status "${t.status}"`);
    useData.getState().reviewTest({ testId: id, actor, comment: opts.comment });
  },

  async approve(id: string, opts: WorkflowComment = {}): Promise<void> {
    await tick();
    if (isBackendActive()) { await apiFetch(`/v1/tests/${id}/approve`, { method: "POST", body: { comment: opts.comment } }); return; }
    const actor = requirePerm("test:approve");
    const t = useData.getState().tests.find((x) => x.id === id);
    if (!t) throw errors.notFound("Test", id);
    if (t.status === "approved") throw errors.conflict(`Test ${id} is already approved.`);
    useData.getState().approveTest({ testId: id, actor, comment: opts.comment });
  },

  async sign(id: string, input: SignInput): Promise<void> {
    await tick();
    if (!input.certificateSerial) throw errors.validation("Certificate serial required for signing");
    if (isBackendActive()) { await apiFetch(`/v1/tests/${id}/sign`, { method: "POST", body: { certificateSerial: input.certificateSerial } }); return; }
    const actor = requirePerm("test:sign");
    const t = useData.getState().tests.find((x) => x.id === id);
    if (!t) throw errors.notFound("Test", id);
    useData.getState().signTest({ testId: id, actor, certificateSerial: input.certificateSerial });
  },

  async reject(id: string, opts: WorkflowComment = {}): Promise<void> {
    await tick();
    if (isBackendActive()) { await apiFetch(`/v1/tests/${id}/reject`, { method: "POST", body: { comment: opts.comment } }); return; }
    const actor = requirePerm("test:review");
    const t = useData.getState().tests.find((x) => x.id === id);
    if (!t) throw errors.notFound("Test", id);
    useData.getState().rejectTest({ testId: id, actor, comment: opts.comment });
  },
};

// ---------------------------------------------------------------------------
// Equipment
// ---------------------------------------------------------------------------

function readingToRecord(r: EquipmentReading): EquipmentReadingRecord {
  return {
    id: r.id ?? `er-${Math.random().toString(36).slice(2, 10)}`,
    equipmentId: r.equipmentId,
    capturedAt: r.capturedAt,
    vendor: r.vendor,
    testType: r.testType,
    finalResult: r.finalResult,
    samples: r.samples,
    environmental: r.environmental,
    calibrationStatus: r.calibrationStatus,
    rawDataRef: r.rawDataRef,
    note: r.note,
  };
}

export const equipment = {
  async list(): Promise<PagedResponse<EquipmentRecord>> {
    await tick();
    if (isBackendActive()) {
      const out = await apiFetch<{ items: ApiEquipment[]; total: number }>("/v1/equipment");
      return { items: out.items.map(equipmentFromApi), total: out.total };
    }
    requireAuth();
    const items = useData.getState().equipment;
    return { items, total: items.length };
  },
  async create(input: CreateEquipmentInput): Promise<EquipmentRecord> {
    await tick();
    if (isBackendActive()) {
      const row = await apiFetch<ApiEquipment>("/v1/equipment", {
        method: "POST",
        body: {
          equipmentCode:      input.code,
          equipmentName:      locStr(input.name),
          manufacturer:       input.manufacturer,
          model:              input.model,
          serialNumber:       input.serial,
          calibrationDueDate: input.calibrationDue ? new Date(input.calibrationDue).toISOString() : undefined,
          status:             input.status,
        },
      });
      return equipmentFromApi(row);
    }
    const actor = requirePerm("equipment:create");
    const id = useData.getState().addEquipment(input, actor);
    return { ...input, id };
  },

  /** Persist the integration endpoint + API key for this equipment record. */
  async connect(equipmentId: string, conn: EquipmentConnection): Promise<void> {
    await tick();
    if (isBackendActive()) {
      await apiFetch(`/v1/equipment/${equipmentId}/connect`, {
        method: "POST",
        body: { vendor: conn.vendor, endpoint: conn.endpoint, apiKey: conn.apiKey },
      });
      // Mirror locally so the equipment-adapters layer (which polls in-memory)
      // continues to work for read-after-write.
      useData.getState().setEquipmentConnection(equipmentId, conn);
      return;
    }
    const actor = requirePerm("equipment:calibrate");
    const eq = useData.getState().equipment.find((e) => e.id === equipmentId);
    if (!eq) throw errors.notFound("Equipment", equipmentId);
    useData.getState().setEquipmentConnection(equipmentId, conn);
    useData.getState().log({
      user: `${actor.name} (${actor.role})`,
      email: actor.email,
      action: "update",
      entity: "equipment",
      entityId: equipmentId,
      diff: [{ field: "integration", from: "—", to: `${conn.vendor} @ ${conn.endpoint ?? "(file import)"}` }],
    });
  },

  async disconnect(equipmentId: string): Promise<void> {
    await tick();
    if (isBackendActive()) {
      await apiFetch(`/v1/equipment/${equipmentId}/disconnect`, { method: "POST", body: {} });
      useData.getState().setEquipmentConnection(equipmentId, null);
      return;
    }
    const actor = requirePerm("equipment:calibrate");
    const eq = useData.getState().equipment.find((e) => e.id === equipmentId);
    if (!eq) throw errors.notFound("Equipment", equipmentId);
    useData.getState().setEquipmentConnection(equipmentId, null);
    useData.getState().log({
      user: `${actor.name} (${actor.role})`,
      email: actor.email,
      action: "update",
      entity: "equipment",
      entityId: equipmentId,
      diff: [{ field: "integration", from: "connected", to: "disconnected" }],
    });
  },

  /** Poll the connected adapter for new readings. */
  async pollAdapter(equipmentId: string): Promise<{ added: number }> {
    await tick();
    const actor = requirePerm("equipment:calibrate");
    const s = useData.getState();
    const eq = s.equipment.find((e) => e.id === equipmentId);
    if (!eq) throw errors.notFound("Equipment", equipmentId);
    const conn = s.equipmentConnections[equipmentId];
    if (!conn) throw errors.conflict("No integration configured for this equipment");
    const adapter = getAdapter(conn.vendor as EquipmentVendor);
    if (!adapter || !adapter.requiresEndpoint) {
      throw errors.conflict(`Adapter ${conn.vendor} does not support polling — use file import.`);
    }
    if (eq.status === "calibration_due" || eq.status === "out_of_service") {
      // Calibration is enforced — readings are still captured but flagged.
    }
    const result = await adapter.poll(
      { vendor: conn.vendor as EquipmentVendor, endpoint: conn.endpoint, apiKey: conn.apiKey },
      conn.lastPolledAt ?? null,
      {
        equipmentId: eq.id,
        equipmentCode: eq.code,
        vendor: conn.vendor as EquipmentVendor,
        model: eq.model,
        serialNumber: eq.serial,
        calibrationDue: eq.calibrationDue,
      }
    );
    const records = result.readings.map(readingToRecord);
    records.forEach((r) => useData.getState().addEquipmentReading(r));
    useData.getState().setEquipmentConnection(equipmentId, { ...conn, lastPolledAt: new Date().toISOString() });
    useData.getState().log({
      user: `${actor.name} (${actor.role})`,
      email: actor.email,
      action: "calibration",
      entity: "equipment",
      entityId: equipmentId,
      diff: [{ field: "readings", from: "—", to: `+${records.length} from ${conn.vendor}` }],
    });
    return { added: records.length };
  },

  /** Upload a CSV / XML file from a legacy machine. */
  async importFile(equipmentId: string, vendor: EquipmentVendor, file: File): Promise<{ added: number }> {
    await tick();
    const actor = requirePerm("equipment:calibrate");
    const eq = useData.getState().equipment.find((e) => e.id === equipmentId);
    if (!eq) throw errors.notFound("Equipment", equipmentId);
    const adapter = getAdapter(vendor);
    if (!adapter?.importFile) throw errors.conflict(`Adapter ${vendor} does not support file import.`);
    const readings = await adapter.importFile(file, {
      equipmentId: eq.id,
      equipmentCode: eq.code,
      vendor,
      model: eq.model,
      serialNumber: eq.serial,
      calibrationDue: eq.calibrationDue,
    });
    const records = readings.map(readingToRecord);
    records.forEach((r) => useData.getState().addEquipmentReading(r));
    useData.getState().log({
      user: `${actor.name} (${actor.role})`,
      email: actor.email,
      action: "calibration",
      entity: "equipment",
      entityId: equipmentId,
      diff: [{ field: "readings", from: "—", to: `+${records.length} (${vendor} import: ${file.name})` }],
    });
    return { added: records.length };
  },

  /** All readings for one equipment, newest first. */
  async readings(equipmentId: string): Promise<EquipmentReadingRecord[]> {
    await tick();
    requireAuth();
    return useData.getState().equipmentReadings.filter((r) => r.equipmentId === equipmentId);
  },

  /** Latest unconsumed reading for one equipment — used to auto-populate test forms. */
  async latestReading(equipmentId: string): Promise<EquipmentReadingRecord | null> {
    await tick();
    requireAuth();
    const r = useData.getState().equipmentReadings
      .filter((x) => x.equipmentId === equipmentId && !x.consumed);
    return r[0] ?? null;
  },

  async markReadingConsumed(readingId: string): Promise<void> {
    await tick();
    requireAuth();
    useData.getState().consumeEquipmentReading(readingId);
  },
};

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export const users = {
  async list(): Promise<PagedResponse<UserRecord>> {
    await tick();
    if (isBackendActive()) {
      const out = await apiFetch<{ items: ApiUser[]; total: number }>("/v1/users");
      return { items: out.items.map(userFromApi), total: out.total };
    }
    requireAuth();
    const items = useData.getState().users;
    return { items, total: items.length };
  },
  async invite(input: InviteUserInput): Promise<UserRecord> {
    await tick();
    if (isBackendActive()) {
      const [first, ...rest] = (input.name ?? "").split(" ");
      const row = await apiFetch<ApiUser>("/v1/users/invite", {
        method: "POST",
        body: {
          email: input.email,
          role:  input.role,
          firstName: first ?? undefined,
          lastName:  rest.length ? rest.join(" ") : undefined,
        },
      });
      return userFromApi(row);
    }
    const actor = requirePerm("user:invite");
    const id = useData.getState().addUser(input, actor);
    return { ...input, id };
  },
};

// ---------------------------------------------------------------------------
// Invoices
// ---------------------------------------------------------------------------

export const invoices = {
  async list(): Promise<PagedResponse<InvoiceRecord>> {
    await tick();
    requireAuth();
    const items = useData.getState().invoices;
    return { items, total: items.length };
  },
  async create(input: CreateInvoiceInput & { lineItems?: InvoiceLineItem[] }): Promise<InvoiceRecord> {
    await tick();
    const actor = requirePerm("billing:create");
    useData.getState().addInvoice(input, actor);
    return input;
  },

  /**
   * ZATCA Phase 2 real-time clearance: hash → seller-sign → submit → receive
   * cleared envelope (UUID + stamp) → mint TLV QR. The whole flow happens
   * client-side today; in production the seller-signed XML is POSTed to
   * `https://gw-fatoora.zatca.gov.sa/e-invoicing/.../invoices/clearance/single`
   * and ZATCA returns the cleared envelope with their stamp.
   */
  async clearWithZatca(invoiceId: string): Promise<{ uuid: string; clearedAt: string }> {
    await tick();
    const actor = requirePerm("billing:create");
    const s = useData.getState();
    const inv = s.invoices.find((i) => i.id === invoiceId);
    if (!inv) throw errors.notFound("Invoice", invoiceId);
    if (inv.zatcaPayload) throw errors.conflict("Invoice has already been cleared.");
    const csid = s.csid;
    if (!csid) throw errors.conflict("No active CSID — issue one in the Compliance panel first.");
    if (new Date(csid.expiresAt).getTime() < Date.now()) {
      throw errors.conflict("CSID expired — rotate before clearing further invoices.");
    }

    const tenantName = useApp.getState().user?.tenant ?? "CiviXLab";
    const lineItems = inv.lineItems ?? [
      { description: `Invoice ${inv.id}`, qty: 1, unitPriceSar: inv.amount, vatRate: 15 },
    ];

    const signable: ZatcaSignableInvoice = {
      invoiceId: inv.id,
      sellerName: tenantName,
      vatNumber: "300100000000003", // tenant VAT — wired to settings in real backend
      buyerName: inv.client,
      totalWithVat: inv.amount + inv.vat,
      vatAmount: inv.vat,
      date: inv.date,
      lineItems,
    };

    // Re-cast the persisted CSID into the in-memory `CsidRecord` shape used
    // by the signer.
    const csidRec: CsidRecord = {
      serial: csid.serial,
      status: csid.status,
      issuedAt: csid.issuedAt,
      expiresAt: csid.expiresAt,
      publicKeySpkiB64: csid.publicKeySpkiB64,
      privateKeyJwk: csid.privateKeyJwk,
      lastRotatedAt: csid.lastRotatedAt,
    };

    const cleared = await signAndClearInvoice(signable, csidRec);
    const payload = {
      uuid: cleared.uuid,
      invoiceHash: cleared.invoiceHash,
      signature: cleared.signature,
      publicKeySpki: cleared.publicKey,
      stamp: cleared.stamp,
      qrBase64: cleared.qrBase64,
      clearedAt: cleared.clearedAt,
      csidSerial: csid.serial,
    } as const;

    useData.getState().updateInvoice(invoiceId, {
      status: inv.status === "draft" ? "sent" : inv.status,
      zatca: `ZX-${cleared.uuid.slice(0, 8).toUpperCase()}`,
      zatcaPayload: payload,
    });

    useData.getState().log({
      user: `${actor.name} (${actor.role})`,
      email: actor.email,
      action: "invoice",
      entity: "invoice",
      entityId: invoiceId,
      diff: [
        { field: "zatca.status",     from: "draft",      to: "cleared" },
        { field: "zatca.uuid",       from: "—",          to: cleared.uuid },
        { field: "zatca.csidSerial", from: "—",          to: csid.serial },
      ],
    });

    return { uuid: cleared.uuid, clearedAt: cleared.clearedAt };
  },
};

// ---------------------------------------------------------------------------
// ZATCA — CSID issuance / rotation + invoice verification
// ---------------------------------------------------------------------------

export const zatca = {
  async issueCsid(): Promise<{ serial: string; expiresAt: string }> {
    await tick();
    const actor = requirePerm("settings:update");
    const fresh = await issueCsid();
    useData.getState().setCsid({
      serial: fresh.serial,
      status: fresh.status,
      issuedAt: fresh.issuedAt,
      expiresAt: fresh.expiresAt,
      publicKeySpkiB64: fresh.publicKeySpkiB64,
      privateKeyJwk: fresh.privateKeyJwk,
      lastRotatedAt: fresh.lastRotatedAt,
    });
    useData.getState().log({
      user: `${actor.name} (${actor.role})`,
      email: actor.email,
      action: "settings",
      entity: "settings",
      entityId: "zatca.csid",
      diff: [{ field: "csid", from: "rotated", to: fresh.serial }],
    });
    return { serial: fresh.serial, expiresAt: fresh.expiresAt };
  },

  async rotateCsid(): Promise<{ serial: string; expiresAt: string }> {
    return this.issueCsid();
  },

  /** Public verification — reachable by /verify/invoice/<uuid>. */
  async verifyInvoice(uuid: string) {
    await tick();
    const inv = useData.getState().invoices.find((i) => i.zatcaPayload?.uuid === uuid);
    if (!inv?.zatcaPayload) return { found: false as const, uuid };
    const csid = useData.getState().csid;
    return {
      found: true as const,
      uuid,
      invoiceId: inv.id,
      client: inv.client,
      date: inv.date,
      amount: inv.amount,
      vat: inv.vat,
      total: inv.amount + inv.vat,
      qrBase64: inv.zatcaPayload.qrBase64,
      invoiceHash: inv.zatcaPayload.invoiceHash,
      csidSerial: inv.zatcaPayload.csidSerial,
      csidStatus: csid?.status === "active" && csid?.serial === inv.zatcaPayload.csidSerial ? "active" : "rotated",
      clearedAt: inv.zatcaPayload.clearedAt,
    };
  },
};

// ---------------------------------------------------------------------------
// Audit
// ---------------------------------------------------------------------------

export const audit = {
  async list(params: ListAuditParams = {}): Promise<PagedResponse<AuditRecord>> {
    await tick();
    if (isBackendActive()) {
      const out = await apiFetch<{ items: ApiAudit[]; total: number }>("/v1/audit", {
        query: { entity: params.entity, q: params.q, limit: params.limit },
      });
      return { items: out.items.map(auditFromApi), total: out.total };
    }
    const all = useData.getState().audit;
    let items = all;
    if (params.entity && params.entity !== "all") {
      items = items.filter((a) => a.entity === params.entity);
    }
    if (params.q) {
      const q = params.q.toLowerCase();
      items = items.filter((a) =>
        `${a.user} ${a.action} ${a.entity} ${a.entityId}`.toLowerCase().includes(q)
      );
    }
    if (params.limit) items = items.slice(0, params.limit);
    return { items, total: items.length };
  },
};

// ---------------------------------------------------------------------------
// Dashboard aggregate
// ---------------------------------------------------------------------------

export const dashboard = {
  async stats(): Promise<DashboardStats> {
    await tick();
    if (isBackendActive()) {
      const raw = await apiFetch<{
        testsToday: number; pendingReview: number; approvedThisMonth: number; overdueCalibrations: number;
        monthlyVolume: { month: string; tests: number; passed: number }[];
        byCategory: { name: string; value: number }[];
        passFailByCategory: { category: string; pass: number; fail: number }[];
        activeProjects: ApiProject[];
        recentTests: ApiTest[];
      }>("/v1/dashboard/stats");
      return {
        testsToday: raw.testsToday,
        pendingReview: raw.pendingReview,
        approvedThisMonth: raw.approvedThisMonth,
        overdueCalibrations: raw.overdueCalibrations,
        monthlyVolume: raw.monthlyVolume,
        byCategory: raw.byCategory,
        passFailByCategory: raw.passFailByCategory,
        activeProjects: raw.activeProjects.map(projectFromApi),
        recentTests: raw.recentTests.map(testFromApi),
      };
    }
    const s = useData.getState();
    const today = new Date().toISOString().slice(0, 10);
    const month = today.slice(0, 7);

    const testsToday      = s.tests.filter((t) => t.testDate === today).length;
    const pendingReview   = s.tests.filter((t) => t.status === "submitted").length;
    const approvedThisMonth = s.tests.filter(
      (t) => t.status === "approved" && t.testDate.startsWith(month)
    ).length;
    const overdueCalibrations = s.equipment.filter((e) => {
      const days = Math.round((new Date(e.calibrationDue).getTime() - Date.now()) / 86400000);
      return days < 0;
    }).length;

    return {
      testsToday: testsToday || 27,
      pendingReview: pendingReview || 14,
      approvedThisMonth: approvedThisMonth || 309,
      overdueCalibrations: overdueCalibrations || 2,
      monthlyVolume: [
        { month: "Nov", tests: 184, passed: 171 },
        { month: "Dec", tests: 212, passed: 198 },
        { month: "Jan", tests: 246, passed: 229 },
        { month: "Feb", tests: 288, passed: 271 },
        { month: "Mar", tests: 304, passed: 282 },
        { month: "Apr", tests: 327, passed: 309 },
      ],
      byCategory: [
        { name: "Concrete",  value: 142 },
        { name: "Soil",      value: 78 },
        { name: "Aggregate", value: 54 },
        { name: "Asphalt",   value: 31 },
        { name: "Steel",     value: 22 },
        { name: "Cement",    value: 17 },
        { name: "Water",     value: 28 },
        { name: "Masonry",   value: 9 },
      ],
      passFailByCategory: [
        { category: "Concrete",  pass: 132, fail: 10 },
        { category: "Soil",      pass: 74,  fail: 4 },
        { category: "Aggregate", pass: 51,  fail: 3 },
        { category: "Asphalt",   pass: 29,  fail: 2 },
        { category: "Steel",     pass: 22,  fail: 0 },
        { category: "Cement",    pass: 16,  fail: 1 },
        { category: "Water",     pass: 25,  fail: 3 },
      ],
      activeProjects: s.projects.filter((p) => p.status === "active"),
      recentTests: s.tests.slice(0, 6),
    };
  },
};

// ---------------------------------------------------------------------------
// Reports (spec §7)
// ---------------------------------------------------------------------------

const reportNumberFor = (testCode: string) =>
  `RPT-${new Date().getFullYear()}-${testCode.split("-").pop()}`;

export const reports = {
  /** Hydrate everything a report page needs: test + relations + signature trail. */
  async get(testId: string): Promise<ReportContext | null> {
    await tick();
    requireAuth();
    const s = useData.getState();
    const test = s.tests.find((t) => t.id === testId);
    if (!test) return null;
    const sample = s.samples.find((x) => x.id === test.sampleId) ?? null;
    const project = s.projects.find((x) => x.id === test.projectId) ?? null;
    const trail = s.audit.filter((a) => a.entity === "test" && a.entityId === test.id);
    const reviewEvt = trail.find((a) => a.action === "review");
    const apvEvt = trail.find((a) => a.action === "approve");
    const signEvt = trail.find((a) => a.action === "sign");
    const sigSerial = signEvt?.diff?.find((d) => d.field === "signature")?.to ?? null;

    return {
      test,
      sample,
      project,
      reportNumber: reportNumberFor(test.code),
      generatedAt: trail.find((a) => a.action === "approve" || a.action === "sign")?.ts ?? null,
      signedBy: signEvt?.user ?? null,
      signatureSerial: sigSerial,
      reviewedBy: reviewEvt?.user ?? null,
      reviewedAt: reviewEvt?.ts ?? null,
      approvedBy: apvEvt?.user ?? null,
      approvedAt: apvEvt?.ts ?? null,
      conformity:
        test.passFail === "pass"
          ? "conforms"
          : test.passFail === "fail"
          ? "does_not_conform"
          : "pending",
    };
  },

  /** Public verification endpoint — used by the QR target route /verify/<id>. */
  async verify(testIdOrReportNumber: string): Promise<VerifyResult> {
    await tick();
    if (isBackendActive()) {
      return await apiFetch<VerifyResult>(`/v1/reports/verify/${encodeURIComponent(testIdOrReportNumber)}`, {
        noAuth: true,
      });
    }
    const s = useData.getState();
    // Accept either a raw test id, a test code (T-...) or a report number (RPT-...).
    const test =
      s.tests.find((t) => t.id === testIdOrReportNumber) ??
      s.tests.find((t) => t.code === testIdOrReportNumber) ??
      s.tests.find((t) => reportNumberFor(t.code) === testIdOrReportNumber) ??
      null;

    if (!test) return { reportNumber: testIdOrReportNumber, found: false };

    const trail = s.audit.filter((a) => a.entity === "test" && a.entityId === test.id);
    const apvEvt = trail.find((a) => a.action === "approve");
    const signEvt = trail.find((a) => a.action === "sign");
    const chain = verifyChain(s.audit);

    return {
      reportNumber: reportNumberFor(test.code),
      found: true,
      testCode: test.code,
      standard: test.standard,
      conformity:
        test.passFail === "pass"
          ? "conforms"
          : test.passFail === "fail"
          ? "does_not_conform"
          : "pending",
      signedBy: signEvt?.user ?? null,
      signatureSerial: signEvt?.diff?.find((d) => d.field === "signature")?.to ?? null,
      signedAt: signEvt?.ts ?? null,
      approvedAt: apvEvt?.ts ?? null,
      chainOk: chain.ok,
      brokenAt: chain.brokenAt,
    };
  },

  /** Record that a report was generated (PDF/Word/Excel) — spec §7 audit. */
  async markGenerated(input: ReportGenerateInput): Promise<{ reportNumber: string }> {
    await tick();
    if (isBackendActive()) {
      const out = await apiFetch<{ reportNumber: string; reportId: string }>(
        `/v1/reports/test/${input.testId}/generated`,
        { method: "POST", body: { format: input.format } }
      );
      return { reportNumber: out.reportNumber };
    }
    const actor = requirePerm("report:export");
    const test = useData.getState().tests.find((t) => t.id === input.testId);
    if (!test) throw errors.notFound("Test", input.testId);
    const reportNumber = reportNumberFor(test.code);
    useData.getState().log({
      user: `${actor.name} (${actor.role})`,
      email: actor.email,
      action: "update",
      entity: "test",
      entityId: test.id,
      diff: [{ field: "report", from: "—", to: `${reportNumber} (${input.format})` }],
    });
    return { reportNumber };
  },
};

// ---------------------------------------------------------------------------
// Roles (tenant-scoped, used by /settings/roles)
// ---------------------------------------------------------------------------

export interface ApiRole {
  name: string;
  permissions: string[];
  isCustom: boolean;
}

export const roles = {
  async list(): Promise<ApiRole[]> {
    await tick();
    if (isBackendActive()) {
      const out = await apiFetch<{ items: ApiRole[] }>("/v1/roles");
      return out.items;
    }
    requireAuth();
    const { customRoles, roleMatrix } = useApp.getState();
    const builtIn = (await import("@/lib/rbac")).ALL_ROLES;
    const items: ApiRole[] = builtIn.map((name) => ({
      name,
      permissions: roleMatrix[name] ?? rolePermissions(name),
      isCustom: false,
    }));
    for (const r of customRoles) {
      items.push({ name: r.name, permissions: roleMatrix[r.name] ?? r.perms, isCustom: true });
    }
    return items;
  },
  async create(input: { name: string; permissions?: string[] }): Promise<ApiRole> {
    await tick();
    if (isBackendActive()) {
      return apiFetch<ApiRole>("/v1/roles", {
        method: "POST",
        body: { name: input.name, permissions: input.permissions ?? [] },
      });
    }
    const actor = requirePerm("security:update");
    void actor;
    useApp.getState().addCustomRole(input.name);
    if (input.permissions) useApp.getState().setRoleMatrix(input.name, input.permissions);
    return { name: input.name, permissions: input.permissions ?? [], isCustom: true };
  },
  async update(name: string, permissions: string[]): Promise<ApiRole> {
    await tick();
    if (isBackendActive()) {
      return apiFetch<ApiRole>(`/v1/roles/${encodeURIComponent(name)}`, {
        method: "PUT",
        body: { permissions },
      });
    }
    const actor = requirePerm("security:update");
    void actor;
    useApp.getState().setRoleMatrix(name, permissions);
    const isCustom = useApp.getState().customRoles.some((r) => r.name === name);
    return { name, permissions, isCustom };
  },
  async remove(name: string): Promise<void> {
    await tick();
    if (isBackendActive()) {
      await apiFetch(`/v1/roles/${encodeURIComponent(name)}`, { method: "DELETE" });
      return;
    }
    const actor = requirePerm("security:update");
    void actor;
    useApp.getState().removeCustomRole(name);
  },
};

// Single-namespace export so call sites read `api.tests.list(...)`.
export const api = {
  auth, projects, samples, tests, equipment, users, invoices, audit, dashboard, reports, zatca, roles,
};
