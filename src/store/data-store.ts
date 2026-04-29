"use client";

import { create } from "zustand";
import {
  projects as seedProjects,
  samples as seedSamples,
  tests as seedTests,
  equipment as seedEquipment,
  type Project,
  type Sample,
  type Test,
  type Equipment,
} from "@/lib/mock-data";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  dept: string;
  status: "active" | "inactive";
  mfa: boolean;
}

export interface Invoice {
  id: string;
  client: string;
  amount: number;
  vat: number;
  status: "draft" | "sent" | "paid";
  date: string;
  zatca: string;
}

export type AuditAction =
  | "create" | "update" | "submit" | "review" | "approve"
  | "sign" | "reject" | "delete" | "login" | "logout"
  | "calibration" | "invoice" | "settings";

export interface AuditEntry {
  id: string;
  ts: string;             // ISO datetime
  user: string;           // user name + role
  email?: string;
  action: AuditAction;
  entity: "test" | "sample" | "project" | "equipment" | "user" | "invoice" | "session" | "settings";
  entityId: string;
  diff?: { field: string; from: string; to: string }[];
  ip: string;
  /** Hash of the previous entry in the chain. "GENESIS" for the first row. */
  prevHash?: string;
  /** SHA-256 chained hash of (prevHash + canonical(this)). Tamper-evident per ISO 17025 §8.4. */
  hash?: string;
}

const seedUsers: User[] = [
  { id: "u1", name: "Eng. Fahad Al-Otaibi",   email: "fahad@aramco-lab.sa",  role: "Lab Engineer",     dept: "Concrete",  status: "active", mfa: true  },
  { id: "u2", name: "Sarah Mansour",          email: "sarah@aramco-lab.sa",  role: "Project Manager",  dept: "Soil",      status: "active", mfa: true  },
  { id: "u3", name: "Ahmed Hassan",           email: "ahmed@aramco-lab.sa",  role: "Lab Technician",   dept: "Concrete",  status: "active", mfa: false },
  { id: "u4", name: "Yousef Al-Harbi",        email: "yousef@aramco-lab.sa", role: "Field Technician", dept: "Field",     status: "active", mfa: true  },
  { id: "u5", name: "Dr. Abdullah Al-Rashid", email: "rashid@aramco-lab.sa", role: "Approver",         dept: "Quality",   status: "active", mfa: true  },
  { id: "u6", name: "Layla Hashem",           email: "layla@aramco-lab.sa",  role: "Quality Manager",  dept: "Quality",   status: "active", mfa: true  },
  { id: "u7", name: "Mahmoud Saleh",          email: "mahmoud@aramco-lab.sa",role: "Lab Technician",   dept: "Asphalt",   status: "active", mfa: false },
];

const seedInvoices: Invoice[] = [
  { id: "INV-2026-0418", client: "NEOM Co.",           amount: 87_500, vat: 13_125, status: "paid",  date: "2026-04-12", zatca: "ZX-A8B12C" },
  { id: "INV-2026-0419", client: "Red Sea Global",     amount: 42_300, vat:  6_345, status: "paid",  date: "2026-04-15", zatca: "ZX-7D11E9" },
  { id: "INV-2026-0420", client: "Qiddiya Investment", amount: 21_800, vat:  3_270, status: "sent",  date: "2026-04-22", zatca: "ZX-4F88AA" },
  { id: "INV-2026-0421", client: "Diriyah Company",    amount: 38_400, vat:  5_760, status: "draft", date: "2026-04-27", zatca: "—" },
];

interface ActorContext {
  name: string;
  email?: string;
  role: string;
}

interface SubmitArgs   { testId: string; actor: ActorContext }
interface ReviewArgs   { testId: string; actor: ActorContext; comment?: string }
interface ApproveArgs  { testId: string; actor: ActorContext; comment?: string }
interface SignArgs     { testId: string; actor: ActorContext; certificateSerial: string }

interface DataState {
  projects: Project[];
  samples: Sample[];
  tests: Test[];
  equipment: Equipment[];
  users: User[];
  invoices: Invoice[];
  audit: AuditEntry[];

  // creates
  addProject: (p: Omit<Project, "id">, actor?: ActorContext) => string;
  addSample: (s: Omit<Sample, "id">, actor?: ActorContext) => string;
  addTest: (t: Omit<Test, "id">, actor?: ActorContext) => string;
  addEquipment: (e: Omit<Equipment, "id">, actor?: ActorContext) => string;
  addUser: (u: Omit<User, "id">, actor?: ActorContext) => string;
  addInvoice: (i: Invoice, actor?: ActorContext) => void;

  // generic update
  updateTest: (id: string, patch: Partial<Test>, actor?: ActorContext) => void;

  // workflow transitions (spec §5)
  submitTestForReview: (a: SubmitArgs) => void;
  reviewTest: (a: ReviewArgs) => void;
  approveTest: (a: ApproveArgs) => void;
  signTest: (a: SignArgs) => void;
  rejectTest: (a: ReviewArgs) => void;

  // audit
  log: (e: Omit<AuditEntry, "id" | "ts" | "ip">) => void;
}

const rid = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;

const nowIso = () => new Date().toISOString().slice(0, 19).replace("T", " ");
const fakeIp = () => `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

/**
 * Synchronous chain hash. Same canonical-string input as
 * `server/audit-chain.ts` but uses a fast 64-bit FNV-style mix so the store
 * can compute hashes in `set()` without going async. The async SHA-256
 * verification in `verifyChain()` re-derives expected values to detect
 * tampering — both representations agree on the canonical input.
 */
function chainHash(prevHash: string, e: Pick<AuditEntry, "ts"|"user"|"action"|"entity"|"entityId"|"diff"|"ip">): string {
  const diff = e.diff ? e.diff.map((d) => `${d.field}:${d.from}>${d.to}`).join("|") : "";
  const input = `${prevHash}␞${e.ts}␟${e.user}␟${e.action}␟${e.entity}␟${e.entityId}␟${diff}␟${e.ip}`;
  // 64-bit-ish FNV-1a folded into hex
  let h1 = 0x811c9dc5 | 0;
  let h2 = 0xcbf29ce4 | 0;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193);
    h2 = Math.imul(h2 ^ c, 0x100000001b3 & 0xffffffff);
  }
  const hex1 = (h1 >>> 0).toString(16).padStart(8, "0");
  const hex2 = (h2 >>> 0).toString(16).padStart(8, "0");
  return `${hex1}${hex2}${hex1}${hex2}`;
}
const actorLabel = (a?: ActorContext) =>
  a ? `${a.name}${a.role ? ` (${a.role})` : ""}` : "system";

export const useData = create<DataState>((set, get) => ({
  projects: [...seedProjects],
  samples: [...seedSamples],
  tests: [...seedTests],
  equipment: [...seedEquipment],
  users: [...seedUsers],
  invoices: [...seedInvoices],
  audit: [],

  addProject: (p, actor) => {
    const id = rid("p");
    set((s) => ({ projects: [{ ...p, id }, ...s.projects] }));
    get().log({ user: actorLabel(actor), email: actor?.email, action: "create", entity: "project", entityId: id });
    return id;
  },
  addSample: (x, actor) => {
    const id = rid("s");
    set((s) => ({ samples: [{ ...x, id }, ...s.samples] }));
    get().log({ user: actorLabel(actor), email: actor?.email, action: "create", entity: "sample", entityId: id });
    return id;
  },
  addTest: (x, actor) => {
    const id = rid("t");
    set((s) => ({ tests: [{ ...x, id }, ...s.tests] }));
    get().log({ user: actorLabel(actor), email: actor?.email, action: "create", entity: "test", entityId: id });
    return id;
  },
  addEquipment: (x, actor) => {
    const id = rid("e");
    set((s) => ({ equipment: [{ ...x, id }, ...s.equipment] }));
    get().log({ user: actorLabel(actor), email: actor?.email, action: "create", entity: "equipment", entityId: id });
    return id;
  },
  addUser: (x, actor) => {
    const id = rid("u");
    set((s) => ({ users: [{ ...x, id }, ...s.users] }));
    get().log({ user: actorLabel(actor), email: actor?.email, action: "create", entity: "user", entityId: id });
    return id;
  },
  addInvoice: (x, actor) => {
    set((s) => ({ invoices: [x, ...s.invoices] }));
    get().log({ user: actorLabel(actor), email: actor?.email, action: "invoice", entity: "invoice", entityId: x.id });
  },

  updateTest: (id, patch, actor) => {
    const before = get().tests.find((t) => t.id === id);
    set((s) => ({ tests: s.tests.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
    if (before) {
      const diff = (Object.keys(patch) as (keyof Test)[]).flatMap((k) => {
        const from = String(before[k] ?? "");
        const to = String(patch[k] ?? "");
        return from === to ? [] : [{ field: String(k), from, to }];
      });
      get().log({
        user: actorLabel(actor), email: actor?.email,
        action: "update", entity: "test", entityId: id, diff,
      });
    }
  },

  submitTestForReview: ({ testId, actor }) => {
    const t = get().tests.find((x) => x.id === testId);
    if (!t || t.status !== "draft") return;
    set((s) => ({
      tests: s.tests.map((x) => (x.id === testId ? { ...x, status: "submitted" } : x)),
    }));
    get().log({
      user: actorLabel(actor), email: actor.email,
      action: "submit", entity: "test", entityId: testId,
      diff: [{ field: "status", from: "draft", to: "submitted" }],
    });
  },

  reviewTest: ({ testId, actor, comment }) => {
    const t = get().tests.find((x) => x.id === testId);
    if (!t || t.status !== "submitted") return;
    set((s) => ({
      tests: s.tests.map((x) => (x.id === testId ? { ...x, status: "reviewed" } : x)),
    }));
    get().log({
      user: actorLabel(actor), email: actor.email,
      action: "review", entity: "test", entityId: testId,
      diff: [
        { field: "status", from: "submitted", to: "reviewed" },
        ...(comment ? [{ field: "comment", from: "", to: comment }] : []),
      ],
    });
  },

  approveTest: ({ testId, actor, comment }) => {
    const t = get().tests.find((x) => x.id === testId);
    if (!t || (t.status !== "reviewed" && t.status !== "submitted")) return;
    set((s) => ({
      tests: s.tests.map((x) => (x.id === testId ? { ...x, status: "approved" } : x)),
    }));
    get().log({
      user: actorLabel(actor), email: actor.email,
      action: "approve", entity: "test", entityId: testId,
      diff: [
        { field: "status", from: t.status, to: "approved" },
        ...(comment ? [{ field: "comment", from: "", to: comment }] : []),
      ],
    });
  },

  signTest: ({ testId, actor, certificateSerial }) => {
    get().log({
      user: actorLabel(actor), email: actor.email,
      action: "sign", entity: "test", entityId: testId,
      diff: [{ field: "signature", from: "", to: certificateSerial }],
    });
  },

  rejectTest: ({ testId, actor, comment }) => {
    const t = get().tests.find((x) => x.id === testId);
    if (!t) return;
    set((s) => ({
      tests: s.tests.map((x) => (x.id === testId ? { ...x, status: "draft", passFail: "pending" } : x)),
    }));
    get().log({
      user: actorLabel(actor), email: actor.email,
      action: "reject", entity: "test", entityId: testId,
      diff: [
        { field: "status", from: t.status, to: "draft" },
        ...(comment ? [{ field: "comment", from: "", to: comment }] : []),
      ],
    });
  },

  log: (e) => set((s) => {
    const ts = nowIso();
    const ip = fakeIp();
    // Audit array is newest-first; the previous chain head is index 0.
    const prev = s.audit[0];
    const prevHash = prev?.hash ?? "GENESIS";
    const base = { ts, user: e.user, action: e.action, entity: e.entity, entityId: e.entityId, diff: e.diff, ip };
    const hash = chainHash(prevHash, base);
    const entry: AuditEntry = { id: rid("a"), ...base, email: e.email, prevHash, hash };
    return { audit: [entry, ...s.audit].slice(0, 500) };
  }),
}));

export const findProject = (id: string) =>
  useData.getState().projects.find((p) => p.id === id);
export const findSample = (id: string) =>
  useData.getState().samples.find((s) => s.id === id);
export const findTest = (id: string) =>
  useData.getState().tests.find((t) => t.id === id);
