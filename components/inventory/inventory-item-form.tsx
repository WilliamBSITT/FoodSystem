import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { ChevronDown, ChevronUp, SquarePen, Trash2 } from "lucide-react";
import { type InventoryItem } from "@/hooks/useInventory";
import { type StorageZone } from "@/hooks/useStorageZones";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useI18n } from "@/components/providers/i18n-provider";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { sanitizeInputOnChange, validateFamilyName, validateNotes, validateProductName } from "@/lib/input-validation";

type EditMode = "quantity-only" | "full";

interface InventoryItemFormProps {
  item: InventoryItem;
  editName: string;
  editFamily: string;
  editStock: string;
  editExpiry: string;
  editCreatedAt: string;
  editValue: string;
  editZoneId: string;
  editZoneDetailId: string;
  onNameChange: (value: string) => void;
  onFamilyChange: (value: string) => void;
  onStockChange: (value: string) => void;
  onExpiryChange: (value: string) => void;
  onCreatedAtChange: (value: string) => void;
  onValueChange: (value: string) => void;
  onZoneChange: (value: string) => void;
  onZoneDetailChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
  error: string | null;
  zones: StorageZone[];
  mode?: EditMode;
  showDeleteConfirmation?: boolean;
  onConfirmDelete?: () => void;
  onCancelDelete?: () => void;
  pendingDelete?: boolean;
  canForceDelete?: boolean;
  showForceDeleteConfirmation?: boolean;
  onRequestForceDelete?: () => void;
  onConfirmForceDelete?: () => void;
  onCancelForceDelete?: () => void;
  pendingForceDelete?: boolean;
  onSwitchToFullEdit?: () => void;
}

export function InventoryItemForm({
  item,
  editName,
  editFamily,
  editStock,
  editExpiry,
  editCreatedAt,
  editValue,
  editZoneId,
  editZoneDetailId,
  onNameChange,
  onFamilyChange,
  onStockChange,
  onExpiryChange,
  onCreatedAtChange,
  onValueChange,
  onZoneChange,
  onZoneDetailChange,
  onSave,
  onCancel,
  isSaving,
  error,
  zones,
  mode = "full",
  showDeleteConfirmation = false,
  onConfirmDelete,
  onCancelDelete,
  pendingDelete = false,
  canForceDelete = false,
  showForceDeleteConfirmation = false,
  onRequestForceDelete,
  onConfirmForceDelete,
  onCancelForceDelete,
  pendingForceDelete = false,
  onSwitchToFullEdit,
}: InventoryItemFormProps) {
  const { t } = useI18n();
  useBodyScrollLock(true);

  const selectedZone = zones.find((zone) => String(zone.id) === editZoneId);
  const zoneDetails = selectedZone?.details ?? [];
  const isQuantityOnly = mode === "quantity-only";
  const parsedStock = Number.parseFloat(editStock.trim().replace(",", "."));
  const stockError = !editStock.trim()
    ? t("addProduct.quantityRequired")
    : Number.isNaN(parsedStock)
      ? t("addProduct.quantityInvalid")
      : null;
  const nameError = isQuantityOnly ? null : validateProductName(editName);
  const familyError = isQuantityOnly ? null : validateFamilyName(editFamily);
  const noteError = isQuantityOnly ? null : validateNotes(editValue);
  const hasValidationError = Boolean(stockError ?? nameError ?? familyError ?? noteError);
  const canShowForceDelete = canForceDelete
    && !showDeleteConfirmation
    && (isQuantityOnly ? (!Number.isNaN(parsedStock) && parsedStock === 0) : true);

  const handleZoneChange = (value: string) => {
    onZoneChange(value);
    onZoneDetailChange("");
  };

  const changeStockBy = (delta: number) => {
    const numericStock = Number.parseFloat(editStock.replace(",", "."));
    const baseValue = Number.isNaN(numericStock) ? 0 : numericStock;
    const nextValue = Math.max(0, baseValue + delta);
    onStockChange(String(nextValue));
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto overscroll-contain bg-black/35 p-3 pb-[calc(1rem+env(safe-area-inset-bottom))]"
      onClick={onCancel}
    >
      <div
        className="relative max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-[var(--foreground)] shadow-xl sm:max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {isQuantityOnly && onSwitchToFullEdit ? (
          <button
            type="button"
            className="absolute right-4 top-4 inline-flex items-center justify-center rounded-full p-1.5 text-[var(--muted-strong)] transition hover:text-[var(--foreground)]"
            onClick={onSwitchToFullEdit}
            aria-label={t("common.edit")}
            title={t("common.edit")}
          >
            <SquarePen size={14} />
          </button>
        ) : null}
        <h3 className="text-lg font-semibold text-[var(--foreground)]">{isQuantityOnly ? t("common.edit") : t("common.edit")}</h3>
        {!showDeleteConfirmation ? (
          <p className="mt-1 text-sm text-[var(--muted)]">
            {isQuantityOnly
              ? t("inventory.editQuantityHelp")
              : t("inventory.editFullHelp")}
          </p>
        ) : null}

        {isQuantityOnly ? (
          <div className="mt-4">
            <Field label={t("addProduct.quantity")} required>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--foreground)] transition hover:bg-[var(--surface-strong)]"
                  onClick={() => changeStockBy(-1)}
                  aria-label={t("inventory.decreaseQuantity")}
                >
                  <ChevronDown size={16} />
                </button>
                <Input value={editStock} onChange={(e) => onStockChange(e.target.value)} />
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--foreground)] transition hover:bg-[var(--surface-strong)]"
                  onClick={() => changeStockBy(1)}
                  aria-label={t("inventory.increaseQuantity")}
                >
                  <ChevronUp size={16} />
                </button>
              </div>
              {stockError ? <p className="mt-1 text-xs font-semibold text-[#b13535]">{stockError}</p> : null}
            </Field>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={t("addProduct.productName")} className="sm:col-span-2" required>
              <Input value={editName} onChange={(e) => onNameChange(sanitizeInputOnChange(e.target.value))} maxLength={150} />
              {nameError ? <p className="mt-1 text-xs font-semibold text-[#b13535]">{nameError}</p> : null}
            </Field>
            <Field label={t("addProduct.family")} className="sm:col-span-2" required>
              <Input value={editFamily} onChange={(e) => onFamilyChange(sanitizeInputOnChange(e.target.value))} maxLength={100} />
              {familyError ? <p className="mt-1 text-xs font-semibold text-[#b13535]">{familyError}</p> : null}
            </Field>
            <Field label={t("addProduct.quantity")} required>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--foreground)] transition hover:bg-[var(--surface-strong)]"
                  onClick={() => changeStockBy(-1)}
                  aria-label={t("inventory.decreaseQuantity")}
                >
                  <ChevronDown size={16} />
                </button>
                <Input value={editStock} onChange={(e) => onStockChange(e.target.value)} />
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--foreground)] transition hover:bg-[var(--surface-strong)]"
                  onClick={() => changeStockBy(1)}
                  aria-label={t("inventory.increaseQuantity")}
                >
                  <ChevronUp size={16} />
                </button>
              </div>
              {stockError ? <p className="mt-1 text-xs font-semibold text-[#b13535]">{stockError}</p> : null}
            </Field>
            <Field label={t("addProduct.creationDate")} required className="sm:col-start-1">
              <Input type="date" value={editCreatedAt} onChange={(e) => onCreatedAtChange(e.target.value)} />
            </Field>
            <Field label={t("addProduct.expiryDate")} className="sm:col-start-2">
              <Input type="date" value={editExpiry} onChange={(e) => onExpiryChange(e.target.value)} />
            </Field>
            <Field label={t("addProduct.note")} className="sm:col-span-2">
              <Input value={editValue} onChange={(e) => onValueChange(sanitizeInputOnChange(e.target.value))} maxLength={1000} />
              {noteError ? <p className="mt-1 text-xs font-semibold text-[#b13535]">{noteError}</p> : null}
            </Field>
            <Field label={t("inventory.zone")}>
              <select
                value={editZoneId}
                onChange={(e) => handleZoneChange(e.target.value)}
                  className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 text-sm text-[var(--foreground)] focus:outline-none"
              >
                <option value="">{t("inventory.noZone")}</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>{zone.name}</option>
                ))}
              </select>
            </Field>
            <Field label={t("addProduct.zoneDetail")}>
              <select
                value={editZoneDetailId}
                onChange={(e) => onZoneDetailChange(e.target.value)}
                disabled={!editZoneId}
                  className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 text-sm text-[var(--foreground)] disabled:opacity-60 focus:outline-none"
              >
                <option value="">{t("addProduct.noDetail")}</option>
                {zoneDetails.map((detail) => (
                  <option key={detail.id} value={detail.id}>{detail.label}</option>
                ))}
              </select>
            </Field>
          </div>
        )}

        {error && <p className="mt-3 text-xs font-semibold text-[#b13535]">{error}</p>}

        <div className="mt-5 flex items-center justify-between gap-3">
          {canShowForceDelete ? (
            <Button
              className="h-10 w-10 justify-center rounded-full border border-[#b13535] bg-transparent p-0 text-[#b13535] hover:bg-[#b13535]/10"
              onClick={onRequestForceDelete}
              disabled={isSaving || pendingForceDelete}
              aria-label={t("inventory.forceDelete")}
              title={t("inventory.forceDelete")}
            >
              {pendingForceDelete ? <span className="text-xs">...</span> : <Trash2 size={16} />}
            </Button>
          ) : <span />}
          <div className="flex items-center gap-3">
          <Button className="text-[var(--muted-strong)]" onClick={onCancel} disabled={isSaving}>
            {t("common.cancel")}
          </Button>
          <Button
            className="rounded-xl bg-[var(--primary)] px-4 py-2 text-white"
            onClick={onSave}
            disabled={isSaving || hasValidationError}
          >
            {isSaving ? t("common.saving") : t("common.save")}
          </Button>
          </div>
        </div>
        {showDeleteConfirmation && (
          <ConfirmationDialog
            title={t("inventory.zeroStockPromptTitle")}
            description={t("inventory.zeroStockPromptDescription", {
              item: item.name,
            })}
            confirmLabel={pendingDelete ? t("common.loading") : t("inventory.zeroStockPromptAdd")}
            cancelLabel={pendingDelete ? t("common.loading") : t("inventory.zeroStockPromptSkip")}
            onConfirm={() => onConfirmDelete?.()}
            onCancel={() => onCancelDelete?.()}
            confirmDisabled={pendingDelete}
            tone="primary"
          />
        )}
        {showForceDeleteConfirmation && (
          <ConfirmationDialog
            title={t("inventory.forceDeleteTitle")}
            description={t("inventory.forceDeleteDescription", {
              item: item.name,
            })}
            confirmLabel={pendingForceDelete ? t("common.deleting") : t("inventory.forceDeleteConfirm")}
            cancelLabel={pendingForceDelete ? t("common.loading") : t("common.cancel")}
            onConfirm={() => onConfirmForceDelete?.()}
            onCancel={() => onCancelForceDelete?.()}
            confirmDisabled={pendingForceDelete}
            tone="danger"
          />
        )}
      </div>
    </div>
  );
}
