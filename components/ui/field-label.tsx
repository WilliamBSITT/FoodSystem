interface FieldLabelProps {
  children: React.ReactNode;
  required?: boolean;
}

export function FieldLabel({ children, required = false }: FieldLabelProps) {
  return (
    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#838896]">
      {children}
      {required ? <span className="ml-1 text-[#b13535] text-sm font-bold leading-none">*</span> : null}
    </p>
  );
}
