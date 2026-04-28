"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { sitesGeo } from "@/lib/mock-extra";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

const minLat = 16, maxLat = 33;
const minLng = 34, maxLng = 56;

const saudiPath =
  "M82,18 L92,15 L120,18 L160,28 L210,38 L262,52 L300,72 L322,108 L320,160 L300,210 L268,250 L250,290 L220,310 L180,302 L160,290 L138,300 L118,290 L100,272 L92,242 L82,200 L78,150 L80,90 L82,18 Z";

function project(lat: number, lng: number) {
  const x = ((lng - minLng) / (maxLng - minLng)) * 360 + 20;
  const y = 320 - ((lat - minLat) / (maxLat - minLat)) * 280;
  return { x, y };
}

const typeColor: Record<string, string> = {
  Concrete: "#2563eb",
  Soil: "#f59e0b",
  Aggregate: "#78716c",
  Asphalt: "#0f172a",
  Steel: "#71717a",
  Cement: "#a3a3a3",
  Masonry: "#c2410c",
  Water: "#0891b2",
};

export function SampleMap() {
  const tt = useT();
  const [hovered, setHovered] = useState<typeof sitesGeo[number] | null>(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="card p-4 lg:col-span-2 relative">
        <svg viewBox="0 0 400 360" className="w-full h-[500px]">
          <defs>
            <linearGradient id="sand" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#fef3c7" />
              <stop offset="100%" stopColor="#fde68a" />
            </linearGradient>
          </defs>
          <rect width="400" height="360" fill="rgb(186 230 253 / 0.3)" />
          <path d={saudiPath} fill="url(#sand)" stroke="#a16207" strokeWidth={1.5} className="dark:opacity-40" />
          {[20, 22, 24, 26, 28, 30].map((lat) => {
            const { y } = project(lat, minLng);
            return <line key={lat} x1={0} x2={400} y1={y} y2={y} stroke="rgb(var(--muted) / 0.15)" strokeDasharray="2 4" />;
          })}
          {[36, 40, 44, 48, 52].map((lng) => {
            const { x } = project(minLat, lng);
            return <line key={lng} x1={x} x2={x} y1={0} y2={360} stroke="rgb(var(--muted) / 0.15)" strokeDasharray="2 4" />;
          })}

          {sitesGeo.map((s) => {
            const { x, y } = project(s.lat, s.lng);
            const c = typeColor[s.type] ?? "#64748b";
            return (
              <g key={s.id} onMouseEnter={() => setHovered(s)} onMouseLeave={() => setHovered(null)} className="cursor-pointer">
                <circle cx={x} cy={y} r={10} fill={c} opacity={0.2} />
                <circle cx={x} cy={y} r={6} fill={c} stroke="white" strokeWidth={2} />
              </g>
            );
          })}

          <text x={project(24.7, 46.7).x + 8} y={project(24.7, 46.7).y - 8} fontSize={10} fill="rgb(var(--fg))">Riyadh</text>
          <text x={project(21.5, 39.2).x + 8} y={project(21.5, 39.2).y + 4} fontSize={10} fill="rgb(var(--fg))">Jeddah</text>
          <text x={project(26.4, 50.1).x + 8} y={project(26.4, 50.1).y + 4} fontSize={10} fill="rgb(var(--fg))">Dammam</text>
          <text x={project(28.0, 35.4).x + 8} y={project(28.0, 35.4).y - 8} fontSize={10} fill="rgb(var(--fg))">Tabuk / NEOM</text>
        </svg>

        {hovered && (
          <div className="absolute top-4 right-4 card p-3 text-xs w-60 pointer-events-none">
            <div className="font-mono">{hovered.code}</div>
            <div className="font-semibold mt-1">{hovered.type}</div>
            <div className="text-[rgb(var(--muted))]">{hovered.city}</div>
            <div className="text-[rgb(var(--muted))]">{hovered.lat.toFixed(2)}, {hovered.lng.toFixed(2)}</div>
            <div className="text-[rgb(var(--muted))]">{hovered.date}</div>
          </div>
        )}
      </div>

      <div className="card p-4 space-y-2">
        <h3 className="font-semibold mb-2">{tt("Locations")} ({sitesGeo.length})</h3>
        {sitesGeo.map((s) => {
          const c = typeColor[s.type] ?? "#64748b";
          return (
            <div key={s.id} className="flex items-start gap-2 text-sm py-1.5 border-b border-[rgb(var(--border))] last:border-0">
              <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: c }} />
              <div className="flex-1 min-w-0">
                <div className="font-mono text-xs">{s.code}</div>
                <div className="text-xs text-[rgb(var(--muted))]">{s.type} · {s.city}</div>
              </div>
              <div className={cn("text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded", "text-white")} style={{ background: c }}>
                {s.type}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
