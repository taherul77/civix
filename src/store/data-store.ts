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

  log: (e) => set((s) => ({
    audit: [
      { id: rid("a"), ts: nowIso(), ip: fakeIp(), ...e },
      ...s.audit,
    ].slice(0, 500),
  })),
}));

export const findProject = (id: string) =>
  useData.getState().projects.find((p) => p.id === id);
export const findSample = (id: string) =>
  useData.getState().samples.find((s) => s.id === id);
export const findTest = (id: string) =>
  useData.getState().tests.find((t) => t.id === id);
