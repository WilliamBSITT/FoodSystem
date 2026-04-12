import { ReactNode } from "react";

interface FieldProps {
  label: string;
  children: ReactNode;
  className?: string;
  required?: boolean;
}

export function Field({ label, children, className, required = false }: FieldProps) {
  return (
    <div className={className}>
      <p className="mb-1 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
        {label}
        {required ? <span className="ml-1 text-[#b13535] text-sm font-bold leading-none">*</span> : null}
      </p>
      {children}
    </div>
  );
}
