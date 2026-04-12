import React from "react";
import { cn } from "@/lib/utils";

type BorderedSelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const BorderedSelect = React.forwardRef<HTMLSelectElement, BorderedSelectProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <select
        ref={ref}
        {...props}
        className={cn(
          "w-full appearance-none rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none",
          className,
        )}
      >
        {children}
      </select>
    );
  }
);

BorderedSelect.displayName = "BorderedSelect";
