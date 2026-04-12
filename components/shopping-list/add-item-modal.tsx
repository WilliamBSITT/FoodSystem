import { useMemo, useState } from "react";
import { FormModal } from "@/components/ui/form-modal";
import { useI18n } from "@/components/providers/i18n-provider";
import { type ShoppingItem } from "./types";
import { sanitizeInput, sanitizeInputOnChange, validateShoppingListItemName } from "@/lib/input-validation";

interface AddItemModalProps {
  onClose: () => void;
  onSave: (item: Omit<ShoppingItem, "id" | "checked">) => void;
  initial?: ShoppingItem;
  categories: string[];
}

export function AddItemModal({ onClose, onSave, initial, categories }: AddItemModalProps) {
  const { t } = useI18n();
  const [name, setName] = useState(initial?.name ?? "");
  const [qty, setQty] = useState(String(initial?.qty ?? "1"));
  const [category, setCategory] = useState<string | null>(initial?.category ?? null);
  const nameError = useMemo(() => validateShoppingListItemName(name), [name]);

  const handleSubmit = () => {
    if (nameError) return;
    onSave({ name: sanitizeInput(name), qty: Number(qty) || 1, category });
    onClose();
  };

  return (
    <FormModal
      title={initial ? t("shoppingList.editItem") : t("shoppingList.addNewItem")}
      subtitle={t("shoppingList.title")}
      onClose={onClose}
      content={
        <>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[var(--muted)]">{t("shoppingList.itemName")}</label>
            <input
              autoFocus
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-base text-[var(--foreground)] placeholder:text-[var(--muted)] transition-colors focus:border-[var(--primary)] focus:bg-[var(--surface)] focus:outline-none md:text-sm"
              placeholder={t("addProduct.productExample")}
              value={name}
              onChange={(event) => setName(sanitizeInputOnChange(event.target.value))}
              onKeyDown={(event) => event.key === "Enter" && handleSubmit()}
              maxLength={255}
            />
            {nameError ? <p className="mt-1 text-xs font-semibold text-[var(--danger)]">{nameError}</p> : null}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[var(--muted)]">{t("shoppingList.quantity")}</label>
            <input
              type="number"
              min={1}
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-base text-[var(--foreground)] transition-colors focus:border-[var(--primary)] focus:bg-[var(--surface)] focus:outline-none md:text-sm"
              value={qty}
              onChange={(event) => setQty(event.target.value)}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[var(--muted)]">
              {t("shoppingList.category")}
              <span className="ml-1 font-normal text-[var(--muted)]">({t("common.optional")})</span>
            </label>
            <select
              value={category ?? ""}
              onChange={(event) => setCategory(event.target.value || null)}
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-base text-[var(--foreground)] transition-colors focus:border-[var(--primary)] focus:bg-[var(--surface)] focus:outline-none md:text-sm"
            >
              <option value="">{t("shoppingList.noCategory")}</option>
              {categories.map((itemCategory) => (
                <option key={itemCategory} value={itemCategory}>
                  {itemCategory}
                </option>
              ))}
            </select>
          </div>
        </>
      }
      footer={
        <>
          <button type="button" onClick={onClose} className="flex-1 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold text-[var(--muted-strong)] transition-colors hover:bg-[var(--surface-muted)]">
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={Boolean(nameError)}
            className="flex-1 rounded-2xl bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-[var(--background)] transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {initial ? t("shoppingList.saveChanges") : t("shoppingList.addToList")}
          </button>
        </>
      }
    />
  );
}
