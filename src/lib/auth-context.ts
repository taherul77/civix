"use client";

import { useApp } from "@/store/app-store";
import { hasPermission, type Permission } from "@/lib/rbac";

export interface Actor {
  name: string;
  email: string;
  role: string;
}

/** Return the current signed-in user as an Actor, or null when signed out. */
export function useActor(): Actor | null {
  const user = useApp((s) => s.user);
  if (!user) return null;
  return { name: user.name, email: user.email, role: user.role };
}

type PermUser = { role: string; isSuperAdmin?: boolean; permissions?: string[] } | null | undefined;

/** The single permission rule (used by useCan and the API-layer guard).
 *  Super Admin bypasses; otherwise the backend's permission list is the truth (tenant-defined roles are
 *  not in the built-in table); sessions saved before that list existed fall back to the role-name table. */
export function userCan(user: PermUser, perm: Permission): boolean {
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  if (user.permissions) return user.permissions.includes(perm);
  return hasPermission(user.role, perm);
}

/** Hook: returns true if the signed-in user has `perm`. */
export function useCan(perm: Permission): boolean {
  const user = useApp((s) => s.user);
  return userCan(user, perm);
}

/** Imperative read — for store actions called outside React. */
export function getActor(): Actor | null {
  const u = useApp.getState().user;
  if (!u) return null;
  return { name: u.name, email: u.email, role: u.role };
}
