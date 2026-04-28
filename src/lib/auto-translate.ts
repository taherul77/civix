"use client";

/**
 * Self-hosted runtime auto-translator with persistent localStorage cache.
 *
 * Default provider: LibreTranslate (https://libretranslate.com) — fully open
 * source, runs in your own Docker container, no rate limits, no API keys.
 *
 *   docker run -ti --rm -p 5000:5000 libretranslate/libretranslate \
 *     --load-only en,ar
 *
 * Then the app uses http://localhost:5000/translate. Configure via env:
 *
 *   NEXT_PUBLIC_TRANSLATE_URL=http://localhost:5000/translate
 *   NEXT_PUBLIC_TRANSLATE_API_KEY=<optional>
 *
 * Strategy (layered):
 *  1. Static dictionary (i18n.ts) — hand-curated, fastest, best quality
 *  2. Bilingual API field { en, ar } — server-provided, ideal long term
 *  3. LibreTranslate self-hosted — your own translation engine, no limits
 *  4. Graceful fallback to MyMemory free tier if LibreTranslate is offline
 *
 * Translations cache forever in localStorage. Each phrase is translated
 * once per browser, then served from cache.
 */

import { useEffect, useState, useSyncExternalStore } from "react";
import { useApp } from "@/store/app-store";

// -----------------------------------------------------------------------
//  Configuration
// -----------------------------------------------------------------------

const LIBRETRANSLATE_URL =
  process.env.NEXT_PUBLIC_TRANSLATE_URL ?? "http://localhost:5000/translate";
const LIBRETRANSLATE_API_KEY = process.env.NEXT_PUBLIC_TRANSLATE_API_KEY ?? "";

// Set to false to disable the public-API fallback entirely (offline mode).
const ALLOW_PUBLIC_FALLBACK = true;

// -----------------------------------------------------------------------
//  Cache + subscriber registry
// -----------------------------------------------------------------------

type CacheKey = `${"en" | "ar"}::${string}`;

const memCache: Map<CacheKey, string> = new Map();
const pending: Map<CacheKey, Promise<string>> = new Map();
const STORAGE_KEY = "civixlab-translation-cache-v1";

const subscribers = new Set<() => void>();
const subscribe = (cb: () => void): (() => void) => {
  subscribers.add(cb);
  return () => { subscribers.delete(cb); };
};

let cacheTick = 0;
const getTick = () => cacheTick;
const getServerTick = () => 0;
const notify = () => {
  cacheTick++;
  subscribers.forEach((cb) => cb());
};

function loadCache() {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const obj = JSON.parse(raw) as Record<string, string>;
    for (const [k, v] of Object.entries(obj)) memCache.set(k as CacheKey, v);
  } catch { /* bad JSON */ }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
function saveCache() {
  if (typeof window === "undefined") return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      const obj: Record<string, string> = {};
      memCache.forEach((v, k) => { obj[k] = v; });
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    } catch { /* quota / disabled */ }
  }, 400);
}

let cacheLoaded = false;
function ensureCacheLoaded() {
  if (!cacheLoaded) {
    loadCache();
    cacheLoaded = true;
  }
}

// -----------------------------------------------------------------------
//  Heuristics — what NOT to translate
// -----------------------------------------------------------------------

const ARABIC_RE = /[؀-ۿ]/;
const NON_TRANSLATABLE_RE = /^[A-Z0-9\-_·.\/:%°#\s,]+$/i;

const looksArabic = (s: string) => ARABIC_RE.test(s);
function shouldSkip(s: string) {
  const t = s.trim();
  if (t.length < 2) return true;
  if (NON_TRANSLATABLE_RE.test(t)) return true;
  return false;
}

// -----------------------------------------------------------------------
//  Provider 1: LibreTranslate (self-hosted, default)
// -----------------------------------------------------------------------

let libreTranslateBroken = false;     // turns true if the server is unreachable
let libreTranslateChecked = false;

async function tryLibreTranslate(text: string, source: "en" | "ar", target: "en" | "ar"): Promise<string | null> {
  if (libreTranslateBroken) return null;
  try {
    const r = await fetch(LIBRETRANSLATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: text,
        source,
        target,
        format: "text",
        ...(LIBRETRANSLATE_API_KEY ? { api_key: LIBRETRANSLATE_API_KEY } : {}),
      }),
      signal: AbortSignal.timeout(8000),
    });
    libreTranslateChecked = true;
    if (!r.ok) {
      // 5xx / 429 — keep trying, just return null this once
      return null;
    }
    const j = await r.json();
    const out = j?.translatedText;
    if (typeof out === "string" && out.length > 0) return out;
    return null;
  } catch {
    if (!libreTranslateChecked) libreTranslateBroken = true;  // server not running
    return null;
  }
}

// -----------------------------------------------------------------------
//  Provider 2: Public fallback (only if explicitly allowed)
// -----------------------------------------------------------------------

async function tryMyMemory(text: string, source: "en" | "ar", target: "en" | "ar"): Promise<string | null> {
  if (!ALLOW_PUBLIC_FALLBACK) return null;
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${source}|${target}`;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) return null;
    const j = await r.json();
    const out = j?.responseData?.translatedText;
    return typeof out === "string" && out.length > 0 ? out : null;
  } catch {
    return null;
  }
}

// -----------------------------------------------------------------------
//  Engine
// -----------------------------------------------------------------------

async function fetchTranslation(text: string, source: "en" | "ar", target: "en" | "ar"): Promise<string> {
  // 1. self-hosted LibreTranslate
  const fromLibre = await tryLibreTranslate(text, source, target);
  if (fromLibre) return fromLibre;
  // 2. graceful fallback (optional)
  const fromPublic = await tryMyMemory(text, source, target);
  if (fromPublic) return fromPublic;
  // 3. give up — return original
  return text;
}

/** Async version — awaits the actual translation. */
export async function translateText(text: string, target: "en" | "ar"): Promise<string> {
  ensureCacheLoaded();
  if (!text || shouldSkip(text)) return text;
  if (target === "ar" && looksArabic(text)) return text;
  if (target === "en" && !looksArabic(text)) return text;

  const key: CacheKey = `${target}::${text}`;
  if (memCache.has(key)) return memCache.get(key)!;
  if (pending.has(key)) return pending.get(key)!;

  const source: "en" | "ar" = target === "ar" ? "en" : "ar";
  const promise = fetchTranslation(text, source, target).then((translated) => {
    memCache.set(key, translated);
    saveCache();
    pending.delete(key);
    notify();
    return translated;
  });
  pending.set(key, promise);
  notify();
  return promise;
}

/**
 * Synchronous: returns cached translation if available, else returns the
 * original text and fires a background fetch (next render picks it up).
 */
export function translateSync(text: string, target: "en" | "ar"): string {
  ensureCacheLoaded();
  if (!text || shouldSkip(text)) return text;
  if (target === "ar" && looksArabic(text)) return text;
  if (target === "en" && !looksArabic(text)) return text;

  const key: CacheKey = `${target}::${text}`;
  const cached = memCache.get(key);
  if (cached) return cached;

  if (!pending.has(key)) void translateText(text, target);
  return text;
}

// -----------------------------------------------------------------------
//  React integration
// -----------------------------------------------------------------------

export function useTranslationTick(): number {
  return useSyncExternalStore(subscribe, getTick, getServerTick);
}

export function useAutoTranslate(text: string | null | undefined): string {
  const lang = useApp((s) => s.lang);
  useTranslationTick();
  return translateSync(text ?? "", lang);
}

export function usePendingCount(): number {
  const [count, setCount] = useState(pending.size);
  useEffect(() => {
    const unsubscribe = subscribe(() => setCount(pending.size));
    return unsubscribe;
  }, []);
  return count;
}

/** True if the LibreTranslate server has failed at least once this session. */
export function useTranslateProviderHealth(): { libreOnline: boolean } {
  const [libreOnline, setLibreOnline] = useState(!libreTranslateBroken);
  useEffect(() => {
    const unsubscribe = subscribe(() => setLibreOnline(!libreTranslateBroken));
    return unsubscribe;
  }, []);
  return { libreOnline };
}

export function clearAutoTranslateCache() {
  memCache.clear();
  if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
  notify();
}
