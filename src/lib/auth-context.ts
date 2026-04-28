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

/** Hook: returns true if the signed-in user has `perm`. */
export function useCan(perm: Permission): boolean {
  const role = useApp((s) => s.user?.role);
  return hasPermission(role, perm);
}

/** Imperative read — for store actions called outside React. */
export function getActor(): Actor | null {
  const u = useApp.getState().user;
  if (!u) return null;
  return { name: u.name, email: u.email, role: u.role };
}
