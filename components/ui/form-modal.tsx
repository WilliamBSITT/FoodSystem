import { X } from "lucide-react";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

interface FormModalProps {
  title: string;
  subtitle: string;
  onClose: () => void;
  content: React.ReactNode;
  footer: React.ReactNode;
}

export function FormModal({ title, subtitle, onClose, content, footer }: FormModalProps) {
  useBodyScrollLock(true);

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto overscroll-contain bg-black/40 p-3 pb-[calc(1rem+env(safe-area-inset-bottom))]"
      onClick={onClose}
    >
      <div
        className="flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] shadow-2xl sm:max-h-[90vh]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">{subtitle}</p>
            <h2 className="mt-0.5 text-lg font-bold text-[var(--foreground)]">{title}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-[var(--muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-6 py-6">{content}</div>
        <div className="flex gap-3 border-t border-[var(--border)] px-6 py-4">{footer}</div>
      </div>
    </div>
  );
}
