import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number, decimals = 2) {
  if (Number.isNaN(n) || !Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatDate(d: string | Date) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

const arabicNumerals = ["٠","١","٢","٣","٤","٥","٦","٧","٨","٩"];

/** Convert ASCII digits inside any string to Arabic-Indic digits. */
export function toArDigits(s: string | number): string {
  return String(s).replace(/[0-9]/g, (d) => arabicNumerals[+d]);
}

/** Locale-aware integer / decimal formatter that also flips digits in Arabic. */
export function fmtNum(n: number, lang: "en" | "ar"): string {
  if (lang === "ar") return toArDigits(n.toLocaleString("ar-SA"));
  return n.toLocaleString();
}

/** Locale-aware currency display (SAR / ر.س). */
export function fmtSAR(n: number, lang: "en" | "ar"): string {
  return `${lang === "ar" ? "ر.س" : "SAR"} ${fmtNum(n, lang)}`;
}

/** Format any string of digits (e.g. "PRJ-2026-001", "2026-04-26") for display. */
export function fmtAny(s: string | number, lang: "en" | "ar"): string {
  return lang === "ar" ? toArDigits(s) : String(s);
}

