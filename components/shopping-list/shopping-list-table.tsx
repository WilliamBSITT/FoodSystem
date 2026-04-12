import { type CSSProperties } from "react";
import { Circle, ClipboardList, Plus } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { ItemRow } from "@/components/ui/item-row";
import { CrudRowActions } from "@/components/settings/crud-row-actions";
import { useI18n } from "@/components/providers/i18n-provider";
import { type ShoppingItem } from "./types";

interface ShoppingListTableProps {
  items: ShoppingItem[];
  categoryStyleByName: Record<string, CSSProperties>;
  totalItems: number;
  activeFilter: string | null;
  loading: boolean;
  error: string | null;
  onAdd: () => void;
  onCheck: (item: ShoppingItem) => void;
  onEdit: (item: ShoppingItem) => void;
  onDelete: (id: number) => void;
}

export function ShoppingListTable({
  items,
  categoryStyleByName,
  totalItems,
  activeFilter,
  loading,
  error,
  onAdd,
  onCheck,
  onEdit,
  onDelete,
}: ShoppingListTableProps) {
  const { t } = useI18n();

  return (
    <div className="overflow-hidden rounded-3xl bg-[var(--surface)] shadow-sm border border-[var(--border)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
        <div className="flex items-center gap-2">
          <ClipboardList size={16} className="text-[var(--primary)]" />
          <span className="text-sm font-semibold text-[var(--foreground)]">{t("shoppingList.itemsToBuy")}</span>
          <span className="rounded-full bg-[var(--primary-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--primary)]">{totalItems}</span>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-3 py-2 text-xs font-semibold text-[var(--background)] transition-opacity hover:opacity-90"
        >
          <Plus size={13} />
          {t("shoppingList.addItem")}
        </button>
      </div>

      <div className="grid grid-cols-[2rem_1fr_6rem_4rem_4rem] items-center gap-3 border-b border-[var(--border)] px-6 py-2.5">
        <div />
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{t("shoppingList.item")}</p>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)] opacity-0 md:opacity-100">
          {t("shoppingList.category")}
        </p>
        <p className="text-right text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{t("shoppingList.qty")}</p>
        <div />
      </div>

      {loading ? (
        <p className="px-6 py-10 text-center text-sm text-[var(--muted)]">{t("shoppingList.loading")}</p>
      ) : null}

      {!loading && error ? <p className="px-6 py-10 text-center text-sm text-red-500">{t("common.error")}: {error}</p> : null}

      {!loading && !error && items.length === 0 ? (
        <EmptyState
          title={activeFilter ? t("shoppingList.noItemsCategory") : t("shoppingList.noItems")}
          description={activeFilter ? t("shoppingList.tryAnotherFilter") : t("shoppingList.addFirstItem")}
        />
      ) : null}

      {!loading &&
        !error &&
        items.map((item) => (
          <ItemRow key={item.id}>
            <button type="button" onClick={() => onCheck(item)} className="text-[var(--muted)] transition-colors hover:text-[var(--primary)]">
              <Circle size={18} />
            </button>
            <p className="text-sm font-medium text-[var(--foreground)]">{item.name}</p>
            {item.category ? (
              <span
                className="inline-flex w-fit rounded-lg px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600"
                style={categoryStyleByName[item.category]}
              >
                {item.category}
              </span>
            ) : (
              <span className="text-xs text-[var(--muted)]">—</span>
            )}
            <p className="text-right text-sm font-semibold text-[var(--primary)]">{item.qty}</p>
            <CrudRowActions
              entityName={item.name}
              onEdit={() => onEdit(item)}
              onDelete={() => onDelete(item.id)}
              iconSize={13}
              containerClassName="flex items-center justify-end gap-1.5"
              editButtonClassName="text-transparent transition-colors group-hover:text-[var(--muted)] hover:!text-[var(--primary)]"
              deleteButtonClassName="text-transparent transition-colors group-hover:text-[#c5cad8] hover:!text-red-400"
            />
          </ItemRow>
        ))}

      <div className="px-6 py-4">
        <p className="text-xs text-[var(--muted)]">{t("shoppingList.totalItems", { count: totalItems })}</p>
      </div>
    </div>
  );
}
