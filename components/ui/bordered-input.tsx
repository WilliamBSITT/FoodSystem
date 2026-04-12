import React from "react";
import { cn } from "@/lib/utils";

type BorderedInputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const BorderedInput = React.forwardRef<HTMLInputElement, BorderedInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        {...props}
        className={cn(
          "w-full border-b border-[var(--border)] bg-transparent pb-2 text-base text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:outline-none",
          className,
        )}
      />
    );
  }
);

BorderedInput.displayName = "BorderedInput";
