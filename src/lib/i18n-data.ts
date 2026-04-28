"use client";

import { useApp } from "@/store/app-store";
import { tr, type Lang } from "@/lib/i18n";
import { translateSync, useTranslationTick } from "@/lib/auto-translate";

/**
 * A localized string from the API or DB. Three accepted shapes:
 *
 *   - "Plain English string"      -> static dict, then auto-translated
 *   - { en: "...", ar: "..." }    -> bilingual object from the API
 *   - { en?, ar? }                -> partial; missing language falls back
 *   - null / undefined            -> returns supplied fallback
 *
 * The picker resolves them in three layers:
 *   1) bilingual object with the target language     (best)
 *   2) static dictionary (i18n.ts hand-curated map)  (good)
 *   3) auto-translate cache (fires a fetch if cold)  (fallback)
 */
export type LocStr =
  | string
  | { en?: string; ar?: string }
  | null
  | undefined;

/** Pure pick — sync, no React hooks. Safe to call from anywhere. */
export function pick(lang: Lang, v: LocStr, fallback = ""): string {
  if (v == null) return fallback;

  // (1) explicit bilingual object
  if (typeof v !== "string") {
    const direct = v[lang];
    if (direct) return direct;
    const other = v.en ?? v.ar ?? fallback;
    // try static dict on the other-language string, then auto-translate
    const dict = tr(lang, other);
    if (dict !== other) return dict;
    return translateSync(other, lang);
  }

  // (2) static dictionary
  const fromDict = tr(lang, v);
  if (fromDict !== v) return fromDict;

  // (3) auto-translate cache (fire-and-forget if cold)
  return translateSync(v, lang);
}

/**
 * Hook: returns a `loc(value)` function bound to current language. The
 * component re-renders automatically whenever the auto-translate cache
 * fills in a new translation, so any uncached strings will update without
 * extra plumbing.
 */
export function useLoc() {
  const lang = useApp((s) => s.lang);
  useTranslationTick(); // subscribe — re-render when translations arrive
  return (v: LocStr, fallback = ""): string => pick(lang, v, fallback);
}
