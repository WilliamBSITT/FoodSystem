import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  startIcon?: React.ReactNode;
  clearable?: boolean;
  onClear?: () => void;
  clearAriaLabel?: string;
};

export function Input({
  className,
  startIcon,
  clearable = false,
  onClear,
  clearAriaLabel = "Clear",
  value,
  ...props
}: InputProps) {
  const hasValue = typeof value === "string" ? value.length > 0 : Boolean(value);
  const showClearButton = clearable && Boolean(onClear);
  const clearDisabled = !hasValue;

  return (
    <div
      className={cn(
        "flex h-10 w-full items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 text-[var(--foreground)]",
        className,
      )}
    >
      {startIcon}
      <input
        className="min-w-0 flex-1 bg-transparent text-base text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none md:text-sm"
        value={value}
        {...props}
      />
      {showClearButton ? (
        <button
          type="button"
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[var(--muted-strong)] transition hover:text-[var(--foreground)] disabled:cursor-default disabled:opacity-35"
          onClick={onClear}
          disabled={clearDisabled}
          aria-label={clearAriaLabel}
          title={clearAriaLabel}
        >
          <X size={13} />
        </button>
      ) : null}
    </div>
  );
}