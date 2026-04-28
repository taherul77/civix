"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, ChevronRight, FlaskConical, Wrench, Beaker } from "lucide-react";
import { events } from "@/lib/mock-extra";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

const typeMap: Record<string, { color: string; icon: typeof FlaskConical }> = {
  test: { color: "bg-brand-500", icon: FlaskConical },
  calibration: { color: "bg-amber-500", icon: Wrench },
  sampling: { color: "bg-emerald-500", icon: Beaker },
};

function startOfMonth(date: Date) { return new Date(date.getFullYear(), date.getMonth(), 1); }
function endOfMonth(date: Date) { return new Date(date.getFullYear(), date.getMonth() + 1, 0); }
function fmt(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function CalendarGrid() {
  const tt = useT();
  const [cursor, setCursor] = useState(new Date(2026, 3, 1));
  const monthLabel = cursor.toLocaleString(undefined, { month: "long", year: "numeric" });

  const start = startOfMonth(cursor);
  const end = endOfMonth(cursor);
  const startDay = start.getDay();
  const daysInMonth = end.getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
  while (cells.length % 7 !== 0) cells.push(null);

  const today = new Date(2026, 3, 28);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="btn btn-ghost p-2"><ChevronLeft className="w-4 h-4" /></button>
          <h2 className="text-lg font-semibold">{monthLabel}</h2>
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="btn btn-ghost p-2"><ChevronRight className="w-4 h-4" /></button>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {(Object.keys(typeMap) as (keyof typeof typeMap)[]).map((k) => (
            <span key={k} className="flex items-center gap-1.5 capitalize">
              <span className={cn("w-2.5 h-2.5 rounded-full", typeMap[k].color)} />
              {tt(k.charAt(0).toUpperCase() + k.slice(1))}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-[rgb(var(--border))] rounded-lg overflow-hidden">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
          <div key={d} className="bg-[rgb(var(--card))] text-xs font-semibold p-2 text-center text-[rgb(var(--muted))]">{d}</div>
        ))}
        {cells.map((d, i) => {
          const key = d ? fmt(d) : `pad-${i}`;
          const dayEvents = d ? events.filter((e) => e.date === fmt(d)) : [];
          const isToday = d && fmt(d) === fmt(today);
          return (
            <div
              key={key}
              className={cn(
                "bg-[rgb(var(--card))] min-h-[110px] p-2",
                !d && "opacity-30",
                isToday && "ring-2 ring-brand-500 ring-inset"
              )}
            >
              {d && (
                <>
                  <div className={cn("text-xs font-semibold mb-1", isToday && "text-brand-600")}>
                    {d.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.map((e) => {
                      const t = typeMap[e.type];
                      const className = cn(
                        "block text-[10px] px-1.5 py-1 rounded text-white truncate",
                        t.color,
                        e.href && "hover:opacity-90 cursor-pointer"
                      );
                      const inner = (
                        <>
                          <t.icon className="w-2.5 h-2.5 inline-block mr-1 -mt-0.5" />
                          {e.title}
                        </>
                      );
                      return e.href ? (
                        <Link key={e.id} href={e.href} className={className}>{inner}</Link>
                      ) : (
                        <div key={e.id} className={className}>{inner}</div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
