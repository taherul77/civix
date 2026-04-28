"use client";

import { useApp } from "@/store/app-store";
import { tr, type Lang } from "@/lib/i18n";

/**
 * A localized string from the API or DB. Three accepted shapes:
 *
 *   - "Plain English string"                       -> fallback path; will be
 *                                                     looked up in the static
 *                                                     dictionary, then returned
 *                                                     as-is if not found.
 *   - { en: "...", ar: "..." }                     -> explicit bilingual
 *                                                     object. Server-driven.
 *   - { en?: "...", ar?: "..." }                   -> partial; missing language
 *                                                     falls back to the other.
 *   - null / undefined                             -> returns supplied fallback.
 */
export type LocStr =
  | string
  | { en?: string; ar?: string }
  | null
  | undefined;

/**
 * Pick the right language from a localised value.
 * - For { en, ar } objects:  returns the matching language, falling back to
 *   the other one if missing.
 * - For plain strings:       runs through the static dictionary so existing
 *   English literals still get translated where we have a mapping.
 */
export function pick(lang: Lang, v: LocStr, fallback = ""): string {
  if (v == null) return fallback;
  if (typeof v === "string") return tr(lang, v);
  return v[lang] ?? v.en ?? v.ar ?? fallback;
}

/** Hook bound to current language. Use inside client components. */
export function useLoc() {
  const lang = useApp((s) => s.lang);
  return (v: LocStr, fallback = "") => pick(lang, v, fallback);
}

/**
 * Recommended API response shape for any user-editable text field:
 *
 *   GET /api/projects/p1
 *   {
 *     "id": "p1",
 *     "code": "PRJ-2026-001",
 *     "name":   { "en": "NEOM The Line — Module 4", "ar": "ذا لاين نيوم — الوحدة 4" },
 *     "client": { "en": "NEOM Co.",                "ar": "شركة نيوم" },
 *     "city":   { "en": "Tabuk",                   "ar": "تبوك" },
 *     "engineer": { "en": "Eng. Khalid Al-Otaibi", "ar": "م. خالد العتيبي" }
 *   }
 *
 * The DB stores both columns:
 *
 *   CREATE TABLE projects (
 *     id           UUID PRIMARY KEY,
 *     code         TEXT NOT NULL,
 *     name_en      TEXT NOT NULL,
 *     name_ar      TEXT,
 *     client_en    TEXT,
 *     client_ar    TEXT,
 *     ...
 *   );
 *
 * The API serializer just emits { en, ar } objects from those columns.
 *
 * If you can't dual-store yet (e.g. legacy English-only data), the helper
 * also accepts plain strings and runs them through the static dictionary,
 * so adding `name: "Tabuk"` still resolves to "تبوك" in Arabic mode.
 */
