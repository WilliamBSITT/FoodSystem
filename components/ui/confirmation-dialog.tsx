import { type ReactNode } from "react";
import { FormModal } from "@/components/ui/form-modal";
import { useI18n } from "@/components/providers/i18n-provider";

interface ConfirmationDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmDisabled?: boolean;
  tone?: "primary" | "danger";
  children?: ReactNode;
}

export function ConfirmationDialog({
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  confirmDisabled = false,
  tone = "primary",
  children,
}: ConfirmationDialogProps) {
  const { t } = useI18n();
  const confirmButtonClassName =
    tone === "danger"
      ? "flex-1 rounded-2xl bg-[#b13535] px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      : "flex-1 rounded-2xl bg-[#3345b8] px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <FormModal
      title={title}
      subtitle={t("common.confirmation")}
      onClose={onCancel}
      content={(
        <div className="space-y-4">
          <p className="text-sm text-[var(--muted)]">{description}</p>
          {children}
        </div>
      )}
      footer={
        <>
          <button type="button" onClick={onCancel} className="flex-1 rounded-2xl border border-[var(--border)] px-4 py-3 text-sm font-semibold text-[var(--muted-strong)] transition-colors hover:bg-[var(--surface-muted)]">
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} disabled={confirmDisabled} className={confirmButtonClassName}>
            {confirmLabel}
          </button>
        </>
      }
    />
  );
}
