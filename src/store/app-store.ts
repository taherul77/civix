"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Lang } from "@/lib/i18n";

type Theme = "light" | "dark";

interface SessionUser {
  email: string;
  name: string;
  role: string;
  tenant: string;
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
      setLang: (lang) => set({ lang }),
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      signIn: (user) => set({ user, pendingSignIn: null }),
      signOut: () => set({ user: null, pendingSignIn: null, apiToken: null, apiTenantSubdomain: null }),
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
    }),
    { name: "civixlab-app" }
  )
);
