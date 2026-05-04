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

/** Hook: returns true if the signed-in user has `perm`. Super Admin bypasses
 *  every check so the platform owner always has full access regardless of the
 *  JWT permissions list or any tenant role customization. */
export function useCan(perm: Permission): boolean {
  const role = useApp((s) => s.user?.role);
  const isSuperAdmin = useApp((s) => s.user?.isSuperAdmin ?? false);
  if (isSuperAdmin) return true;
  return hasPermission(role, perm);
}

/** Imperative read — for store actions called outside React. */
export function getActor(): Actor | null {
  const u = useApp.getState().user;
  if (!u) return null;
  return { name: u.name, email: u.email, role: u.role };
}
