"use client";

import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

interface Props {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className }: Props) {
  const tt = useT();
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4 mb-6", className)}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{tt(title)}</h1>
        {description && (
          <p className="text-sm text-[rgb(var(--muted))] mt-1">{tt(description)}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
