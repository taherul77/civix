import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string | number;
  delta?: { value: string; trend: "up" | "down" | "flat" };
  icon: LucideIcon;
  tone?: "brand" | "emerald" | "sunset" | "ocean" | "rose";
}

const toneMap: Record<NonNullable<Props["tone"]>, { gradient: string; ring: string }> = {
  brand:   { gradient: "bg-brand-gradient",   ring: "shadow-glow" },
  ocean:   { gradient: "bg-ocean-gradient",   ring: "shadow-[0_8px_24px_-8px_rgba(6,182,212,0.45)]" },
  emerald: { gradient: "bg-emerald-gradient", ring: "shadow-[0_8px_24px_-8px_rgba(16,185,129,0.45)]" },
  sunset:  { gradient: "bg-sunset-gradient",  ring: "shadow-[0_8px_24px_-8px_rgba(245,158,11,0.45)]" },
  rose:    { gradient: "bg-rose-gradient",    ring: "shadow-glow-pink" },
};

export function KpiCard({ label, value, delta, icon: Icon, tone = "brand" }: Props) {
  const t = toneMap[tone];
  return (
    <div className="card p-5 glow-card relative overflow-hidden group hover:-translate-y-0.5 transition-transform">
      <div className="flex items-start justify-between">
        <div className="relative z-10">
          <div className="text-xs uppercase tracking-wider text-[rgb(var(--muted))] font-semibold">
            {label}
          </div>
          <div className="text-3xl font-bold mt-2 tracking-tight">{value}</div>
          {delta && (
            <div
              className={cn(
                "mt-2 inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full",
                delta.trend === "up" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
                delta.trend === "down" && "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
                delta.trend === "flat" && "bg-slate-100 text-slate-600 dark:bg-slate-700/40 dark:text-slate-400"
              )}
            >
              {delta.trend === "up" ? "▲" : delta.trend === "down" ? "▼" : "—"} {delta.value}
            </div>
          )}
        </div>
        <div
          className={cn(
            "w-12 h-12 rounded-2xl grid place-items-center text-white",
            t.gradient,
            t.ring,
            "group-hover:scale-110 transition-transform"
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
