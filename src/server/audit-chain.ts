/**
 * Tamper-evident audit chain (spec §4 + §5: ISO 17025 §8.4).
 *
 * Each `AuditEntry` carries `prevHash` (hash of the prior entry) and `hash`
 * (chained hash of `prevHash` + canonical(self)). Mutating any prior row
 * invalidates every subsequent hash, so verification flags exactly where
 * the chain was broken.
 *
 * The hash function is the FNV-1a mix in `data-store.ts` — fast, runs
 * synchronously, deterministic. When the backend lands the same canonical
 * input is fed to a server-side SHA-256 routine; UI verification stays the
 * same shape.
 */

import type { AuditEntry } from "@/store/data-store";

function canonical(e: Pick<AuditEntry, "ts" | "user" | "action" | "entity" | "entityId" | "diff" | "ip">) {
  const diff = e.diff ? e.diff.map((d) => `${d.field}:${d.from}>${d.to}`).join("|") : "";
  return `${e.ts}␟${e.user}␟${e.action}␟${e.entity}␟${e.entityId}␟${diff}␟${e.ip}`;
}

function fnv(input: string): string {
  let h1 = 0x811c9dc5 | 0;
  let h2 = 0xcbf29ce4 | 0;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193);
    h2 = Math.imul(h2 ^ c, 0x100000001b3 & 0xffffffff);
  }
  const hex1 = (h1 >>> 0).toString(16).padStart(8, "0");
  const hex2 = (h2 >>> 0).toString(16).padStart(8, "0");
  return `${hex1}${hex2}${hex1}${hex2}`;
}

export function expectedHash(prevHash: string, e: Parameters<typeof canonical>[0]): string {
  return fnv(`${prevHash}␞${canonical(e)}`);
}

/**
 * Verify the chain integrity. `entries` may be in newest-first order (as the
 * store keeps them) — verification re-orders to oldest-first internally.
 *
 * Returns the entry id of the first broken link (oldest such), or null if
 * the chain is intact.
 */
export function verifyChain(entries: AuditEntry[]): { ok: boolean; brokenAt: string | null } {
  const ordered = [...entries].reverse();
  let prev = "GENESIS";
  for (const e of ordered) {
    const expected = expectedHash(prev, e);
    if (e.hash && e.hash !== expected) {
      return { ok: false, brokenAt: e.id };
    }
    if (e.prevHash && e.prevHash !== prev) {
      return { ok: false, brokenAt: e.id };
    }
    prev = e.hash ?? expected;
  }
  return { ok: true, brokenAt: null };
}
