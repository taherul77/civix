"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { Search, ArrowRight, Sparkles, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { catalog, categoryMeta, type CatalogEntry } from "@/lib/test-catalog";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

type Cat = CatalogEntry["category"] | "all" | "saudi";

export default function NewTestPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Cat>("all");
  const tt = useT();

  const cats: { id: Cat; label: string; count: number }[] = useMemo(() => {
    const all = catalog.length;
    const saudi = catalog.filter((c) => c.saudiSpecific).length;
    const byCat = (Object.keys(categoryMeta) as CatalogEntry["category"][]).map((c) => ({
      id: c as Cat,
      label: categoryMeta[c].label,
      count: catalog.filter((e) => e.category === c).length,
    }));
    return [
      { id: "all", label: "All", count: all },
      { id: "saudi", label: "Saudi-specific", count: saudi },
      ...byCat,
    ];
  }, []);

  const filtered = catalog.filter((c) => {
    if (cat === "saudi" && !c.saudiSpecific) return false;
    if (cat !== "all" && cat !== "saudi" && c.category !== cat) return false;
    if (q && !`${c.code} ${c.name} ${c.standard} ${c.description}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="New test"
        description="Choose from the curated catalog of 75 tests for the Middle East."
      />

      <div className="card p-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))]" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={tt("Search by name, code, or standard…")}
            className="input pl-9"
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {cats.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                cat === c.id
                  ? "bg-brand-600 border-brand-600 text-white"
                  : "border-[rgb(var(--border))] hover:bg-[rgb(var(--border))]"
              )}
            >
              {c.id === "saudi" && <ShieldCheck className="w-3 h-3" />}
              {tt(c.label)}
              <span className={cn("px-1.5 rounded-full text-[10px]", cat === c.id ? "bg-white/20" : "bg-[rgb(var(--border))]")}>
                {c.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((t) => {
          const meta = categoryMeta[t.category];
          const className = cn(
            "card p-5 group relative overflow-hidden transition-all",
            t.formRoute && "hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
          );
          const inner = (
            <>
              <div
                className={cn(
                  "absolute -right-12 -top-12 w-32 h-32 rounded-full bg-gradient-to-br opacity-10 group-hover:opacity-20 transition-opacity",
                  meta.tone
                )}
              />
              <div className="flex items-start justify-between gap-3">
                <div
                  className={cn(
                    "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-white bg-gradient-to-r",
                    meta.tone
                  )}
                >
                  {tt(meta.label)}
                </div>
                {t.saudiSpecific && (
                  <span className="badge badge-pass inline-flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> {tt("Saudi")}
                  </span>
                )}
              </div>

              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-mono text-xs text-[rgb(var(--muted))]">{t.code}</span>
                <h3 className="font-semibold leading-tight">{t.name}</h3>
              </div>
              <div className="text-xs text-[rgb(var(--muted))] mt-1">{t.standard}</div>
              <p className="text-sm mt-3 text-[rgb(var(--fg))]/80 line-clamp-2">{t.description}</p>

              <div className="mt-4 flex items-center justify-between">
                {t.formRoute ? (
                  <span className="text-sm font-medium text-brand-600 group-hover:gap-2 inline-flex items-center gap-1 transition-all">
                    {tt("Start test")} <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                ) : (
                  <span className="text-xs text-[rgb(var(--muted))] inline-flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> {tt("Coming soon")}
                  </span>
                )}
              </div>
            </>
          );
          return t.formRoute ? (
            <Link key={t.code} href={t.formRoute} className={className}>{inner}</Link>
          ) : (
            <div key={t.code} className={className}>{inner}</div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="card p-10 text-center text-[rgb(var(--muted))]">
          {tt("No tests match your filters.")}
        </div>
      )}
    </div>
  );
}
