"use client";

import { Save } from "lucide-react";
import { useT } from "@/lib/i18n";

export function SaveButton() {
  const tt = useT();
  return (
    <button className="btn btn-primary">
      <Save className="w-4 h-4" /> {tt("Save changes")}
    </button>
  );
}
