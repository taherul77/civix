"use client";

import { ApiError } from "@/server/errors";
import { BackendError } from "@/lib/api-client";
import { toast } from "@/components/ui/toast";

/**
 * Wrap a service-layer call so `ApiError`/`BackendError`s surface as a toast
 * and the call resolves to `null` instead of bubbling. Other errors still
 * propagate.
 *
 *   const created = await mutate(() => api.tests.create(input));
 *   if (!created) return; // permission denied / validation — toast already shown
 */
export async function mutate<T>(fn: () => Promise<T>, successMsg?: string): Promise<T | null> {
  try {
    const result = await fn();
    if (successMsg) toast.success(successMsg);
    return result;
  } catch (e) {
    if (e instanceof ApiError) {
      const tone = e.code === "FORBIDDEN" || e.code === "UNAUTHENTICATED" ? "warn" : "error";
      const t = tone === "warn" ? toast.warn : toast.error;
      t(e.message, e.detail);
      return null;
    }
    if (e instanceof BackendError) {
      const tone = e.status === 401 || e.status === 403 ? "warn" : "error";
      const t = tone === "warn" ? toast.warn : toast.error;
      const detail = typeof e.detail === "string" ? e.detail : undefined;
      t(e.message, detail);
      return null;
    }
    throw e;
  }
}
