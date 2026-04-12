"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";

interface CrudRowActionsProps {
  entityName: string;
  onEdit: () => void;
  onDelete: () => void;
  deleteDisabled?: boolean;
  iconSize?: number;
  containerClassName?: string;
  editButtonClassName?: string;
  deleteButtonClassName?: string;
}

export function CrudRowActions({
  entityName,
  onEdit,
  onDelete,
  deleteDisabled = false,
  iconSize = 14,
  containerClassName,
  editButtonClassName,
  deleteButtonClassName,
}: CrudRowActionsProps) {
  const { t } = useI18n();

  return (
    <div className={containerClassName ?? "flex items-center justify-center gap-1"}>
      <button
        type="button"
        onClick={onEdit}
        className={editButtonClassName ?? "rounded-lg p-2 text-[#4e5a7d] transition-colors hover:bg-[#e3e7f4]"}
        aria-label={`${t("common.edit")} ${entityName}`}
      >
        <Pencil size={iconSize} />
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={deleteDisabled}
        className={deleteButtonClassName ?? "rounded-lg p-2 text-[#b03939] transition-colors hover:bg-[#f8e5e5] disabled:opacity-60"}
        aria-label={`${t("common.delete")} ${entityName}`}
      >
        <Trash2 size={iconSize} />
      </button>
    </div>
  );
}
