"use client";

import { FormEvent, useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { CrudSectionHeader } from "@/components/settings/crud-section-header";
import { CrudRowActions } from "@/components/settings/crud-row-actions";
import { useFamilies, type FamilyOption } from "@/hooks/useFamilies";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useI18n } from "@/components/providers/i18n-provider";
import { sanitizeInput, sanitizeInputOnChange, validateFamilyName } from "@/lib/input-validation";

type FamilyDraft = {
  name: string;
  description: string;
};

const EMPTY_DRAFT: FamilyDraft = {
  name: "",
  description: "",
};

interface FamiliesSettingsContentProps {
  onToast?: (message: string) => void;
}

export function FamiliesSettingsContent({ onToast }: FamiliesSettingsContentProps) {
  const { t } = useI18n();
  const {
    families,
    loading,
    creating,
    updating,
    deleting,
    createFamily,
    updateFamily,
    deleteFamily,
  } = useFamilies();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingFamilyId, setEditingFamilyId] = useState<number | null>(null);
  const [draft, setDraft] = useState<FamilyDraft>(EMPTY_DRAFT);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FamilyOption | null>(null);

  const editingFamily = useMemo(
    () => families.find((family) => family.id === editingFamilyId) ?? null,
    [families, editingFamilyId],
  );
  useBodyScrollLock(modalOpen);

  const familyNameError = useMemo(() => validateFamilyName(draft.name), [draft.name]);

  function openCreateModal() {
    setEditingFamilyId(null);
    setDraft(EMPTY_DRAFT);
    setErrorMessage(null);
    setModalOpen(true);
  }

  function openEditModal(family: FamilyOption) {
    setEditingFamilyId(family.id);
    setDraft({
      name: family.name,
      description: family.description ?? "",
    });
    setErrorMessage(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingFamilyId(null);
    setDraft(EMPTY_DRAFT);
    setErrorMessage(null);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (familyNameError) {
      setErrorMessage(familyNameError);
      return;
    }

    try {
      if (editingFamilyId === null) {
        await createFamily({
          name: sanitizeInput(draft.name),
          description: sanitizeInput(draft.description),
        });
        onToast?.(t("families.added"));
      } else {
        await updateFamily(editingFamilyId, {
          name: sanitizeInput(draft.name),
          description: sanitizeInput(draft.description),
        });
        onToast?.(t("families.updated"));
      }

      closeModal();
    } catch (familyError) {
      setErrorMessage(familyError instanceof Error ? familyError.message : t("families.unableSave"));
    }
  }

  async function confirmDeleteFamily() {
    if (!deleteTarget) {
      return;
    }

    setErrorMessage(null);

    try {
      await deleteFamily(deleteTarget.id);
      onToast?.(t("families.deleted"));
      setDeleteTarget(null);
    } catch (familyError) {
      setErrorMessage(familyError instanceof Error ? familyError.message : t("families.unableDelete"));
    }
  }

  const savePending = creating || updating;
  const saveDisabled = savePending || Boolean(familyNameError);

  return (
    <section className="mt-8">
      <CrudSectionHeader
        title={t("families.title")}
        description={t("families.description")}
        actionLabel={t("families.newFamily")}
        actionIcon={<Plus size={14} />}
        onAction={openCreateModal}
      />

      <Card className="bg-[var(--surface)]">
        <CardContent className="p-0">
          <div className="md:hidden">
            {loading ? (
              <p className="px-4 py-8 text-center text-sm text-[var(--muted)]">{t("families.loading")}</p>
            ) : families.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-[var(--muted)]">{t("families.none")}</p>
            ) : (
              <div className="space-y-3 p-3">
                {families.map((family) => (
                  <div key={family.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--foreground)]">{family.name}</p>
                        <p className="mt-1 text-xs text-[var(--muted)]">{family.description || t("families.noDescription")}</p>
                      </div>
                      <CrudRowActions
                        entityName={family.name}
                        onEdit={() => openEditModal(family)}
                        onDelete={() => setDeleteTarget(family)}
                        deleteDisabled={deleting}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="hidden md:block">
            <table className="w-full table-fixed text-left text-sm">
              <colgroup>
                <col className="w-[34%]" />
                <col className="w-[48%]" />
                <col className="w-[18%]" />
              </colgroup>
              <thead className="bg-[var(--surface-muted)] text-[var(--muted-strong)]">
                <tr>
                  <th className="px-4 py-3 font-semibold">{t("families.name")}</th>
                  <th className="px-4 py-3 font-semibold">{t("families.descriptionColumn")}</th>
                  <th className="px-4 py-3 text-center font-semibold">{t("families.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-[var(--muted)]">{t("families.loading")}</td>
                  </tr>
                ) : families.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-[var(--muted)]">{t("families.none")}</td>
                  </tr>
                ) : (
                  families.map((family) => (
                    <tr key={family.id} className="border-t border-[var(--border)] text-[var(--foreground)]">
                      <td className="truncate px-4 py-3 font-medium" title={family.name}>{family.name}</td>
                      <td className="truncate px-4 py-3" title={family.description ?? ""}>{family.description || "—"}</td>
                      <td className="px-3 py-3">
                        <CrudRowActions
                          entityName={family.name}
                          onEdit={() => openEditModal(family)}
                          onDelete={() => setDeleteTarget(family)}
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

      {errorMessage ? <p className="mt-3 text-sm text-[var(--danger)]">{errorMessage}</p> : null}

      {deleteTarget ? (
        <ConfirmationDialog
          title={t("common.delete")}
          description={t("families.deleteConfirm", { name: deleteTarget.name })}
          confirmLabel={deleting ? t("common.loading") : t("common.delete")}
          cancelLabel={t("common.cancel")}
          onConfirm={confirmDeleteFamily}
          onCancel={() => setDeleteTarget(null)}
          confirmDisabled={deleting}
          tone="danger"
        />
      ) : null}

      {modalOpen ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto overscroll-contain bg-black/40 p-3 pb-[calc(1rem+env(safe-area-inset-bottom))]"
          role="dialog"
          aria-modal="true"
          onClick={closeModal}
        >
          <div
            className="max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xl sm:max-h-[90vh]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-[var(--foreground)]">
                {editingFamily ? t("families.edit", { name: editingFamily.name }) : t("families.create")}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full p-2 text-[var(--muted)] transition-colors hover:bg-[var(--surface-muted)]"
                aria-label={t("families.close")}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-3">
              <Input
                value={draft.name}
                onChange={(event) => setDraft((value) => ({ ...value, name: sanitizeInputOnChange(event.target.value) }))}
                placeholder={t("families.familyName")}
                maxLength={100}
                required
              />
              {familyNameError ? <p className="text-xs font-semibold text-[var(--danger)]">{familyNameError}</p> : null}
              <Input
                value={draft.description}
                onChange={(event) => setDraft((value) => ({ ...value, description: sanitizeInputOnChange(event.target.value) }))}
                placeholder={t("families.familyDescription")}
              />

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
                  className="rounded-xl bg-[var(--primary)] px-4 py-2 text-xs normal-case tracking-normal text-[var(--background)] disabled:opacity-60"
                >
                  {savePending ? t("families.saving") : editingFamily ? t("families.saveChanges") : t("families.createFamily")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
