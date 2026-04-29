"use client";

import { hasPermission, type Permission } from "@/lib/rbac";
import { getActor } from "@/lib/auth-context";
import { errors } from "@/server/errors";

/**
 * Server-side permission gate. Throws `ApiError` (`UNAUTHENTICATED` /
 * `FORBIDDEN`) if the current actor cannot perform `perm`.
 *
 * Returns the resolved actor so call sites can use it without re-fetching.
 *
 * The companion `useCan(perm)` hook in `lib/auth-context.ts` hides the UI
 * affordance, but real enforcement happens here — exactly the way a Fastify
 * preHandler will check permissions when the backend lands.
 */
export function require(perm: Permission) {
  const actor = getActor();
  if (!actor) throw errors.unauthenticated();
  if (!hasPermission(actor.role, perm)) throw errors.forbidden(perm);
  return actor;
}

/** Permissive variant — for read endpoints that anyone signed-in can hit. */
export function requireAuth() {
  const actor = getActor();
  if (!actor) throw errors.unauthenticated();
  return actor;
}
