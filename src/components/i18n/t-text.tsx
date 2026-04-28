"use client";

import { useT } from "@/lib/i18n";

export function TText({ text }: { text: string }) {
  const tt = useT();
  return <>{tt(text)}</>;
}
