"use client";

/**
 * Lightweight query invalidation pub/sub.
 *
 * Each `useApiQuery` subscribes to one or more "topics" (e.g. "projects",
 * "dashboard"). Mutations call `invalidate("projects")` and every hook
 * subscribed to that topic refetches.
 *
 * Topic derivation: a query key like "projects:..." has topic "projects".
 * Hooks can pass extra topics when they want to refetch on cross-entity
 * changes (e.g. a samples query that should also refetch when projects
 * change).
 */

type Listener = () => void;

const listeners = new Map<string, Set<Listener>>();

export function subscribeInvalidation(topic: string, fn: Listener): () => void {
  let set = listeners.get(topic);
  if (!set) {
    set = new Set();
    listeners.set(topic, set);
  }
  set.add(fn);
  return () => {
    const s = listeners.get(topic);
    if (!s) return;
    s.delete(fn);
    if (s.size === 0) listeners.delete(topic);
  };
}

export function invalidate(...topics: string[]): void {
  for (const topic of topics) {
    const set = listeners.get(topic);
    if (!set) continue;
    for (const fn of set) fn();
  }
}

export function topicFromKey(key: string): string {
  const i = key.indexOf(":");
  return i === -1 ? key : key.slice(0, i);
}
