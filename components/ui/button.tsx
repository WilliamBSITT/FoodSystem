import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ className, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center gap-1 rounded-lg text-xs font-semibold uppercase tracking-wide text-[var(--primary)] transition-opacity hover:opacity-90",
        className,
      )}
      {...props}
    />
  );
}