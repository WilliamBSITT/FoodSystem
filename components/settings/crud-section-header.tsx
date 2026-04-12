import { type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface CrudSectionHeaderProps {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  actionIcon?: ReactNode;
  helperContent?: ReactNode;
}

export function CrudSectionHeader({
  title,
  description,
  actionLabel,
  onAction,
  actionIcon,
  helperContent,
}: CrudSectionHeaderProps) {
  return (
    <div className="mt-10 mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-[38px] font-semibold leading-tight text-[var(--foreground)]">{title}</h1>
        <p className="mt-1 max-w text-sm leading-6 text-[var(--muted)]">{description}</p>
        {helperContent ? (
          <div className="mt-2 rounded-xl bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--muted)]">{helperContent}</div>
        ) : null}
      </div>
      <Button
        onClick={onAction}
        className="rounded-2xl bg-[#3345b8] px-4 py-2 text-sm normal-case tracking-normal text-white"
      >
        {actionIcon}
        {actionLabel}
      </Button>
    </div>
  );
}
