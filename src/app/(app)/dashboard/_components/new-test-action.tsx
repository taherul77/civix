"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useT } from "@/lib/i18n";

export function NewTestAction() {
  const tt = useT();
  return (
    <Link href="/tests/new" className="btn btn-primary">
      <Plus className="w-4 h-4" /> {tt("New test")}
    </Link>
  );
}
