"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Lang } from "@/lib/i18n";

type Theme = "light" | "dark";

interface AppState {
  lang: Lang;
  theme: Theme;
  sidebarCollapsed: boolean;
  user: { email: string; name: string; role: string; tenant: string } | null;
  setLang: (l: Lang) => void;
  setTheme: (t: Theme) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (c: boolean) => void;
  signIn: (u: { email: string; name: string; role: string; tenant: string }) => void;
  signOut: () => void;
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      lang: "en",
      theme: "light",
      sidebarCollapsed: false,
      user: null,
      setLang: (lang) => set({ lang }),
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      signIn: (user) => set({ user }),
      signOut: () => set({ user: null }),
    }),
    { name: "civixlab-app" }
  )
);
