"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/store/app-store";

/**
 * Client-only auth gate. Waits for zustand-persist to rehydrate from
 * localStorage before deciding whether the user is signed in, so a page
 * reload doesn't briefly bounce an authenticated session to /login.
 *
 * Lives in its own client component so the parent (app) layout can stay a
 * pure server component and we keep the per-page client surface minimal.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const user = useApp((s) => s.user);
  const router = useRouter();

  const [hydrated, setHydrated] = useState(() => useApp.persist.hasHydrated());
  useEffect(() => {
    setHydrated(useApp.persist.hasHydrated());
    const unsub = useApp.persist.onFinishHydration(() => setHydrated(true));
    return () => { unsub(); };
  }, []);

  useEffect(() => {
    if (hydrated && !user) router.replace("/login");
  }, [hydrated, user, router]);

  if (!hydrated) return null;
  return <>{children}</>;
}
