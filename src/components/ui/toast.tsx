"use client";

import { create } from "zustand";
import { useEffect } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "info" | "success" | "warn" | "error";

interface ToastItem {
  id: string;
  tone: Tone;
  title: string;
  detail?: string;
  ts: number;
}

interface ToastState {
  items: ToastItem[];
  push: (t: Omit<ToastItem, "id" | "ts">) => void;
  dismiss: (id: string) => void;
}

const useToastStore = create<ToastState>((set) => ({
  items: [],
  push: (t) =>
    set((s) => ({
      items: [...s.items, { ...t, id: Math.random().toString(36).slice(2), ts: Date.now() }],
    })),
  dismiss: (id) => set((s) => ({ items: s.items.filter((x) => x.id !== id) })),
}));

export const toast = {
  info:    (title: string, detail?: string) => useToastStore.getState().push({ tone: "info",    title, detail }),
  success: (title: string, detail?: string) => useToastStore.getState().push({ tone: "success", title, detail }),
  warn:    (title: string, detail?: string) => useToastStore.getState().push({ tone: "warn",    title, detail }),
  error:   (title: string, detail?: string) => useToastStore.getState().push({ tone: "error",   title, detail }),
};

export function ToastViewport() {
  const items = useToastStore((s) => s.items);
  const dismiss = useToastStore((s) => s.dismiss);

  useEffect(() => {
    if (items.length === 0) return;
    const timers = items.map((t) =>
      setTimeout(() => dismiss(t.id), t.tone === "error" ? 6000 : 3500)
    );
    return () => { timers.forEach(clearTimeout); };
  }, [items, dismiss]);

  if (items.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[80] space-y-2 w-[360px] max-w-[calc(100vw-2rem)]">
      {items.map((t) => {
        // Dark-mode toasts now use solid backgrounds + a tinted left border
        // so they read clearly against any page underneath.
        const cfg = {
          info: {
            Icon: Info,
            tone: "border-sky-300 bg-sky-50 text-sky-900 dark:border-sky-700 dark:bg-sky-900 dark:text-sky-50",
            iconTone: "text-sky-600 dark:text-sky-300",
          },
          success: {
            Icon: CheckCircle2,
            tone: "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-900 dark:text-emerald-50",
            iconTone: "text-emerald-600 dark:text-emerald-300",
          },
          warn: {
            Icon: AlertCircle,
            tone: "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-900 dark:text-amber-50",
            iconTone: "text-amber-600 dark:text-amber-300",
          },
          error: {
            Icon: AlertCircle,
            tone: "border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-700 dark:bg-rose-900 dark:text-rose-50",
            iconTone: "text-rose-600 dark:text-rose-200",
          },
        }[t.tone];
        return (
          <div
            key={t.id}
            className={cn(
              "rounded-lg border shadow-lg p-3 flex items-start gap-2 backdrop-blur-none",
              "dark:shadow-black/40",
              cfg.tone,
            )}
          >
            <cfg.Icon className={cn("w-4 h-4 mt-0.5 shrink-0", cfg.iconTone)} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold leading-tight">{t.title}</div>
              {t.detail && <div className="text-xs mt-1 opacity-90">{t.detail}</div>}
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="opacity-70 hover:opacity-100"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
