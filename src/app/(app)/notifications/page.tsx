"use client";

import Link from "next/link";
import { AlertTriangle, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { notifications } from "@/lib/mock-extra";
import { cn } from "@/lib/utils";

const cfg = {
  info:    { icon: Info,           tone: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900" },
  warn:    { icon: AlertTriangle,  tone: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900" },
  error:   { icon: AlertCircle,    tone: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900" },
  success: { icon: CheckCircle2,   tone: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900" },
};

export default function NotificationsPage() {
  const unread = notifications.filter((n) => !n.read).length;
  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications & alerts"
        description={`${unread} unread · escalations route to Quality Manager.`}
        actions={<button className="btn btn-outline">Mark all read</button>}
      />

      <div className="space-y-3">
        {notifications.map((n) => {
          const c = cfg[n.level];
          const Wrapper: React.ElementType = n.href ? Link : "div";
          return (
            <Wrapper
              key={n.id}
              href={n.href ?? "#"}
              className={cn(
                "card p-4 flex items-start gap-3 border-l-4",
                n.level === "error" && "border-l-rose-500",
                n.level === "warn" && "border-l-amber-500",
                n.level === "success" && "border-l-emerald-500",
                n.level === "info" && "border-l-sky-500",
                n.href && "hover:shadow-md transition-shadow cursor-pointer"
              )}
            >
              <div className={cn("w-9 h-9 rounded-lg grid place-items-center shrink-0", c.tone)}>
                <c.icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold">{n.title}</div>
                  <div className="text-xs text-[rgb(var(--muted))]">{n.ts}</div>
                </div>
                <div className="text-sm text-[rgb(var(--fg))]/80 mt-1">{n.body}</div>
              </div>
              {!n.read && <div className="w-2 h-2 rounded-full bg-brand-600 mt-2 shrink-0" />}
            </Wrapper>
          );
        })}
      </div>
    </div>
  );
}
