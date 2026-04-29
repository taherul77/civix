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
import { require as requirePerm, requireAuth } from "@/server/guard";
import { errors } from "@/server/errors";
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
  PagedResponse,
  ProjectRecord,
  SampleRecord,
  SessionRecord,
  SignInInput,
  SignInput,
  TestRecord,
  UserRecord,
  AuditRecord,
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

  async signIn(input: SignInInput): Promise<SessionRecord> {
    await tick();
    if (!input.email || !input.password) throw errors.validation("Email and password required");
    const name = input.email
      .split("@")[0]
      .split(".")
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" ");
    useApp.getState().signIn({ email: input.email, name, role: input.role, tenant: input.tenant });
    useData.getState().log({
      user: `${name} (${input.role})`,
      email: input.email,
      action: "login",
      entity: "session",
      entityId: input.email,
    });
    return {
      email: input.email,
      name,
      role: input.role,
      tenant: input.tenant,
      permissions: rolePermissions(input.role),
    };
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
    useApp.getState().signOut();
  },
};

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export const projects = {
  async list(params: ListProjectsParams = {}): Promise<PagedResponse<ProjectRecord>> {
    await tick();
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
    requireAuth();
    return useData.getState().projects.find((p) => p.id === id) ?? null;
  },
  async create(input: CreateProjectInput): Promise<ProjectRecord> {
    await tick();
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
    requireAuth();
    return useData.getState().samples.find((s) => s.id === id) ?? null;
  },
  async create(input: CreateSampleInput): Promise<SampleRecord> {
    await tick();
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
    requireAuth();
    return useData.getState().tests.find((t) => t.id === id) ?? null;
  },

  async create(input: CreateTestInput): Promise<TestRecord> {
    await tick();
    const actor = requirePerm("test:create");
    const id = useData.getState().addTest(input, actor);
    return { ...input, id };
  },

  async submit(id: string): Promise<void> {
    await tick();
    const actor = requirePerm("test:submit");
    const t = useData.getState().tests.find((x) => x.id === id);
    if (!t) throw errors.notFound("Test", id);
    if (t.status !== "draft") throw errors.conflict(`Test ${id} cannot be submitted from status "${t.status}"`);
    useData.getState().submitTestForReview({ testId: id, actor });
  },

  async review(id: string, opts: WorkflowComment = {}): Promise<void> {
    await tick();
    const actor = requirePerm("test:review");
    const t = useData.getState().tests.find((x) => x.id === id);
    if (!t) throw errors.notFound("Test", id);
    if (t.status !== "submitted") throw errors.conflict(`Test ${id} cannot be reviewed from status "${t.status}"`);
    useData.getState().reviewTest({ testId: id, actor, comment: opts.comment });
  },

  async approve(id: string, opts: WorkflowComment = {}): Promise<void> {
    await tick();
    const actor = requirePerm("test:approve");
    const t = useData.getState().tests.find((x) => x.id === id);
    if (!t) throw errors.notFound("Test", id);
    if (t.status === "approved") throw errors.conflict(`Test ${id} is already approved.`);
    useData.getState().approveTest({ testId: id, actor, comment: opts.comment });
  },

  async sign(id: string, input: SignInput): Promise<void> {
    await tick();
    const actor = requirePerm("test:sign");
    const t = useData.getState().tests.find((x) => x.id === id);
    if (!t) throw errors.notFound("Test", id);
    if (!input.certificateSerial) throw errors.validation("Certificate serial required for signing");
    useData.getState().signTest({ testId: id, actor, certificateSerial: input.certificateSerial });
  },

  async reject(id: string, opts: WorkflowComment = {}): Promise<void> {
    await tick();
    const actor = requirePerm("test:review");
    const t = useData.getState().tests.find((x) => x.id === id);
    if (!t) throw errors.notFound("Test", id);
    useData.getState().rejectTest({ testId: id, actor, comment: opts.comment });
  },
};

// ---------------------------------------------------------------------------
// Equipment
// ---------------------------------------------------------------------------

export const equipment = {
  async list(): Promise<PagedResponse<EquipmentRecord>> {
    await tick();
    requireAuth();
    const items = useData.getState().equipment;
    return { items, total: items.length };
  },
  async create(input: CreateEquipmentInput): Promise<EquipmentRecord> {
    await tick();
    const actor = requirePerm("equipment:create");
    const id = useData.getState().addEquipment(input, actor);
    return { ...input, id };
  },
};

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export const users = {
  async list(): Promise<PagedResponse<UserRecord>> {
    await tick();
    requireAuth();
    const items = useData.getState().users;
    return { items, total: items.length };
  },
  async invite(input: InviteUserInput): Promise<UserRecord> {
    await tick();
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
  async create(input: CreateInvoiceInput): Promise<InvoiceRecord> {
    await tick();
    const actor = requirePerm("billing:create");
    useData.getState().addInvoice(input, actor);
    return input;
  },
};

// ---------------------------------------------------------------------------
// Audit
// ---------------------------------------------------------------------------

export const audit = {
  async list(params: ListAuditParams = {}): Promise<PagedResponse<AuditRecord>> {
    await tick();
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

// Single-namespace export so call sites read `api.tests.list(...)`.
export const api = {
  auth, projects, samples, tests, equipment, users, invoices, audit, dashboard,
};
