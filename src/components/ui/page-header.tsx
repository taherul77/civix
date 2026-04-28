import { cn } from "@/lib/utils";
import { TText } from "@/components/i18n/t-text";

interface Props {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className }: Props) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4 mb-6", className)}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          <TText text={title} />
        </h1>
        {description && (
          <p className="text-sm text-[rgb(var(--muted))] mt-1">
            <TText text={description} />
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
