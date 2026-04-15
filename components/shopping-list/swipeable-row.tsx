import { type CSSProperties } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { SHOPPING_LIST_SWIPE_MAX } from "@/lib/constants";
import type { ShoppingItem } from "@/components/shopping-list/types";
import { useI18n } from "@/components/providers/i18n-provider";

interface SwipeableRowProps {
  item: ShoppingItem;
  categoryStyleByName: Record<string, CSSProperties>;
  isLast: boolean;
  onCheck: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function SwipeableRow({
  item,
  categoryStyleByName,
  isLast,
  onCheck,
  onEdit,
  onDelete,
}: SwipeableRowProps) {
  const { swipeX, isRevealed, handleTouchStart, handleTouchMove, handleTouchEnd, close } = useSwipeGesture();
  const { t } = useI18n();

  const handleEdit = () => {
    close();
    onEdit();
  };
  const handleDelete = () => {
    close();
    onDelete();
  };

  return (
    <div className="relative overflow-hidden">
      {/* Actions revealed on swipe */}
      <div className="absolute inset-y-0 right-0 flex" style={{ width: SHOPPING_LIST_SWIPE_MAX }}>
        <button
          type="button"
          onClick={handleEdit}
          className="flex flex-1 flex-col items-center justify-center gap-1 bg-[var(--primary)] text-[var(--background)]"
        >
          <Pencil size={15} />
          <span className="text-[10px] font-semibold">{t("common.edit")}</span>
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="flex flex-1 flex-col items-center justify-center gap-1 bg-red-500 text-white"
        >
          <Trash2 size={15} />
          <span className="text-[10px] font-semibold">{t("common.delete")}</span>
        </button>
      </div>

      {/* Row */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => isRevealed && close()}
        style={{
          transform: `translateX(${swipeX}px)`,
          transition: swipeX === -SHOPPING_LIST_SWIPE_MAX || swipeX === 0 ? "transform 0.2s ease" : "none",
        }}
        className={`relative z-10 flex items-center gap-3 bg-[var(--surface)] px-4 py-3.5 ${!isLast ? "border-b border-[var(--border)]" : ""}`}
      >
        {/* Check button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCheck();
          }}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-[var(--muted)] transition-colors hover:border-[var(--primary)]"
        />

        {/* Name + category */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[var(--foreground)]">{item.name}</p>
          {item.category ? (
            <span
              className="mt-0.5 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-600"
              style={categoryStyleByName[item.category.name]}
            >
              {item.category.name}
            </span>
          ) : (
            <span className="mt-0.5 text-[11px] text-[var(--muted)]">—</span>
          )}
        </div>

        {/* Qty — right aligned, fixed width */}
        <div className="w-8 shrink-0 text-right">
          <span className="text-sm font-bold text-[var(--primary)]">{item.qty}</span>
        </div>
      </div>
    </div>
  );
}
