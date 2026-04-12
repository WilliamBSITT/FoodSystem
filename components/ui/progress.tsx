import { cn } from "@/lib/utils";

type ProgressProps = {
  value: number;
  className?: string;
  barClassName?: string;
};

export function Progress({ value, className, barClassName }: ProgressProps) {
  return (
    <div className={cn("h-2.5 w-full overflow-hidden rounded-full bg-[var(--surface-strong)]", className)}>
      <div
        className={cn("h-full rounded-full bg-[var(--primary)]", barClassName)}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}