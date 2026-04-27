import { cn } from "@/lib/utils";

export function FormSection({
  title,
  description,
  children,
  step,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  step?: number;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start gap-3 mb-4">
        {step !== undefined && (
          <div className="w-7 h-7 rounded-full bg-brand-600 text-white grid place-items-center text-xs font-bold shrink-0">
            {step}
          </div>
        )}
        <div>
          <h3 className="font-semibold">{title}</h3>
          {description && <p className="text-xs text-[rgb(var(--muted))] mt-0.5">{description}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

export function Field({
  label,
  help,
  required,
  warning,
  children,
  className,
}: {
  label: string;
  help?: string;
  required?: boolean;
  warning?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <label className="label flex items-center gap-1">
        {label}
        {required && <span className="text-rose-600">*</span>}
      </label>
      {children}
      {warning && <div className="text-xs text-amber-600">{warning}</div>}
      {help && !warning && <div className="help">{help}</div>}
    </div>
  );
}

export function Result({ label, value, unit, status }: { label: string; value: string | number; unit?: string; status?: "pass" | "fail" | "warn" | "info" }) {
  const tone =
    status === "pass" ? "from-emerald-500/10 to-emerald-500/5 border-emerald-500/30 text-emerald-700 dark:text-emerald-300" :
    status === "fail" ? "from-rose-500/10 to-rose-500/5 border-rose-500/30 text-rose-700 dark:text-rose-300" :
    status === "warn" ? "from-amber-500/10 to-amber-500/5 border-amber-500/30 text-amber-700 dark:text-amber-300" :
    "from-brand-500/10 to-brand-500/5 border-brand-500/30 text-brand-700 dark:text-brand-300";
  return (
    <div className={cn("rounded-lg border p-3 bg-gradient-to-br", tone)}>
      <div className="text-[10px] uppercase tracking-wider opacity-80 font-semibold">{label}</div>
      <div className="text-2xl font-semibold leading-tight mt-0.5">
        {value}{unit && <span className="text-sm opacity-70 ml-1">{unit}</span>}
      </div>
    </div>
  );
}
