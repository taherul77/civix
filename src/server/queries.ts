"use client";

/**
 * Typed query/mutation hooks for the API service layer.
 *
 * Every hook fetches from the backend through `api.*`. There are no local
 * mock fallbacks — pages either show real DB data or surface the error
 * thrown by api.ts when the user is not signed in to the backend.
 */

import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/store/app-store";
import { api } from "@/server/api";
import { subscribeInvalidation, topicFromKey } from "@/server/invalidation";
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
  AuditRecord,
} from "@/server/contracts";

interface QueryResult<T> {
  data: T | undefined;
  isLoading: boolean;
  error: Error | null;
  /** Manually trigger a refetch — useful after a mutation. */
  refetch?: () => void;
}

const ok = <T,>(data: T): QueryResult<T> => ({ data, isLoading: false, error: null });

/**
 * Generic async-fetch hook. Re-runs whenever `key` changes or `refetch()`
 * is called. Returns a TanStack-Query-shaped result so call sites can move
 * to React Query later without changing.
 */
function useApiQuery<T>(
  fetcher: () => Promise<T>,
  key: string,
  extraTopics: string[] = [],
): QueryResult<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    setIsLoading(true);
    setError(null);
    fetcher()
      .then((d) => { if (alive) setData(d); })
      .catch((e: unknown) => { if (alive) setError(e instanceof Error ? e : new Error(String(e))); })
      .finally(() => { if (alive) setIsLoading(false); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, tick]);

  // Refetch when any subscribed topic is invalidated by a mutation.
  useEffect(() => {
    const topics = Array.from(new Set([topicFromKey(key), ...extraTopics]));
    const bump = () => setTick((t) => t + 1);
    const unsubs = topics.map((t) => subscribeInvalidation(t, bump));
    return () => { for (const u of unsubs) u(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, extraTopics.join("|")]);

  return { data, isLoading, error, refetch: () => setTick((t) => t + 1) };
}

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
  const key = JSON.stringify(params);
  const q = useApiQuery(() => api.projects.list(params).then((r) => r.items), `projects:${key}`);
  return q;
}

export function useProjectQuery(id: string | undefined): QueryResult<ProjectRecord | null> {
  const q = useApiQuery(
    () => (id ? api.projects.get(id) : Promise.resolve(null)),
    `project:${id ?? ""}`,
  );
  return q;
}

// ---------- Samples ----------

export function useSamplesQuery(params: ListSamplesParams = {}): QueryResult<SampleRecord[]> {
  const key = JSON.stringify(params);
  const q = useApiQuery(() => api.samples.list(params).then((r) => r.items), `samples:${key}`);
  return q;
}

export function useSampleQuery(id: string | undefined): QueryResult<SampleRecord | null> {
  const q = useApiQuery(
    () => (id ? api.samples.get(id) : Promise.resolve(null)),
    `sample:${id ?? ""}`,
  );
  return q;
}

// ---------- Tests ----------

export function useTestsQuery(params: ListTestsParams = {}): QueryResult<TestRecord[]> {
  const key = JSON.stringify(params);
  const q = useApiQuery(() => api.tests.list(params).then((r) => r.items), `tests:${key}`);
  return q;
}

export function useTestQuery(id: string | undefined): QueryResult<TestRecord | null> {
  const q = useApiQuery(
    () => (id ? api.tests.get(id) : Promise.resolve(null)),
    `test:${id ?? ""}`,
  );
  return q;
}

// ---------- Equipment ----------

export function useEquipmentQuery(): QueryResult<EquipmentRecord[]> {
  const q = useApiQuery(() => api.equipment.list().then((r) => r.items), "equipment");
  return q;
}

// ---------- Users ----------

export function useUsersQuery(): QueryResult<UserRecord[]> {
  const q = useApiQuery(() => api.users.list().then((r) => r.items), "users");
  return q;
}

// ---------- Invoices ----------
// No /v1/invoices endpoint yet — invoices are still local-only state
// (created via api.invoices.create which writes to the zustand store).
// This hook reads that local list directly until the backend lands.

import { useData as _useData } from "@/store/data-store";
import type { InvoiceRecord } from "@/server/contracts";
export function useInvoicesQuery(): QueryResult<InvoiceRecord[]> {
  const all = _useData((s) => s.invoices);
  return ok(all);
}

// ---------- Clients (master setup) ----------

import type { ApiClient } from "@/server/api";
export function useClientsQuery(): QueryResult<ApiClient[]> {
  return useApiQuery(() => api.clients.list(), "clients");
}

// ---------- Audit ----------

export function useAuditQuery(params: ListAuditParams = {}): QueryResult<AuditRecord[]> {
  const key = JSON.stringify(params);
  const q = useApiQuery(() => api.audit.list(params).then((r) => r.items), `audit:${key}`);
  return q;
}

// ---------- Dashboard aggregate ----------

export function useDashboardQuery(): QueryResult<DashboardStats> {
  const q = useApiQuery(() => api.dashboard.stats(), "dashboard");
  return q;
}

// ---------- Mutations ----------

export const useApi = () => api;
