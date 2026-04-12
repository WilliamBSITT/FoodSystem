"use client";

import { CheckCircle2 } from "lucide-react";

interface BottomToastProps {
  message: string | null;
  bottomOffsetClassName?: string;
}

export function BottomToast({ message, bottomOffsetClassName = "bottom-6" }: BottomToastProps) {
  if (!message) {
    return null;
  }

  return (
    <div className={`pointer-events-none fixed left-1/2 z-[80] -translate-x-1/2 ${bottomOffsetClassName}`}>
      <div className="flex items-center gap-2 rounded-2xl bg-[var(--neutral)] px-4 py-3 text-sm font-medium text-white shadow-xl">
        <CheckCircle2 size={16} className="text-[var(--success)]" />
        <span>{message}</span>
      </div>
    </div>
  );
}
