import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "secondary" | "danger";

const variants: Record<BadgeVariant, string> = {
  default: "bg-[var(--primary-soft)] text-[var(--primary)]",
  secondary: "bg-[var(--surface-muted)] text-[var(--muted-strong)]",
  danger: "bg-[#c73f3f] text-white",

};

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full px-2.5 text-[10px] font-semibold tracking-wide",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}