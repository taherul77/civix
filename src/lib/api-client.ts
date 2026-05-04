"use client";

/**
 * Thin fetch wrapper for the CiviXLab backend (Fastify, spec §3).
 *
 * Reads the JWT from `useApp` so every request carries `Authorization:
 * Bearer <token>`. Base URL comes from `NEXT_PUBLIC_API_URL` (default
 * http://localhost:4000). Throws `BackendError` on non-2xx responses with
 * the `{ error: { code, message } }` envelope our routes return.
 */

import { useApp } from "@/store/app-store";

export class BackendError extends Error {
  status: number;
  code: string;
  detail: unknown;
  constructor(status: number, code: string, message: string, detail?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.detail = detail;
  }
}

const BASE_URL =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) ||
  "http://localhost:4000";

/** Returns true when the user has signed in against the real backend. */
export function isBackendActive(): boolean {
  return Boolean(useApp.getState().apiToken);
}

interface FetchOpts {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  /** Skip auth header — used for the public `/verify/...` endpoint. */
  noAuth?: boolean;
}

function buildUrl(path: string, query?: FetchOpts["query"]): string {
  const url = new URL(path.startsWith("http") ? path : `${BASE_URL}${path}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null || v === "") continue;
      url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

export async function apiFetch<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (!opts.noAuth) {
    const token = useApp.getState().apiToken;
    if (token) headers.authorization = `Bearer ${token}`;
  }
  const res = await fetch(buildUrl(path, opts.query), {
    method: opts.method ?? "GET",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    cache: "no-store",
  });
  const text = await res.text();
  const json = text ? safeJson(text) : null;

  if (!res.ok) {
    const env = (json && typeof json === "object" && "error" in (json as object))
      ? (json as { error: { code?: string; message?: string; detail?: unknown } }).error
      : null;

    // Auto sign-out on an expired / invalid JWT. Skipped for public routes
    // (noAuth) and for /v1/auth/* itself so a bad-password 401 doesn't kick
    // the user out of an in-flight signin.
    if (res.status === 401 && !opts.noAuth && !path.startsWith("/v1/auth/")) {
      handleAuthExpired();
    }

    throw new BackendError(
      res.status,
      env?.code ?? "HTTP_" + res.status,
      env?.message ?? `${opts.method ?? "GET"} ${path} failed (${res.status})`,
      env?.detail
    );
  }
  return json as T;
}

/** Module-scoped guard so a burst of parallel 401s only signs out once. */
let signingOut = false;
function handleAuthExpired(): void {
  if (signingOut) return;
  if (!useApp.getState().user && !useApp.getState().apiToken) return;
  signingOut = true;
  useApp.getState().signOut();
  if (typeof window !== "undefined") {
    // Use a hard navigation so any in-flight queries get cancelled along
    // with the page; the login form will pick up after.
    window.location.href = "/login";
  }
  // Reset the flag after a tick in case the redirect is intercepted.
  setTimeout(() => { signingOut = false; }, 1000);
}

function safeJson(text: string): unknown {
  try { return JSON.parse(text); } catch { return null; }
}
