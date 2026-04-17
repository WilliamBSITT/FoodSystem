import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { getExpiryDateFromCategory, getTodayDateString } from "@/lib/date-utils";
import { type Category, type InventoryItem } from "@/hooks/useInventory";
import { invalidateClientCache, LOCAL_CACHE_KEYS } from "@/lib/client-cache";
import { sanitizeInput, validateFamilyName, validateNotes, validateProductName } from "@/lib/input-validation";
import { useI18n } from "@/components/providers/i18n-provider";
import { getErrorMessage, logError } from "@/lib/error-utils";

interface UseEditInventoryItemProps {
  onSuccess: () => Promise<unknown>;
  onCompleted?: (message: string) => void;
  categories: Category[];
}

export function useEditInventoryItem({ onSuccess, onCompleted, categories }: UseEditInventoryItemProps) {
  const { t } = useI18n();
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editFamily, setEditFamily] = useState("");
  const [editStock, setEditStock] = useState("");
  const [editExpiry, setEditExpiry] = useState("");
  const [editCreatedAt, setEditCreatedAt] = useState(getTodayDateString());
  const [editValue, setEditValue] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editZoneId, setEditZoneId] = useState("");
  const [editZoneDetailId, setEditZoneDetailId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [showForceDeleteConfirmation, setShowForceDeleteConfirmation] = useState(false);
  const [pendingForceDelete, setPendingForceDelete] = useState(false);

  function resolveCategoryById(categoryId: string) {
    const parsedCategoryId = categoryId ? Number.parseInt(categoryId, 10) : NaN;

    if (Number.isNaN(parsedCategoryId)) {
      return editingItem?.category ?? null;
    }

    return categories.find((category) => category.id === parsedCategoryId) ?? editingItem?.category ?? null;
  }

  function syncExpiryDate(baseDate: string, categoryId: string) {
    const selectedCategory = resolveCategoryById(categoryId);
    const nextExpiryDate = getExpiryDateFromCategory(baseDate, selectedCategory);

    if (nextExpiryDate) {
      setEditExpiry(nextExpiryDate);
    }
  }

  function open(item: InventoryItem) {
    setEditingItem(item);
    setEditName(item.name);
    setEditFamily(item.family);
    setEditStock(String(item.stock));
    setEditExpiry(item.expiry ? item.expiry.slice(0, 10) : "");
    setEditCreatedAt(item.created_at ? item.created_at.slice(0, 10) : getTodayDateString());
    setEditValue(item.value ?? "");
    setEditCategoryId(String(item.category_id ?? item.category?.id ?? ""));
    setEditZoneId(String(item.zone_id ?? item.zone?.id ?? ""));
    setEditZoneDetailId(String(item.zone_detail_id ?? item.zone_detail?.id ?? ""));
    setSaveError(null);
    setShowDeleteConfirmation(false);
    setShowForceDeleteConfirmation(false);
    setPendingDelete(false);
    setPendingForceDelete(false);
  }

  function close() {
    if (isSaving) return;
    setEditingItem(null);
    setSaveError(null);
    setShowDeleteConfirmation(false);
    setShowForceDeleteConfirmation(false);
    setPendingDelete(false);
    setPendingForceDelete(false);
  }

  function requestForceDelete() {
    if (!editingItem || isSaving) return;
    setSaveError(null);
    setShowForceDeleteConfirmation(true);
  }

  function cancelForceDelete() {
    if (pendingForceDelete) return;
    setShowForceDeleteConfirmation(false);
  }

  function updateEditCreatedAt(nextCreatedAt: string) {
    setEditCreatedAt(nextCreatedAt);
    syncExpiryDate(nextCreatedAt, editCategoryId);
  }

  function updateEditCategoryId(nextCategoryId: string) {
    setEditCategoryId(nextCategoryId);
    syncExpiryDate(editCreatedAt, nextCategoryId);
  }

  async function save() {
    if (!editingItem) return;

    const sanitizedName = sanitizeInput(editName);
    const sanitizedFamily = sanitizeInput(editFamily);
    const sanitizedNote = sanitizeInput(editValue);
    const trimmedStock = editStock.trim();
    const parsedStock = Number.parseFloat(trimmedStock.replace(",", "."));
    const parsedCategoryId = editCategoryId ? Number.parseInt(editCategoryId, 10) : null;
    const parsedZoneId = editZoneId ? Number.parseInt(editZoneId, 10) : null;
    const parsedZoneDetailId = editZoneDetailId ? Number.parseInt(editZoneDetailId, 10) : null;
    const nameError = validateProductName(sanitizedName);
    const familyError = validateFamilyName(sanitizedFamily);
    const noteError = validateNotes(sanitizedNote);

    if (!trimmedStock || !editCreatedAt) {
      setSaveError(t("inventory.editRequiredFields"));
      return;
    }

    if (nameError) {
      setSaveError(nameError);
      return;
    }

    if (familyError) {
      setSaveError(familyError);
      return;
    }

    if (noteError) {
      setSaveError(noteError);
      return;
    }

    if (Number.isNaN(parsedStock)) {
      setSaveError(t("addProduct.quantityInvalid"));
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    const shouldKeepWhenZero = await resolveKeepWhenZero(parsedCategoryId, Boolean(editingItem.category?.keep_zero));
    const trimmedExpiry = editExpiry.trim();

    if (parsedStock === 0) {
      // Ask user whether to add item to shopping list whenever stock reaches zero.
      setShowDeleteConfirmation(true);
      setPendingDelete(false);
      setIsSaving(false);
      return;
    } else {
      const { error: updateError } = await supabase
        .from("inventory_items")
        .update({
          name: sanitizedName,
          stock: parsedStock,
          expiry: trimmedExpiry || null,
          created_at: editCreatedAt,
          value: sanitizedNote,
          category_id: Number.isNaN(parsedCategoryId ?? NaN) ? null : parsedCategoryId,
          zone_id: Number.isNaN(parsedZoneId ?? NaN) ? null : parsedZoneId,
          zone_detail_id: Number.isNaN(parsedZoneDetailId ?? NaN) ? null : parsedZoneDetailId,
        })
        .eq("id", editingItem.id);

      if (updateError) {
        const userMessage = getErrorMessage(updateError);
        setSaveError(userMessage);
        logError(updateError, 'useEditInventoryItem.save.update');
        setIsSaving(false);
        return;
      }

      invalidateClientCache(LOCAL_CACHE_KEYS.inventoryItems);
    }

    await onSuccess();
    onCompleted?.(parsedStock === 0 && !shouldKeepWhenZero ? t("inventory.itemDeleted") : t("inventory.itemUpdated"));
    setIsSaving(false);
    setEditingItem(null);
  }

  async function confirmDelete() {
    if (!editingItem) return;

    setPendingDelete(true);
    setIsSaving(true);
    setSaveError(null);

    const parsedCategoryId = editCategoryId ? Number.parseInt(editCategoryId, 10) : null;
    const shoppingItemName = sanitizeInput(editName) || editingItem.name;

    const { error: shoppingListError } = await supabase
      .from("shopping_list_items")
      .insert({
        name: shoppingItemName,
        category_id: Number.isNaN(parsedCategoryId ?? NaN) ? null : parsedCategoryId,
        qty: 1,
      });

    if (shoppingListError) {
      const userMessage = getErrorMessage(shoppingListError);
      setSaveError(userMessage);
      logError(shoppingListError, "useEditInventoryItem.confirmDelete.insertShoppingItem");
      setPendingDelete(false);
      setIsSaving(false);
      return;
    }

    invalidateClientCache(LOCAL_CACHE_KEYS.shoppingListItems);

    const shouldKeepWhenZero = await resolveKeepWhenZero(parsedCategoryId, Boolean(editingItem.category?.keep_zero));

    if (shouldKeepWhenZero) {
      const trimmedExpiry = editExpiry.trim();
      const parsedZoneId = editZoneId ? Number.parseInt(editZoneId, 10) : null;
      const parsedZoneDetailId = editZoneDetailId ? Number.parseInt(editZoneDetailId, 10) : null;

      const { error: updateError } = await supabase
        .from("inventory_items")
        .update({
          name: sanitizeInput(editName),
          stock: 0,
          expiry: trimmedExpiry || null,
          created_at: editCreatedAt,
          value: sanitizeInput(editValue),
          category_id: Number.isNaN(parsedCategoryId ?? NaN) ? null : parsedCategoryId,
          zone_id: Number.isNaN(parsedZoneId ?? NaN) ? null : parsedZoneId,
          zone_detail_id: Number.isNaN(parsedZoneDetailId ?? NaN) ? null : parsedZoneDetailId,
        })
        .eq("id", editingItem.id);

      if (updateError) {
        const userMessage = getErrorMessage(updateError);
        setSaveError(userMessage);
        logError(updateError, "useEditInventoryItem.confirmDelete.updateZeroStock");
        setPendingDelete(false);
        setIsSaving(false);
        return;
      }

      invalidateClientCache(LOCAL_CACHE_KEYS.inventoryItems);
    } else {
      const { error: deleteError } = await supabase
        .from("inventory_items")
        .delete()
        .eq("id", editingItem.id);

      if (deleteError) {
        const userMessage = getErrorMessage(deleteError);
        setSaveError(userMessage);
        logError(deleteError, "useEditInventoryItem.confirmDelete.delete");
        setPendingDelete(false);
        setIsSaving(false);
        return;
      }

      invalidateClientCache(LOCAL_CACHE_KEYS.inventoryItems);
    }

    await onSuccess();
    onCompleted?.(shouldKeepWhenZero ? t("inventory.itemAddedToShoppingList") : t("inventory.itemMovedToShoppingList"));
    setPendingDelete(false);
    setShowDeleteConfirmation(false);
    setIsSaving(false);
    setEditingItem(null);
  }

  async function continueWithoutShoppingList() {
    if (!editingItem) return;

    setPendingDelete(true);
    setIsSaving(true);
    setSaveError(null);

    const parsedCategoryId = editCategoryId ? Number.parseInt(editCategoryId, 10) : null;
    const shouldKeepWhenZero = await resolveKeepWhenZero(parsedCategoryId, Boolean(editingItem.category?.keep_zero));

    if (shouldKeepWhenZero) {
      const trimmedExpiry = editExpiry.trim();
      const parsedZoneId = editZoneId ? Number.parseInt(editZoneId, 10) : null;
      const parsedZoneDetailId = editZoneDetailId ? Number.parseInt(editZoneDetailId, 10) : null;

      const { error: updateError } = await supabase
        .from("inventory_items")
        .update({
          name: sanitizeInput(editName),
          stock: 0,
          expiry: trimmedExpiry || null,
          created_at: editCreatedAt,
          value: sanitizeInput(editValue),
          category_id: Number.isNaN(parsedCategoryId ?? NaN) ? null : parsedCategoryId,
          zone_id: Number.isNaN(parsedZoneId ?? NaN) ? null : parsedZoneId,
          zone_detail_id: Number.isNaN(parsedZoneDetailId ?? NaN) ? null : parsedZoneDetailId,
        })
        .eq("id", editingItem.id);

      if (updateError) {
        const userMessage = getErrorMessage(updateError);
        setSaveError(userMessage);
        logError(updateError, "useEditInventoryItem.continueWithoutShoppingList.updateZeroStock");
        setPendingDelete(false);
        setIsSaving(false);
        return;
      }

      invalidateClientCache(LOCAL_CACHE_KEYS.inventoryItems);
    } else {
      const { error: deleteError } = await supabase
        .from("inventory_items")
        .delete()
        .eq("id", editingItem.id);

      if (deleteError) {
        const userMessage = getErrorMessage(deleteError);
        setSaveError(userMessage);
        logError(deleteError, "useEditInventoryItem.continueWithoutShoppingList.delete");
        setPendingDelete(false);
        setIsSaving(false);
        return;
      }

      invalidateClientCache(LOCAL_CACHE_KEYS.inventoryItems);
    }

    await onSuccess();
    onCompleted?.(shouldKeepWhenZero ? t("inventory.itemUpdated") : t("inventory.itemDeleted"));
    setPendingDelete(false);
    setShowDeleteConfirmation(false);
    setIsSaving(false);
    setEditingItem(null);
  }

  async function forceDelete() {
    if (!editingItem) return;

    setPendingForceDelete(true);
    setIsSaving(true);
    setSaveError(null);

    const { error: deleteError } = await supabase
      .from("inventory_items")
      .delete()
      .eq("id", editingItem.id);

    if (deleteError) {
      const userMessage = getErrorMessage(deleteError);
      setSaveError(userMessage);
      logError(deleteError, "useEditInventoryItem.forceDelete.delete");
      setPendingForceDelete(false);
      setIsSaving(false);
      return;
    }

    invalidateClientCache(LOCAL_CACHE_KEYS.inventoryItems);
    await onSuccess();
    onCompleted?.(t("inventory.itemDeleted"));
    setPendingForceDelete(false);
    setShowDeleteConfirmation(false);
    setShowForceDeleteConfirmation(false);
    setIsSaving(false);
    setEditingItem(null);
  }

  async function resolveKeepWhenZero(categoryId: number | null, fallback: boolean) {
    if (Number.isNaN(categoryId ?? NaN) || categoryId === null) {
      return fallback;
    }

    const currentCategoryId = editingItem?.category_id ?? editingItem?.category?.id ?? null;

    if (currentCategoryId === categoryId) {
      return fallback;
    }

    const { data, error } = await supabase
      .from("categories")
      .select("keep_zero")
      .eq("id", categoryId)
      .maybeSingle();

    if (error) {
      logError(error, "useEditInventoryItem.resolveKeepWhenZero");
      return fallback;
    }

    return Boolean(data?.keep_zero);
  }

  return {
    editingItem,
    fields: {
      editName,
      editFamily,
      editStock,
      editExpiry,
      editCreatedAt,
      editValue,
      editCategoryId,
      editZoneId,
      editZoneDetailId,
    },
    setters: {
      setEditName,
      setEditFamily,
      setEditStock,
      setEditExpiry,
      setEditCreatedAt: updateEditCreatedAt,
      setEditValue,
      setEditCategoryId: updateEditCategoryId,
      setEditZoneId,
      setEditZoneDetailId,
    },
    isSaving,
    saveError,
    open,
    close,
    save,
    showDeleteConfirmation,
    setShowDeleteConfirmation,
    pendingDelete,
    confirmDelete,
    continueWithoutShoppingList,
    requestForceDelete,
    cancelForceDelete,
    forceDelete,
    showForceDeleteConfirmation,
    pendingForceDelete,
  };
}