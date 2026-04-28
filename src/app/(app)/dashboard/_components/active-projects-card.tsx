"use client";

import { useData } from "@/store/data-store";
import { useT } from "@/lib/i18n";
import { useLoc } from "@/lib/i18n-data";
import { useApp } from "@/store/app-store";
import { fmtAny } from "@/lib/utils";

export function ActiveProjectsCard() {
  const tt = useT();
  const loc = useLoc();
  const lang = useApp((s) => s.lang);
  const projects = useData((s) => s.projects);

  return (
    <div className="card p-5">
      <h3 className="font-semibold mb-3">{tt("Active projects")}</h3>
      <ul className="space-y-3">
        {projects.filter((p) => p.status === "active").map((p) => (
          <li key={p.id} className="text-sm">
            <div className="font-medium leading-tight">{loc(p.name)}</div>
            <div className="text-xs text-[rgb(var(--muted))] mt-0.5">
              {fmtAny(p.code, lang)} • {loc(p.city)} • {loc(p.client)}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
