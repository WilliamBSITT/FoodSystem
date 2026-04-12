import { cn } from "@/lib/utils";

interface ItemRowProps {
  children: React.ReactNode;
  className?: string;
}

export function ItemRow({ children, className }: ItemRowProps) {
  return (
    <div
      className={cn(
        "group grid grid-cols-[2rem_1fr_6rem_4rem_4rem] items-center gap-3 border-b border-[var(--border)] px-6 py-3.5 transition-colors hover:bg-[var(--surface-muted)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
