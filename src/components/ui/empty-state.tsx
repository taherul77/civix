import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

/** Friendly placeholder for charts/lists with no data yet. */
export function EmptyState({
  title,
  hint,
  icon: Icon = Inbox,
  height = 260,
}: {
  title: string;
  hint?: string;
  icon?: LucideIcon;
  height?: number;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--bg))]/40 px-6"
      style={{ minHeight: height }}
    >
      <div className="w-11 h-11 rounded-2xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-300 flex items-center justify-center mb-3">
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-sm font-semibold">{title}</div>
      {hint && <div className="text-xs text-[rgb(var(--muted))] mt-1 max-w-xs">{hint}</div>}
    </div>
  );
}

/** Pulse placeholder shown while a query is loading. */
export function ChartSkeleton({ height = 260 }: { height?: number }) {
  return <div className="rounded-xl bg-[rgb(var(--hover))] animate-pulse" style={{ height }} />;
}
