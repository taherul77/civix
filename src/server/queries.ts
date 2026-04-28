"use client";

/**
 * Typed query/mutation hooks for the API service layer.
 *
 * Today: each hook subscribes to the relevant slice of the Zustand store and
 * synchronously re-derives a result via the matching `api.*` function. The
 * shape matches TanStack Query (`{ data, isLoading, error }`) so the swap to
 * the real `useQuery` (spec §2) is mechanical.
 */

import { useEffect, useMemo, useState } from "react";
import { useData } from "@/store/data-store";
import { useApp } from "@/store/app-store";
import { api } from "@/server/api";
import type {
  DashboardStats,
  ListAuditParams,
  ListProjectsParams,
  ListSamplesParams,
  ListTestsParams,
  ProjectRecord,
  SampleRecord,
  SessionRecord,
  TestRecord,
  EquipmentRecord,
  UserRecord,
  InvoiceRecord,
  AuditRecord,
} from "@/server/contracts";

interface QueryResult<T> {
  data: T | undefined;
  isLoading: boolean;
  error: Error | null;
}

const ok = <T,>(data: T): QueryResult<T> => ({ data, isLoading: false, error: null });

// ---------- Auth ----------

export function useSession(): QueryResult<SessionRecord | null> {
  const user = useApp((s) => s.user);
  return useMemo(() => {
    if (!user) return ok(null);
    return ok({
      email: user.email,
      name: user.name,
      role: user.role,
      tenant: user.tenant,
      permissions: [],
    });
  }, [user]);
}

// ---------- Projects ----------

export function useProjectsQuery(params: ListProjectsParams = {}): QueryResult<ProjectRecord[]> {
  const all = useData((s) => s.projects);
  const key = JSON.stringify(params);
  return useMemo(() => {
    void key;
    return ok(filterProjects(all, params));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, key]);
}

export function useProjectQuery(id: string | undefined): QueryResult<ProjectRecord | null> {
  const project = useData((s) => s.projects.find((p) => p.id === id));
  return ok(project ?? null);
}

// ---------- Samples ----------

export function useSamplesQuery(params: ListSamplesParams = {}): QueryResult<SampleRecord[]> {
  const all = useData((s) => s.samples);
  const key = JSON.stringify(params);
  return useMemo(() => {
    void key;
    return ok(filterSamples(all, params));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, key]);
}

export function useSampleQuery(id: string | undefined): QueryResult<SampleRecord | null> {
  const sample = useData((s) => s.samples.find((x) => x.id === id));
  return ok(sample ?? null);
}

// ---------- Tests ----------

export function useTestsQuery(params: ListTestsParams = {}): QueryResult<TestRecord[]> {
  const all = useData((s) => s.tests);
  const key = JSON.stringify(params);
  return useMemo(() => {
    void key;
    return ok(filterTests(all, params));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, key]);
}

export function useTestQuery(id: string | undefined): QueryResult<TestRecord | null> {
  const test = useData((s) => s.tests.find((x) => x.id === id));
  return ok(test ?? null);
}

// ---------- Equipment ----------

export function useEquipmentQuery(): QueryResult<EquipmentRecord[]> {
  const all = useData((s) => s.equipment);
  return ok(all);
}

// ---------- Users ----------

export function useUsersQuery(): QueryResult<UserRecord[]> {
  const all = useData((s) => s.users);
  return ok(all);
}

// ---------- Invoices ----------

export function useInvoicesQuery(): QueryResult<InvoiceRecord[]> {
  const all = useData((s) => s.invoices);
  return ok(all);
}

// ---------- Audit ----------

export function useAuditQuery(params: ListAuditParams = {}): QueryResult<AuditRecord[]> {
  const all = useData((s) => s.audit);
  const key = JSON.stringify(params);
  return useMemo(() => {
    void key;
    let items = all;
    if (params.entity && params.entity !== "all") items = items.filter((a) => a.entity === params.entity);
    if (params.q) {
      const q = params.q.toLowerCase();
      items = items.filter((a) =>
        `${a.user} ${a.action} ${a.entity} ${a.entityId}`.toLowerCase().includes(q)
      );
    }
    if (params.limit) items = items.slice(0, params.limit);
    return ok(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, key]);
}

// ---------- Dashboard aggregate ----------

export function useDashboardQuery(): QueryResult<DashboardStats> {
  const [data, setData] = useState<DashboardStats>();
  // Re-fetch the snapshot whenever any of the source slices change.
  const sig = useData((s) => `${s.tests.length}|${s.projects.length}|${s.equipment.length}`);
  useEffect(() => {
    let alive = true;
    api.dashboard.stats().then((d) => { if (alive) setData(d); });
    return () => { alive = false; };
  }, [sig]);
  return { data, isLoading: !data, error: null };
}

// ---------- Mutations ----------

export const useApi = () => api;

// ---------------------------------------------------------------------------
// Internal filters (mirror the bodies in api.ts so client-side derivations stay
// snappy without an async hop).
// ---------------------------------------------------------------------------

const locStr = (v: unknown) => {
  if (typeof v === "string") return v;
  if (v && typeof v === "object") {
    const o = v as { en?: string; ar?: string };
    return `${o.en ?? ""} ${o.ar ?? ""}`;
  }
  return "";
};

function filterProjects(all: ProjectRecord[], p: ListProjectsParams) {
  return all.filter((x) => {
    if (p.status && p.status !== "all" && x.status !== p.status) return false;
    if (p.q) {
      const hay = `${x.code} ${locStr(x.name)} ${locStr(x.client)} ${locStr(x.city)}`.toLowerCase();
      if (!hay.includes(p.q.toLowerCase())) return false;
    }
    return true;
  });
}

function filterSamples(all: SampleRecord[], p: ListSamplesParams) {
  return all.filter((s) => {
    if (p.type && p.type !== "all" && s.type !== p.type) return false;
    if (p.projectId && s.projectId !== p.projectId) return false;
    if (p.q) {
      const hay = `${s.code} ${locStr(s.location)} ${locStr(s.sampledBy)}`.toLowerCase();
      if (!hay.includes(p.q.toLowerCase())) return false;
    }
    return true;
  });
}

function filterTests(all: TestRecord[], p: ListTestsParams) {
  return all.filter((t) => {
    if (p.status   && p.status   !== "all" && t.status   !== p.status)   return false;
    if (p.category && p.category !== "all" && t.category !== p.category) return false;
    if (p.projectId && t.projectId !== p.projectId) return false;
    if (p.sampleId && t.sampleId !== p.sampleId) return false;
    if (p.q) {
      const hay = `${t.code} ${locStr(t.name)} ${t.standard}`.toLowerCase();
      if (!hay.includes(p.q.toLowerCase())) return false;
    }
    return true;
  });
}
