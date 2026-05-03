"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Lang } from "@/lib/i18n";
import {
  type AllRolePermissions,
  type PageAction,
  type RolePagePermissions,
  defaultRolePermissions,
} from "@/lib/page-catalog";

type Theme = "light" | "dark";

interface SessionUser {
  email: string;
  name: string;
  role: string;
  tenant: string;
  isSuperAdmin?: boolean;
}

interface AppState {
  lang: Lang;
  theme: Theme;
  sidebarCollapsed: boolean;
  user: SessionUser | null;

  // Backend auth token (JWT minted by /v1/auth/signin) + active tenant
  // subdomain — both null when working against the in-memory mock.
  apiToken: string | null;
  apiTenantSubdomain: string | null;

  // MFA enrolment per email — TOTP secret + recovery codes.
  // Persisted in zustand `persist` along with the rest of the store.
  mfa: Record<string, { secret: string; recoveryCodes: string[]; enrolledAt: string }>;

  // Pending signin awaiting MFA challenge (cleared on success/cancel).
  pendingSignIn: SessionUser | null;

  // Per-role page permissions: { roleName: { pageId: { view, create, edit, delete } } }
  // Roles not present here fall back to `defaultRolePermissions()` (view-only on every page).
  // "Super Admin" and "Tenant Admin" implicitly grant everything regardless of state.
  pagePermissions: AllRolePermissions;

  // Tenant-scoped Role Management state (cleared on signOut so each tenant
  // session gets its own matrix). roleMatrix overrides the rbac.ts defaults
  // per role; entries absent here fall back to rolePermissions(role).
  roleMatrix: Record<string, string[]>;
  customRoles: Array<{ name: string; perms: string[] }>;

  setLang: (l: Lang) => void;
  setTheme: (t: Theme) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (c: boolean) => void;
  signIn: (u: SessionUser) => void;
  signOut: () => void;
  setApiToken: (token: string | null, tenantSubdomain?: string | null) => void;

  startMfaChallenge: (u: SessionUser) => void;
  cancelMfaChallenge: () => void;

  enrolMfa: (email: string, secret: string, recoveryCodes: string[]) => void;
  consumeRecoveryCode: (email: string, code: string) => boolean;
  clearMfa: (email: string) => void;

  setRoleMatrix: (role: string, perms: string[]) => void;
  addCustomRole: (name: string) => void;
  removeCustomRole: (name: string) => void;

  setRolePagePermissions: (role: string, perms: RolePagePermissions) => void;
  resetRolePagePermissions: (role: string) => void;
  hasPageAction: (role: string | null | undefined, pageId: string, action: PageAction) => boolean;
  /** Replace the entire pagePermissions map from a flat list returned by /v1/role-permissions. */
  hydratePagePermissions: (
    items: Array<{ role: string; pageId: string; view: boolean; create: boolean; edit: boolean; delete: boolean }>
  ) => void;
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      lang: "en",
      theme: "light",
      sidebarCollapsed: false,
      user: null,
      apiToken: null,
      apiTenantSubdomain: null,
      mfa: {},
      pendingSignIn: null,
      pagePermissions: {},
      roleMatrix: {},
      customRoles: [],
      setLang: (lang) => set({ lang }),
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      signIn: (user) => set({ user, pendingSignIn: null }),
      signOut: () => set({
        user: null,
        pendingSignIn: null,
        apiToken: null,
        apiTenantSubdomain: null,
        // Drop the per-tenant page-permission matrix so the next user (in a
        // possibly different tenant) doesn't briefly see the previous user's
        // matrix before their hydration completes.
        pagePermissions: {},
        roleMatrix: {},
        customRoles: [],
      }),
      setApiToken: (apiToken, apiTenantSubdomain = null) =>
        set({ apiToken, apiTenantSubdomain: apiTenantSubdomain ?? get().apiTenantSubdomain }),

      startMfaChallenge: (pendingSignIn) => set({ pendingSignIn, user: null }),
      cancelMfaChallenge: () => set({ pendingSignIn: null }),

      enrolMfa: (email, secret, recoveryCodes) =>
        set((s) => ({
          mfa: { ...s.mfa, [email]: { secret, recoveryCodes, enrolledAt: new Date().toISOString() } },
        })),
      consumeRecoveryCode: (email, code) => {
        const rec = get().mfa[email];
        if (!rec) return false;
        const norm = code.trim().toUpperCase();
        const idx = rec.recoveryCodes.indexOf(norm);
        if (idx === -1) return false;
        const next = rec.recoveryCodes.filter((_, i) => i !== idx);
        set((s) => ({ mfa: { ...s.mfa, [email]: { ...rec, recoveryCodes: next } } }));
        return true;
      },
      clearMfa: (email) =>
        set((s) => {
          const next = { ...s.mfa };
          delete next[email];
          return { mfa: next };
        }),

      setRoleMatrix: (role, perms) =>
        set((s) => ({ roleMatrix: { ...s.roleMatrix, [role]: perms } })),
      addCustomRole: (name) =>
        set((s) =>
          s.customRoles.some((r) => r.name === name)
            ? s
            : { customRoles: [...s.customRoles, { name, perms: [] }] },
        ),
      removeCustomRole: (name) =>
        set((s) => {
          const nextMatrix = { ...s.roleMatrix };
          delete nextMatrix[name];
          return {
            customRoles: s.customRoles.filter((r) => r.name !== name),
            roleMatrix: nextMatrix,
          };
        }),

      setRolePagePermissions: (role, perms) =>
        set((s) => ({ pagePermissions: { ...s.pagePermissions, [role]: perms } })),
      resetRolePagePermissions: (role) =>
        set((s) => {
          const next = { ...s.pagePermissions };
          delete next[role];
          return { pagePermissions: next };
        }),
      hasPageAction: (role, pageId, action) => {
        if (!role) return false;
        // Super Admin is the only role that bypasses the matrix entirely.
        // Tenant Admin follows the matrix like every other role — they
        // default to view-everything but can be restricted from
        // /settings/permissions if a Super Admin chooses to.
        if (role === "Super Admin") return true;
        const stored = get().pagePermissions[role];
        const perms = stored ?? defaultRolePermissions();
        const pageEntry = perms[pageId];
        return !!pageEntry?.[action];
      },
      hydratePagePermissions: (items) => {
        const next: AllRolePermissions = {};
        for (const it of items) {
          if (!next[it.role]) next[it.role] = {};
          next[it.role][it.pageId] = {
            view: it.view, create: it.create, edit: it.edit, delete: it.delete,
          };
        }
        set({ pagePermissions: next });
      },
    }),
    { name: "civixlab-app" }
  )
);
