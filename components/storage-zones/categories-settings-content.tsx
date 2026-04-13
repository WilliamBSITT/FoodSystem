"use client";

import { FormEvent, useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { CategoryIcon } from "@/components/ui/category-icon";
import { CrudSectionHeader } from "@/components/settings/crud-section-header";
import { CrudRowActions } from "@/components/settings/crud-row-actions";
import { useCategories } from "@/hooks/useCategories";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import type { Category } from "@/hooks/useInventory";
import { HexColorPicker } from "react-colorful";
import { useI18n } from "@/components/providers/i18n-provider";
import { sanitizeInput, sanitizeInputOnChange, validateCategoryName } from "@/lib/input-validation";

type CategoryDraft = {
  name: string;
  icon: string;
  bg: string;
  color: string;
  keep_zero: boolean;
  default_expiry_months: number;
  notify_on_expiry: boolean;
};

type PendingCategoryUpdate = {
  categoryId: number;
  payload: Omit<Category, "id">;
  affectedCount: number;
};

const HEX_COLOR_REGEX = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})/;

function extractHexColor(value: string, fallback: string) {
  const matchedHex = value.match(HEX_COLOR_REGEX)?.[0];

  if (!matchedHex) {
    return fallback;
  }

  return matchedHex;
}

const EMPTY_DRAFT: CategoryDraft = {
  name: "",
  icon: "Package",
  bg: "bg-[#eef1ff]",
  color: "text-[#3345b8]",
  keep_zero: false,
  default_expiry_months: 0,
  notify_on_expiry: true,
};

interface CategoriesSettingsContentProps {
  onToast?: (message: string) => void;
}

export function CategoriesSettingsContent({ onToast }: CategoriesSettingsContentProps) {
  const { t } = useI18n();
  const {
    categories,
    loading,
    creating,
    updating,
    deleting,
    createCategory,
    updateCategory,
    countCategoryInventoryItems,
    deleteCategory,
  } = useCategories();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [draft, setDraft] = useState<CategoryDraft>(EMPTY_DRAFT);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [showExpiryImpactDialog, setShowExpiryImpactDialog] = useState(false);
  const [pendingCategoryUpdate, setPendingCategoryUpdate] = useState<PendingCategoryUpdate | null>(null);
  const [countingAffectedItems, setCountingAffectedItems] = useState(false);

  const editingCategory = useMemo(
    () => categories.find((category) => category.id === editingCategoryId) ?? null,
    [categories, editingCategoryId],
  );
  useBodyScrollLock(modalOpen);

  const categoryNameError = useMemo(() => validateCategoryName(draft.name), [draft.name]);

  const previewCategory = useMemo<Category>(
    () => ({
      id: editingCategoryId ?? 0,
      name: draft.name.trim() || "Category preview",
      icon: draft.icon.trim() || "Package",
      bg: draft.bg,
      color: draft.color,
      keep_zero: draft.keep_zero,
      default_expiry_months: draft.default_expiry_months,
      notify_on_expiry: draft.notify_on_expiry,
    }),
    [draft, editingCategoryId],
  );

  const backgroundHex = useMemo(() => extractHexColor(draft.bg, "#eef1ff"), [draft.bg]);
  const textHex = useMemo(() => extractHexColor(draft.color, "#3345b8"), [draft.color]);

  function buildCategoryPayload(normalizedExpiryMonths: number): Omit<Category, "id"> {
    return {
      name: sanitizeInput(draft.name),
      icon: sanitizeInput(draft.icon),
      bg: draft.bg.trim(),
      color: draft.color.trim(),
      keep_zero: draft.keep_zero,
      default_expiry_months: normalizedExpiryMonths,
      notify_on_expiry: draft.notify_on_expiry,
    };
  }

  async function saveCategory(normalizedExpiryMonths: number) {
    const payload = buildCategoryPayload(normalizedExpiryMonths);

    if (editingCategoryId === null) {
      await createCategory(payload);
      onToast?.(t("categories.added"));
      closeModal();
      return;
    }

    await updateCategory(editingCategoryId, payload);
    onToast?.(t("categories.updated"));
    closeModal();
  }

  function openCreateModal() {
    setEditingCategoryId(null);
    setDraft(EMPTY_DRAFT);
    setErrorMessage(null);
    setModalOpen(true);
  }

  function openEditModal(category: Category) {
    setEditingCategoryId(category.id);
    setDraft({
      name: category.name,
      icon: category.icon,
      bg: category.bg,
      color: category.color,
      keep_zero: Boolean(category.keep_zero),
      default_expiry_months: Number.parseInt(String(category.default_expiry_months ?? 0), 10) || 0,
      notify_on_expiry: category.notify_on_expiry !== false,
    });
    setErrorMessage(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingCategoryId(null);
    setDraft(EMPTY_DRAFT);
    setErrorMessage(null);
    setShowExpiryImpactDialog(false);
    setPendingCategoryUpdate(null);
    setCountingAffectedItems(false);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (categoryNameError) {
      setErrorMessage(categoryNameError);
      return;
    }

    try {
      const normalizedExpiryMonths = Math.max(0, Number.parseInt(String(draft.default_expiry_months), 10) || 0);

      if (
        editingCategoryId !== null
        && editingCategory
        && editingCategory.default_expiry_months !== normalizedExpiryMonths
      ) {
        setCountingAffectedItems(true);

        try {
          const affectedCount = await countCategoryInventoryItems(editingCategoryId);
          setPendingCategoryUpdate({
            categoryId: editingCategoryId,
            payload: buildCategoryPayload(normalizedExpiryMonths),
            affectedCount,
          });
          setShowExpiryImpactDialog(true);
        } finally {
          setCountingAffectedItems(false);
        }

        return;
      }

      await saveCategory(normalizedExpiryMonths);
    } catch (categoryError) {
      setErrorMessage(categoryError instanceof Error ? categoryError.message : t("categories.unableSave"));
    }
  }

  async function confirmExpiryImpactUpdate() {
    if (!pendingCategoryUpdate) {
      return;
    }

    setErrorMessage(null);

    try {
      await updateCategory(pendingCategoryUpdate.categoryId, pendingCategoryUpdate.payload);
      onToast?.(t("categories.updated"));
      setShowExpiryImpactDialog(false);
      setPendingCategoryUpdate(null);
      closeModal();
    } catch (categoryError) {
      setErrorMessage(categoryError instanceof Error ? categoryError.message : t("categories.unableSave"));
      setShowExpiryImpactDialog(false);
      setPendingCategoryUpdate(null);
    }
  }

  function cancelExpiryImpactUpdate() {
    setShowExpiryImpactDialog(false);
    setPendingCategoryUpdate(null);
  }

  async function confirmDeleteCategory() {
    if (!deleteTarget) {
      return;
    }

    setErrorMessage(null);

    try {
      await deleteCategory(deleteTarget.id);
      onToast?.(t("categories.deleted"));
      setDeleteTarget(null);
    } catch (categoryError) {
      setErrorMessage(categoryError instanceof Error ? categoryError.message : t("categories.unableDelete"));
    }
  }

  const savePending = creating || updating;
  const saveDisabled = savePending || countingAffectedItems || Boolean(categoryNameError);

  return (
    <section className="mt-8">
      <CrudSectionHeader
        title={t("categories.title")}
        description={t("categories.description")}
        actionLabel={t("categories.newCategory")}
        actionIcon={<Plus size={14} />}
        onAction={openCreateModal}
        helperContent={(
          <>
            {t("categories.helperIntro")} {" "}
            <a
              href="https://lucide.dev/icons"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[var(--primary)] underline underline-offset-4 transition hover:opacity-85"
            >
              {t("categories.helperLink")}
            </a>{" "}
            {t("categories.helperOutro")}
          </>
        )}
      />

      <Card className="bg-[var(--surface)]">
        <CardContent className="p-0">
          <div className="md:hidden">
            {loading ? (
              <p className="px-4 py-8 text-center text-sm text-[var(--muted)]">{t("categories.loading")}</p>
            ) : categories.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-[var(--muted)]">{t("categories.none")}</p>
            ) : (
              <div className="space-y-3 p-3">
                {categories.map((category) => (
                  <div key={category.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                          <CategoryIcon category={category} />
                        <p className="text-sm font-semibold text-[var(--foreground)]">{category.name}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <CrudRowActions
                          entityName={category.name}
                          onEdit={() => openEditModal(category)}
                          onDelete={() => setDeleteTarget(category)}
                          deleteDisabled={deleting}
                        />
                      </div>
                    </div>

                    <dl className="mt-3 space-y-1 text-xs text-[var(--muted-strong)]">
                      <div className="grid grid-cols-[86px_1fr] gap-2">
                        <dt className="font-semibold text-[var(--muted)]">{t("categories.icon")}</dt>
                        <dd className="break-all">{category.icon}</dd>
                      </div>
                      <div className="grid grid-cols-[86px_1fr] gap-2">
                        <dt className="font-semibold text-[var(--muted)]">{t("categories.background")}</dt>
                        <dd className="break-all">{category.bg}</dd>
                      </div>
                      <div className="grid grid-cols-[86px_1fr] gap-2">
                        <dt className="font-semibold text-[var(--muted)]">{t("categories.color")}</dt>
                        <dd className="break-all">{category.color}</dd>
                      </div>
                      <div className="grid grid-cols-[86px_1fr] gap-2">
                        <dt className="font-semibold text-[var(--muted)]">{t("categories.zeroStock")}</dt>
                        <dd>{category.keep_zero ? t("categories.keepItem") : t("categories.deleteItem")}</dd>
                      </div>
                      <div className="grid grid-cols-[86px_1fr] gap-2">
                        <dt className="font-semibold text-[var(--muted)]">{t("categories.expiryMonths")}</dt>
                        <dd>{category.default_expiry_months ?? 0}</dd>
                      </div>
                      <div className="grid grid-cols-[86px_1fr] gap-2">
                        <dt className="font-semibold text-[var(--muted)]">{t("categories.expiryAlert")}</dt>
                        <dd>{category.notify_on_expiry === false ? t("common.disabled") : t("common.enabled")}</dd>
                      </div>
                    </dl>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="hidden md:block">
            <table className="w-full table-fixed text-left text-sm">
              <colgroup>
                <col className="w-[100px]" />
                <col className="w-[28%]" />
                <col className="w-[18%]" />
                <col className="w-[14%]" />
                <col className="w-[14%]" />
                <col className="w-[14%]" />
                <col className="w-[96px]" />
              </colgroup>
              <thead className="bg-[var(--surface-muted)] text-[var(--muted-strong)]">
                <tr>
                  <th className="px-4 py-3 font-semibold">{t("categories.preview")}</th>
                  <th className="px-4 py-3 font-semibold">{t("families.name")}</th>
                  <th className="px-4 py-3 font-semibold">{t("categories.icon")}</th>
                  <th className="px-4 py-3 font-semibold">{t("categories.zeroStock")}</th>
                  <th className="px-4 py-3 font-semibold">{t("categories.expiryMonths")}</th>
                  <th className="px-4 py-3 font-semibold">{t("categories.expiryAlert")}</th>
                  <th className="px-4 py-3 text-center font-semibold">{t("families.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-[var(--muted)]">
                      {t("categories.loading")}
                    </td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-[var(--muted)]">
                      {t("categories.none")}
                    </td>
                  </tr>
                ) : (
                  categories.map((category) => (
                    <tr key={category.id} className="border-t border-[var(--border)] text-[var(--foreground)]">
                      <td className="px-4 py-3">
                        <CategoryIcon category={category} />
                      </td>
                      <td className="truncate px-4 py-3 font-medium" title={category.name}>{category.name}</td>
                      <td className="truncate px-4 py-3" title={category.icon}>{category.icon}</td>
                      <td className="px-4 py-3">
                        {category.keep_zero ? t("categories.keepItem") : t("categories.deleteItem")}
                      </td>
                      <td className="px-4 py-3">{category.default_expiry_months ?? 0}</td>
                      <td className="px-4 py-3">{category.notify_on_expiry === false ? t("common.disabled") : t("common.enabled")}</td>
                      <td className="px-3 py-3">
                        <CrudRowActions
                          entityName={category.name}
                          onEdit={() => openEditModal(category)}
                          onDelete={() => setDeleteTarget(category)}
                          deleteDisabled={deleting}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {errorMessage ? <p className="mt-3 text-sm text-[#b03939]">{errorMessage}</p> : null}

      {modalOpen ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto overscroll-contain bg-black/40 p-3 pb-[calc(1rem+env(safe-area-inset-bottom))]"
          role="dialog"
          aria-modal="true"
          onClick={closeModal}
        >
          <div
            className="max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xl sm:max-h-[90vh]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-[var(--foreground)]">
                {editingCategory ? t("categories.edit", { name: editingCategory.name }) : t("categories.createCategory")}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full p-2 text-[var(--muted)] transition-colors hover:bg-[var(--surface-muted)]"
                aria-label={t("categories.close")}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                  {t("families.name")} <span className="text-[#b03939]">*</span>
                </label>
                <Input
                  value={draft.name}
                  onChange={(event) => setDraft((value) => ({ ...value, name: sanitizeInputOnChange(event.target.value) }))}
                  placeholder={t("families.name")}
                  maxLength={100}
                  required
                />
                {categoryNameError ? <p className="mt-1 text-xs font-semibold text-[#b03939]">{categoryNameError}</p> : null}
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                  {t("categories.icon")} <span className="text-[#b03939]">*</span>
                </label>
                <Input
                  value={draft.icon}
                  onChange={(event) => setDraft((value) => ({ ...value, icon: sanitizeInputOnChange(event.target.value) }))}
                  placeholder={"e.g. Package, Refrigerator, Wine"}
                  required
                />
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {t("categories.helperIntro")} <a href="https://lucide.dev/icons" target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-2 hover:opacity-85">{t("categories.helperLink")}</a>
                </p>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-3">
                <CategoryIcon category={previewCategory} />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{t("categories.previewLabel")}</p>
                  <p className="text-sm font-semibold text-[var(--foreground)]">{previewCategory.name}</p>
                  <p className="text-xs text-[var(--muted-strong)]">{previewCategory.icon}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                    {t("categories.backgroundColor")} <span className="text-[#b03939]">*</span>
                  </p>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                    <HexColorPicker
                      color={backgroundHex}
                      onChange={(hex) => setDraft((value) => ({ ...value, bg: `bg-[${hex}]` }))}
                      className="!h-[170px] !w-full"
                    />
                    <p className="mt-2 text-xs text-[var(--muted-strong)]">{t("categories.selected", { value: backgroundHex })}</p>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                    {t("categories.textColor")} <span className="text-[#b03939]">*</span>
                  </p>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                    <HexColorPicker
                      color={textHex}
                      onChange={(hex) => setDraft((value) => ({ ...value, color: `text-[${hex}]` }))}
                      className="!h-[170px] !w-full"
                    />
                    <p className="mt-2 text-xs text-[var(--muted-strong)]">{t("categories.selected", { value: textHex })}</p>
                  </div>
                </div>
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                  {t("categories.defaultExpiry")} <span className="text-[#b03939]">*</span>
                </label>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={draft.default_expiry_months}
                  onChange={(event) =>
                    setDraft((value) => ({
                      ...value,
                      default_expiry_months: Math.max(0, Number.parseInt(event.target.value || "0", 10) || 0),
                    }))
                  }
                  placeholder="0"
                  required
                />
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {t("categories.expiryMonths")}
                </p>
              </div>

              <div className="space-y-3">
                <label className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm text-[var(--foreground)]">
                  <input
                    type="checkbox"
                    checked={draft.keep_zero}
                    onChange={(event) =>
                      setDraft((value) => ({ ...value, keep_zero: event.target.checked }))
                    }
                    className="mt-1"
                  />
                  <span>
                    <p className="font-semibold">{t("categories.zeroStock")}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">{t("categories.keepVisible")}</p>
                  </span>
                </label>

                <label className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm text-[var(--foreground)]">
                  <input
                    type="checkbox"
                    checked={draft.notify_on_expiry}
                    onChange={(event) =>
                      setDraft((value) => ({ ...value, notify_on_expiry: event.target.checked }))
                    }
                    className="mt-1"
                  />
                  <span>
                    <p className="font-semibold">{t("categories.expiryAlert")}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">{t("categories.enableAlerts")}</p>
                  </span>
                </label>
              </div>

              <div className="mt-4 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-[var(--border)] px-4 py-2 text-xs normal-case tracking-normal text-[var(--muted-strong)]"
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={saveDisabled}
                  className="rounded-xl bg-[var(--primary)] px-4 py-2 text-xs normal-case tracking-normal text-white disabled:opacity-60"
                >
                  {countingAffectedItems
                    ? t("categories.countingImpact")
                    : savePending
                      ? t("categories.saving")
                      : editingCategory
                        ? t("categories.saveChanges")
                        : t("categories.createCategory")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {showExpiryImpactDialog && pendingCategoryUpdate ? (
        <ConfirmationDialog
          title={t("categories.expiryImpactTitle")}
          description={t("categories.expiryImpactDescription", {
            count: pendingCategoryUpdate.affectedCount,
            plural: pendingCategoryUpdate.affectedCount > 1 ? "s" : "",
          })}
          confirmLabel={updating ? t("categories.saving") : t("categories.expiryImpactConfirm")}
          cancelLabel={t("common.cancel")}
          onConfirm={confirmExpiryImpactUpdate}
          onCancel={cancelExpiryImpactUpdate}
          confirmDisabled={updating}
        />
      ) : null}

      {deleteTarget ? (
        <ConfirmationDialog
          title={t("common.delete")}
          description={t("categories.deleteConfirm", { name: deleteTarget.name })}
          confirmLabel={deleting ? t("common.loading") : t("common.delete")}
          cancelLabel={t("common.cancel")}
          onConfirm={confirmDeleteCategory}
          onCancel={() => setDeleteTarget(null)}
          confirmDisabled={deleting}
          tone="danger"
        />
      ) : null}
    </section>
  );
}
