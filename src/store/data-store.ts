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

interface DataState {
  projects: Project[];
  samples: Sample[];
  tests: Test[];
  equipment: Equipment[];
  users: User[];
  invoices: Invoice[];
  addProject: (p: Omit<Project, "id">) => void;
  addSample: (s: Omit<Sample, "id">) => void;
  addTest: (t: Omit<Test, "id">) => void;
  addEquipment: (e: Omit<Equipment, "id">) => void;
  addUser: (u: Omit<User, "id">) => void;
  addInvoice: (i: Invoice) => void;
  updateTest: (id: string, patch: Partial<Test>) => void;
}

const rid = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;

export const useData = create<DataState>((set) => ({
  projects: [...seedProjects],
  samples: [...seedSamples],
  tests: [...seedTests],
  equipment: [...seedEquipment],
  users: [...seedUsers],
  invoices: [...seedInvoices],
  addProject: (p) => set((s) => ({ projects: [{ ...p, id: rid("p") }, ...s.projects] })),
  addSample:  (x) => set((s) => ({ samples:  [{ ...x, id: rid("s") }, ...s.samples] })),
  addTest:    (x) => set((s) => ({ tests:    [{ ...x, id: rid("t") }, ...s.tests] })),
  addEquipment:(x)=> set((s) => ({ equipment:[{ ...x, id: rid("e") }, ...s.equipment] })),
  addUser:    (x) => set((s) => ({ users:    [{ ...x, id: rid("u") }, ...s.users] })),
  addInvoice: (x) => set((s) => ({ invoices: [x, ...s.invoices] })),
  updateTest: (id, patch) => set((s) => ({
    tests: s.tests.map((t) => (t.id === id ? { ...t, ...patch } : t)),
  })),
}));

export const findProject = (id: string) =>
  useData.getState().projects.find((p) => p.id === id);
export const findSample = (id: string) =>
  useData.getState().samples.find((s) => s.id === id);
export const findTest = (id: string) =>
  useData.getState().tests.find((t) => t.id === id);
