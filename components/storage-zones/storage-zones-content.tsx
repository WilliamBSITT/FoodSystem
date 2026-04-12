"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  Archive,
  Check,
  ChevronRight,
  House,
  Plus,
  Refrigerator,
  Snowflake,
  Trash2,
  Trophy,
  Wine,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { CrudRowActions } from "@/components/settings/crud-row-actions";
import { type StorageZone, useStorageZones } from "@/hooks/useStorageZones";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useI18n } from "@/components/providers/i18n-provider";

type IconType = StorageZone["icon"];

const zoneIcons = {
  fridge: Refrigerator,
  freezer: Snowflake,
  wine: Wine,
  archive: Archive,
};

const ICON_OPTIONS = ["archive", "fridge", "freezer", "wine"] as const;

interface StorageZonesContentProps {
  onToast?: (message: string) => void;
}

export function StorageZonesContent({ onToast }: StorageZonesContentProps) {
  const { t } = useI18n();
  const {
    zones,
    loading,
    error,
    attentionItems,
    attentionLoading,
    attentionError,
    creating,
    updating,
    deleting,
    mutatingDetails,
    updatingAttention,
    createZone,
    updateZone,
    deleteZone,
    addDetail,
    updateDetail,
    deleteDetail,
    updateAttentionItem,
  } = useStorageZones();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  const [showAttentionModal, setShowAttentionModal] = useState(false);
  const [attentionErrorMessage, setAttentionErrorMessage] = useState<string | null>(null);
  const [attentionSuccessMessage, setAttentionSuccessMessage] = useState<string | null>(null);
  const [attentionDrafts, setAttentionDrafts] = useState<
    Record<number, { name: string; stock: string; zoneId: string; zoneDetailId: string }>
  >({});

  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  const [editingDetailId, setEditingDetailId] = useState<number | null>(null);
  const [editingDetailLabel, setEditingDetailLabel] = useState("");
  const [newDetailLabel, setNewDetailLabel] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteDetailId, setDeleteDetailId] = useState<number | null>(null);
  const [showDeleteZoneDialog, setShowDeleteZoneDialog] = useState(false);

  const [formValues, setFormValues] = useState({
    name: "",
    description: "",
    icon: "archive" as IconType,
  });
  const [createDetailDraft, setCreateDetailDraft] = useState("");
  const [createDetailLabels, setCreateDetailLabels] = useState<string[]>([]);

  const [zoneEditValues, setZoneEditValues] = useState({
    name: "",
    description: "",
    icon: "archive" as IconType,
  });

  useBodyScrollLock(showCreateForm || showAttentionModal || selectedZoneId !== null);

  
  const classicZones = zones;
  const totalItems = zones.reduce((sum, zone) => sum + zone.items, 0);
  const zonesCount = zones.length;
  const itemsWarning = attentionItems.length;
  const healthScore =
    totalItems > 0 ? Math.max(0, Math.round(((totalItems - itemsWarning) / totalItems) * 100)) : 100;

  const selectedZone = useMemo(() => zones.find((zone) => zone.id === selectedZoneId) ?? null, [zones, selectedZoneId]);

  function openZoneModal(zone: StorageZone) {
    setSelectedZoneId(zone.id);
    setZoneEditValues({
      name: zone.name,
      description: zone.description,
      icon: zone.icon,
    });
    setModalError(null);
    setModalSuccess(null);
    setEditingDetailId(null);
    setEditingDetailLabel("");
    setNewDetailLabel("");
    setDeleteConfirmText("");
    setDeleteDetailId(null);
    setShowDeleteZoneDialog(false);
  }

  function closeZoneModal() {
    setSelectedZoneId(null);
    setModalError(null);
    setModalSuccess(null);
    setEditingDetailId(null);
    setEditingDetailLabel("");
    setNewDetailLabel("");
    setDeleteConfirmText("");
    setDeleteDetailId(null);
    setShowDeleteZoneDialog(false);
  }

  async function onCreateZone() {
    setCreateError(null);
    setCreateSuccess(null);

    try {
      await createZone({
        name: formValues.name,
        description: formValues.description,
        detailLabels: createDetailLabels,
        icon: formValues.icon,
      });

      setCreateSuccess(t("storageZones.added"));
      onToast?.(t("storageZones.added"));
      setFormValues({
        name: "",
        description: "",
        icon: "archive",
      });
      setCreateDetailDraft("");
      setCreateDetailLabels([]);
      setShowCreateForm(false);
    } catch (creationError) {
      const message = creationError instanceof Error ? creationError.message : t("storageZones.unableAdd");
      setCreateError(message);
    }
  }

  function onAddCreateDetail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = createDetailDraft.trim();

    if (!trimmed) {
      return;
    }

    setCreateDetailLabels((previous) => [...previous, trimmed]);
    setCreateDetailDraft("");
  }

  async function onSaveZone(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedZone) {
      return;
    }

    setModalError(null);
    setModalSuccess(null);
    try {
      await updateZone(selectedZone.id, {
        name: zoneEditValues.name,
        description: zoneEditValues.description,
        icon: zoneEditValues.icon,
      });

      setModalSuccess(t("storageZones.updated"));
      onToast?.(t("storageZones.updated"));
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : t("storageZones.unableUpdateZone");
      setModalError(message);
    }
  }

  async function onAddDetail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedZone) {
      return;
    }

    setModalError(null);
    setModalSuccess(null);

    try {
      await addDetail(selectedZone.id, newDetailLabel);
      setNewDetailLabel("");
      setModalSuccess(t("storageZones.detailAdded"));
    } catch (addError) {
      const message = addError instanceof Error ? addError.message : t("storageZones.unableAddDetail");
      setModalError(message);
    }
  }

  async function onSaveDetail(detailId: number) {
    setModalError(null);
    setModalSuccess(null);

    try {
      await updateDetail(detailId, editingDetailLabel);
      setEditingDetailId(null);
      setEditingDetailLabel("");
      setModalSuccess(t("storageZones.detailUpdated"));
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : t("storageZones.unableUpdateDetail");
      setModalError(message);
    }
  }

  async function onDeleteDetail(detailId: number) {
    setDeleteDetailId(detailId);
  }

  async function onDeleteZone() {
    if (!selectedZone) {
      return false;
    }

    setModalError(null);
    setModalSuccess(null);

    if (deleteConfirmText.trim() !== selectedZone.name) {
      setModalError(t("storageZones.typeZoneNameError"));
      return false;
    }

    try {
      await deleteZone(selectedZone.id);
      onToast?.(t("storageZones.deleted"));
      closeZoneModal();
      return true;
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : t("storageZones.unableDeleteZone");
      setModalError(message);
      return false;
    }
  }

  async function confirmDeleteDetail() {
    if (deleteDetailId === null) {
      return;
    }

    setModalError(null);
    setModalSuccess(null);

    try {
      await deleteDetail(deleteDetailId);
      setModalSuccess(t("storageZones.detailDeleted"));
      setDeleteDetailId(null);
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : t("storageZones.unableDeleteDetail");
      setModalError(message);
    }
  }

  async function confirmDeleteZone() {
    const success = await onDeleteZone();

    if (success) {
      setShowDeleteZoneDialog(false);
    }
  }

  function openAttentionModal() {
    const initialDrafts = attentionItems.reduce<Record<number, { name: string; stock: string; zoneId: string; zoneDetailId: string }>>(
      (accumulator, item) => {
        accumulator[item.id] = {
          name: item.name,
          stock: item.stock,
          zoneId: item.zoneId ? String(item.zoneId) : "",
          zoneDetailId: item.zoneDetailId ? String(item.zoneDetailId) : "",
        };
        return accumulator;
      },
      {},
    );

    setAttentionDrafts(initialDrafts);
    setAttentionErrorMessage(null);
    setAttentionSuccessMessage(null);
    setShowAttentionModal(true);
  }

  function getDetailsForDraftZone(zoneIdValue: string) {
    const zoneId = Number.parseInt(zoneIdValue, 10);

    if (Number.isNaN(zoneId)) {
      return [];
    }

    return zones.find((zone) => zone.id === zoneId)?.details ?? [];
  }

  async function onSaveAttentionItem(itemId: number) {
    const draft = attentionDrafts[itemId];

    if (!draft) {
      return;
    }

    setAttentionErrorMessage(null);
    setAttentionSuccessMessage(null);

    try {
      const zoneId = draft.zoneId ? Number.parseInt(draft.zoneId, 10) : null;
      const zoneDetailId = draft.zoneDetailId ? Number.parseInt(draft.zoneDetailId, 10) : null;

      await updateAttentionItem(itemId, {
        name: draft.name,
        stock: draft.stock,
        zoneId: Number.isNaN(zoneId ?? NaN) ? null : zoneId,
        zoneDetailId: Number.isNaN(zoneDetailId ?? NaN) ? null : zoneDetailId,
      });

      setAttentionSuccessMessage(t("storageZones.itemUpdated"));
      setAttentionDrafts((current) => {
        const next = { ...current };
        delete next[itemId];
        return next;
      });
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : t("storageZones.unableUpdateItem");
      setAttentionErrorMessage(message);
    }
  }

  return (
    <>
      <section className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[38px] font-semibold leading-tight text-[var(--foreground)]">{t("storageZones.title")}</h1>
          <p className="mt-1 max-w-lg text-sm leading-6 text-[var(--muted)]">{t("storageZones.description")}</p>
        </div>
      </section>
      {showCreateForm ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto overscroll-contain bg-black/40 p-3 pb-[calc(1rem+env(safe-area-inset-bottom))]"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowCreateForm(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-[var(--foreground)]">{t("storageZones.newStoragePlace")}</h2>
                <p className="text-sm text-[var(--muted)]">{t("storageZones.configureZone")}</p>
              </div>
              <button
                onClick={() => setShowCreateForm(false)}
                className="rounded-full p-2 text-[var(--muted)] transition-colors hover:bg-[var(--surface-muted)]"
                aria-label={t("common.close")}
              >
                <X size={16} />
              </button>
            </div>

            <Card className="mb-4 bg-[var(--surface)]">
              <CardContent className="p-5">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <Input
                    value={formValues.name}
                    onChange={(event) => setFormValues((value) => ({ ...value, name: event.target.value }))}
                    placeholder={t("storageZones.placeName")}
                    required
                  />
                  <Input
                    value={formValues.description}
                    onChange={(event) => setFormValues((value) => ({ ...value, description: event.target.value }))}
                    placeholder={t("storageZones.descriptionField")}
                  />

                  <div className="md:col-span-2">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{t("storageZones.icon")}</p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {ICON_OPTIONS.map((iconType) => {
                        const IconPreview = zoneIcons[iconType];

                        return (
                          <button
                            key={iconType}
                            type="button"
                            onClick={() => setFormValues((value) => ({ ...value, icon: iconType }))}
                            className={`flex h-12 items-center justify-center rounded-xl border transition-colors ${
                              formValues.icon === iconType
                                ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
                                : "border-[var(--border)] text-[var(--muted-strong)] hover:bg-[var(--surface-muted)]"
                            }`}
                            aria-label={t("storageZones.chooseIcon", { icon: iconType })}
                          >
                            <IconPreview size={17} />
                            <span className="sr-only">{iconType}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-4 bg-[var(--surface)]">
              <CardContent className="p-4">
                <p className="text-sm font-semibold text-[var(--foreground)]">{t("storageZones.zoneDetails")}</p>

                <div className="mt-3 overflow-hidden rounded-xl border border-[var(--border)]">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[var(--surface-muted)] text-[var(--muted-strong)]">
                      <tr>
                        <th className="px-3 py-2 font-semibold">{t("storageZones.label")}</th>
                        <th className="px-3 py-2 font-semibold text-right">{t("storageZones.actions")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {createDetailLabels.length === 0 ? (
                        <tr>
                          <td colSpan={2} className="px-3 py-4 text-center text-[var(--muted)]">
                            {t("storageZones.noDetailsYet")}
                          </td>
                        </tr>
                      ) : (
                        createDetailLabels.map((label, index) => (
                          <tr key={`${label}-${index}`} className="border-t border-[var(--border)]">
                            <td className="px-3 py-2">
                              <Input
                                value={label}
                                onChange={(event) => {
                                  const next = [...createDetailLabels];
                                  next[index] = event.target.value;
                                  setCreateDetailLabels(next);
                                }}
                                placeholder={t("storageZones.detailLabel")}
                              />
                            </td>
                            <td className="px-3 py-2 text-right">
                              <button
                                type="button"
                                className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                                onClick={() => {
                                  const next = [...createDetailLabels];
                                  next.splice(index, 1);
                                  setCreateDetailLabels(next);
                                }}
                                aria-label={t("common.delete")}
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <form onSubmit={onAddCreateDetail} className="mt-3 flex flex-wrap items-center gap-2">
                  <div className="min-w-[220px] flex-1">
                    <Input
                      value={createDetailDraft}
                      onChange={(event) => setCreateDetailDraft(event.target.value)}
                      placeholder={t("storageZones.newDetailLabel")}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="rounded-xl bg-[var(--primary)] px-4 py-2 text-[11px] tracking-[0.08em] text-white"
                  >
                    {t("storageZones.addDetail")}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                onClick={onCreateZone}
                disabled={creating}
                className="rounded-xl bg-[var(--primary)] px-4 py-2 text-[11px] tracking-[0.08em] text-white disabled:opacity-60"
              >
                {creating ? t("common.saving") : t("storageZones.savePlace")}
              </Button>
              <Button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="rounded-xl bg-[var(--surface-muted)] px-4 py-2 text-[11px] tracking-[0.08em] text-[var(--muted-strong)]"
              >
                {t("common.cancel")}
              </Button>
              {createSuccess ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--success)]">
                  <Check size={13} />
                  {createSuccess}
                </span>
              ) : null}
            </div>

            {createError ? <p className="mt-2 text-xs font-semibold text-red-500">{createError}</p> : null}
          </div>
        </div>
      ) : null}

      <section className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card className="bg-[#3345b8] text-white">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-[0.95fr_1.35fr]">
              <div className="flex h-full min-h-[145px] items-center justify-center rounded-3xl bg-white/10 text-white">
                <House size={52} />
              </div>

              <div>
                <h2 className="text-4xl font-semibold text-white">{t("storageZones.allZones")}</h2>
                <p className="mt-1 text-sm text-[#dce1ff]">{t("storageZones.classicOverview")}</p>
                <p className="mt-4 rounded-2xl bg-white/10 p-4 text-sm leading-6 text-[#e6e9ff]">
                  {t("storageZones.settingsDescription")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden bg-[#3345b8]">
          <CardContent className="relative p-6 text-white">
            <div className="absolute -right-12 -bottom-12 h-44 w-44 rounded-full bg-[var(--background)]/15" />
            <p className="text-[38px] font-semibold leading-tight">{t("storageZones.inventoryHealth")}</p>
            <p className="mt-1 max-w-[270px] text-sm text-[#dce1ff]">
              {attentionLoading
                ? t("storageZones.attentionLoading")
                : t("storageZones.attentionSummary", { count: itemsWarning })}
            </p>

            <button
              type="button"
              onClick={openAttentionModal}
              className="relative z-10 mt-8 w-full text-left"
            >
              <p className="text-6xl font-semibold leading-none">{healthScore}%</p>
              <div className="mt-4 h-3 w-full rounded-full bg-[var(--background)]/25">
                <div className="h-3 rounded-full bg-white" style={{ width: `${healthScore}%` }} />
              </div>
            </button>
          </CardContent>
        </Card>
      </section>

      {loading ? (
        <Card className="mb-4 bg-[var(--surface)]">
          <CardContent className="p-6">
            <p className="text-sm text-[var(--muted)]">{t("storageZones.loading")}</p>
          </CardContent>
        </Card>
      ) : null}

      {error ? (
        <Card className="mb-4 bg-[var(--surface)]">
          <CardContent className="p-6">
            <p className="text-sm text-[#b13535]">{t("storageZones.loadFailed", { error })}</p>
          </CardContent>
        </Card>
      ) : null}

      <section className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        {classicZones.map((zone) => {
          const Icon = zoneIcons[zone.icon];

          return (
            <Card key={zone.id} className="cursor-pointer bg-[var(--surface)]" onClick={() => openZoneModal(zone)}>
              <CardContent className="p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ebedf8] text-[#3345b8]">
                    <Icon size={15} />
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--foreground)]">{zone.name}</p>
                    <p className="text-xs text-[var(--muted)]">{zone.description}</p>
                  </div>
                </div>

                <div className="mb-4 flex items-end justify-between">
                  <p className="text-lg font-semibold text-[var(--foreground)]">{zone.items} {t("storageZones.items")}</p>
                  <button className="text-[#6b7284] transition-colors hover:text-[#3345b8]" aria-label={t("storageZones.actions")}>
                    <ChevronRight size={16} />
                  </button>
                </div>

                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{zone.location}</p>
              </CardContent>
            </Card>
          );
        })}

        <Card className="border border-dashed border-[var(--border)] bg-transparent hover:bg-[var(--surface-muted)]">
          <CardContent
            onClick={() => setShowCreateForm(true)}
            className="flex h-full min-h-[170px] cursor-pointer flex-col items-center justify-center gap-3 p-5 text-center"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[#cfd4e6] text-[#3345b8]">
              <Plus size={18} />
            </span>
            <p className="text-lg font-semibold text-[var(--foreground)]">{t("storageZones.addPlace")}</p>
            <p className="max-w-[180px] text-xs leading-5 text-[var(--muted)]">{t("storageZones.addPlaceDescription")}</p>
          </CardContent>
        </Card>
      </section>

      {!loading && !error && classicZones.length === 0 ? (
        <Card className="mb-4 bg-[var(--surface)]">
          <CardContent className="p-6">
            <p className="text-sm text-[var(--muted)]">{t("storageZones.noZonesYet")}</p>
          </CardContent>
        </Card>
      ) : null}

      <Card className="bg-[var(--surface)]">
        <CardContent className="grid grid-cols-1 gap-4 p-5 md:grid-cols-3 md:items-center">
          <div className="text-center md:border-r md:border-[#eceff7]">
            <p className="text-4xl font-semibold text-[var(--primary)]">{zonesCount}</p>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{t("storageZones.zonesCount")}</p>
          </div>

          <div className="text-center md:border-r md:border-[#eceff7]">
            <p className="text-4xl font-semibold text-[var(--foreground)]">{totalItems}</p>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{t("storageZones.differentItems")}</p>
          </div>

          <button
            type="button"
            onClick={openAttentionModal}
            className="flex items-center justify-center gap-2 rounded-xl p-2 text-center transition-colors hover:bg-[#f4f6fb]"
          >
            <Trophy size={16} className={itemsWarning > 0 ? "text-[#b13535]" : "text-[#3345b8]"} />
            <p className="text-sm font-semibold text-[var(--foreground)]">
              {attentionLoading ? (
                <span className="text-[#3345b8]">{t("common.loading")}</span>
              ) : (
                <>
                  <span className={itemsWarning > 0 ? "text-[#b13535]" : "text-[#3345b8]"}>{t("storageZones.itemsNeedAttention", { count: itemsWarning })}</span>
                </>
              )}
            </p>
          </button>
        </CardContent>
      </Card>

      {showAttentionModal ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto overscroll-contain bg-black/40 p-3 pb-[calc(1rem+env(safe-area-inset-bottom))]"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowAttentionModal(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-[var(--foreground)]">{t("storageZones.itemsNeedingAttention")}</h2>
                <p className="text-sm text-[var(--muted)]">{t("storageZones.attentionSubtitle")}</p>
              </div>
              <button
                onClick={() => setShowAttentionModal(false)}
                className="rounded-full p-2 text-[#667086] transition-colors hover:bg-[#e9ecf5]"
                aria-label={t("common.close")}
              >
                <X size={16} />
              </button>
            </div>

            <Card className="bg-[var(--surface)]">
              <CardContent className="p-4">
                {attentionError ? <p className="mb-3 text-xs font-semibold text-[#b13535]">{attentionError}</p> : null}

                <div className="overflow-x-auto rounded-xl border border-[#e1e5f1]">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#f3f5fb] text-[#6a7185]">
                      <tr>
                        <th className="px-3 py-2 font-semibold">{t("storageZones.item")}</th>
                        <th className="px-3 py-2 font-semibold">{t("storageZones.stock")}</th>
                        <th className="px-3 py-2 font-semibold">{t("storageZones.zone")}</th>
                        <th className="px-3 py-2 font-semibold">{t("storageZones.zoneDetail")}</th>
                        <th className="px-3 py-2 font-semibold text-right">{t("storageZones.actions")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attentionLoading ? (
                        <tr>
                          <td colSpan={5} className="px-3 py-4 text-center text-[#8b92a6]">
                            {t("storageZones.loadingItems")}
                          </td>
                        </tr>
                      ) : attentionItems.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-3 py-4 text-center text-[#8b92a6]">
                            {t("storageZones.noAttention")}
                          </td>
                        </tr>
                      ) : (
                        attentionItems.map((item) => {
                          const draft = attentionDrafts[item.id] ?? {
                            name: item.name,
                            stock: item.stock,
                            zoneId: item.zoneId ? String(item.zoneId) : "",
                            zoneDetailId: item.zoneDetailId ? String(item.zoneDetailId) : "",
                          };

                          const zoneDetails = getDetailsForDraftZone(draft.zoneId);

                          return (
                            <tr key={item.id} className="border-t border-[#edf0f7] align-top">
                              <td className="px-3 py-2 min-w-[190px]">
                                <Input
                                  value={draft.name}
                                  onChange={(event) =>
                                    setAttentionDrafts((value) => ({
                                      ...value,
                                      [item.id]: { ...draft, name: event.target.value },
                                    }))
                                  }
                                />
                                <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-[#8b92a6]">{item.family}</p>
                              </td>
                              <td className="px-3 py-2 min-w-[140px]">
                                <Input
                                  value={draft.stock}
                                  onChange={(event) =>
                                    setAttentionDrafts((value) => ({
                                      ...value,
                                      [item.id]: { ...draft, stock: event.target.value },
                                    }))
                                  }
                                />
                              </td>
                              <td className="px-3 py-2 min-w-[170px]">
                                <select
                                  value={draft.zoneId}
                                  onChange={(event) =>
                                    setAttentionDrafts((value) => ({
                                      ...value,
                                      [item.id]: { ...draft, zoneId: event.target.value, zoneDetailId: "" },
                                    }))
                                  }
                                  className="h-10 w-full rounded-xl border border-[#d8dbe8] bg-[#f3f4f8] px-3 text-sm text-[#2a2d36]"
                                >
                                  <option value="">{t("storageZones.unassigned")}</option>
                                  {zones.map((zone) => (
                                    <option key={zone.id} value={zone.id}>
                                      {zone.name}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-3 py-2 min-w-[170px]">
                                <select
                                  value={draft.zoneDetailId}
                                  onChange={(event) =>
                                    setAttentionDrafts((value) => ({
                                      ...value,
                                      [item.id]: { ...draft, zoneDetailId: event.target.value },
                                    }))
                                  }
                                  disabled={!draft.zoneId}
                                  className="h-10 w-full rounded-xl border border-[#d8dbe8] bg-[#f3f4f8] px-3 text-sm text-[#2a2d36] disabled:opacity-50"
                                >
                                  <option value="">{t("storageZones.noDetail")}</option>
                                  {zoneDetails.map((detail) => (
                                    <option key={detail.id} value={detail.id}>
                                      {detail.label}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-3 py-2 text-right">
                                <Button
                                  type="button"
                                  onClick={() => onSaveAttentionItem(item.id)}
                                  disabled={updatingAttention}
                                  className="rounded-xl bg-[#3345b8] px-3 py-2 text-[11px] tracking-[0.08em] text-white disabled:opacity-60"
                                >
                                  {updatingAttention ? t("common.saving") : t("storageZones.save")}
                                </Button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {attentionSuccessMessage ? (
                  <p className="mt-3 text-xs font-semibold text-[#2f8f5a]">{attentionSuccessMessage}</p>
                ) : null}
                {attentionErrorMessage ? (
                  <p className="mt-3 text-xs font-semibold text-[#b13535]">{attentionErrorMessage}</p>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      {selectedZone ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto overscroll-contain bg-black/40 p-3 pb-[calc(1rem+env(safe-area-inset-bottom))]"
          role="dialog"
          aria-modal="true"
          onClick={closeZoneModal}
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-[var(--foreground)]">{selectedZone.name}</h2>
                <p className="text-sm text-[var(--muted)]">{t("storageZones.manageZone")}</p>
              </div>
              <button
                onClick={closeZoneModal}
                className="rounded-full p-2 text-[#667086] transition-colors hover:bg-[#e9ecf5]"
                aria-label={t("common.close")}
              >
                <X size={16} />
              </button>
            </div>

            <Card className="mb-4 bg-[var(--surface)]">
              <CardContent className="p-4">
                <form className="grid grid-cols-1 gap-3 md:grid-cols-2" onSubmit={onSaveZone}>
                  <Input
                    value={zoneEditValues.name}
                    onChange={(event) => setZoneEditValues((value) => ({ ...value, name: event.target.value }))}
                    placeholder={t("storageZones.zoneName")}
                    required
                  />
                  <Input
                    value={zoneEditValues.description}
                    onChange={(event) => setZoneEditValues((value) => ({ ...value, description: event.target.value }))}
                    placeholder={t("storageZones.descriptionField")}
                  />
                  {/* priority is managed internally; removed editable field */}

                  <div className="md:col-span-2">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{t("storageZones.icon")}</p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {ICON_OPTIONS.map((iconType) => {
                        const IconPreview = zoneIcons[iconType];

                        return (
                          <button
                            key={iconType}
                            type="button"
                            onClick={() => setZoneEditValues((value) => ({ ...value, icon: iconType }))}
                            className={`flex h-12 items-center justify-center rounded-xl border transition-colors ${
                              zoneEditValues.icon === iconType
                                ? "border-[#3345b8] bg-[#ebedf8] text-[#3345b8]"
                                : "border-[#d8dbe8] text-[#5f6576] hover:bg-[#f4f5f9]"
                            }`}
                            aria-label={t("storageZones.chooseIcon", { icon: iconType })}
                          >
                            <IconPreview size={17} />
                            <span className="sr-only">{iconType}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="md:col-span-2 flex items-center gap-2">
                    <Button
                      type="submit"
                      disabled={updating}
                      className="rounded-xl bg-[#3345b8] px-4 py-2 text-[11px] tracking-[0.08em] text-white disabled:opacity-60"
                    >
                      {updating ? t("common.saving") : t("storageZones.saveZone")}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="mb-4 bg-[var(--surface)]">
              <CardContent className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-[var(--foreground)]">{t("storageZones.zoneDetails")}</p>
                </div>

                <div className="mb-3 overflow-hidden rounded-xl border border-[#e1e5f1]">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#f3f5fb] text-[#6a7185]">
                      <tr>
                        <th className="px-3 py-2 font-semibold">{t("storageZones.label")}</th>
                        <th className="px-3 py-2 font-semibold text-right">{t("storageZones.actions")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedZone.details.length === 0 ? (
                        <tr>
                          <td colSpan={2} className="px-3 py-4 text-center text-[#8b92a6]">
                            {t("storageZones.noDetailsForZone")}
                          </td>
                        </tr>
                      ) : (
                        selectedZone.details.map((detail) => (
                          <tr key={detail.id} className="border-t border-[#edf0f7]">
                            <td className="px-3 py-2">
                              {editingDetailId === detail.id ? (
                                <Input
                                  value={editingDetailLabel}
                                  onChange={(event) => setEditingDetailLabel(event.target.value)}
                                  placeholder={t("storageZones.detailLabel")}
                                />
                              ) : (
                                <span className="text-[#1f2430]">{detail.label}</span>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center justify-end gap-1">
                                {editingDetailId === detail.id ? (
                                  <>
                                    <Button
                                      type="button"
                                      disabled={mutatingDetails}
                                      onClick={() => onSaveDetail(detail.id)}
                                      className="rounded-lg bg-[#3345b8] px-2 py-1 text-[10px] text-white"
                                    >
                                      {t("common.save")}
                                    </Button>
                                    <Button
                                      type="button"
                                      onClick={() => {
                                        setEditingDetailId(null);
                                        setEditingDetailLabel("");
                                      }}
                                      className="rounded-lg bg-[#e6e8f0] px-2 py-1 text-[10px] text-[#3b4150]"
                                    >
                                      {t("common.cancel")}
                                    </Button>
                                  </>
                                ) : (
                                  <CrudRowActions
                                    entityName={detail.label}
                                    onEdit={() => {
                                      setEditingDetailId(detail.id);
                                      setEditingDetailLabel(detail.label);
                                    }}
                                    onDelete={() => onDeleteDetail(detail.id)}
                                    iconSize={13}
                                    containerClassName="flex items-center justify-end gap-1"
                                    editButtonClassName="rounded-lg p-2 text-[#516080] hover:bg-[#eef1f8]"
                                    deleteButtonClassName="rounded-lg p-2 text-[#b13535] hover:bg-[#fbe8e8]"
                                  />
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <form onSubmit={onAddDetail} className="flex flex-wrap items-center gap-2">
                  <div className="min-w-[220px] flex-1">
                    <Input
                      value={newDetailLabel}
                      onChange={(event) => setNewDetailLabel(event.target.value)}
                      placeholder={t("storageZones.newDetailLabel")}
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={mutatingDetails}
                    className="rounded-xl bg-[#3345b8] px-4 py-2 text-[11px] tracking-[0.08em] text-white disabled:opacity-60"
                  >
                    {t("storageZones.addDetail")}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="border border-red-200 bg-[var(--surface)]">
              <CardContent className="p-4">
                <p className="text-sm font-semibold text-[#9e2d2d]">{t("storageZones.dangerZone")}</p>
                <p className="mt-1 text-xs text-[#7f4850]">{t("storageZones.deleteInstructions")}</p>

                <Button
                  type="button"
                  onClick={() => {
                    setDeleteConfirmText("");
                    setShowDeleteZoneDialog(true);
                  }}
                  className="mt-3 rounded-xl bg-[#b13535] px-4 py-2 text-[11px] tracking-[0.08em] text-white"
                >
                  {t("storageZones.deleteZone")}
                </Button>
              </CardContent>
            </Card>

            {modalSuccess ? <p className="mt-3 text-xs font-semibold text-[#2f8f5a]">{modalSuccess}</p> : null}
            {modalError ? <p className="mt-3 text-xs font-semibold text-[#b13535]">{modalError}</p> : null}
          </div>
        </div>
      ) : null}

      {deleteDetailId !== null ? (
        <ConfirmationDialog
          title={t("common.delete")}
          description={t("storageZones.deleteDetailConfirm")}
          confirmLabel={deleting ? t("common.loading") : t("common.delete")}
          cancelLabel={t("common.cancel")}
          onConfirm={confirmDeleteDetail}
          onCancel={() => setDeleteDetailId(null)}
          confirmDisabled={deleting}
          tone="danger"
        />
      ) : null}

      {showDeleteZoneDialog && selectedZone ? (
        <ConfirmationDialog
          title={t("storageZones.deleteZone")}
          description={t("storageZones.finalDeleteConfirm", { name: selectedZone.name })}
          confirmLabel={deleting ? t("storageZones.deleting") : t("storageZones.deleteZone")}
          cancelLabel={t("common.cancel")}
          onConfirm={confirmDeleteZone}
          onCancel={() => {
            setShowDeleteZoneDialog(false);
            setDeleteConfirmText("");
          }}
          confirmDisabled={deleting || deleteConfirmText.trim() !== selectedZone.name}
          tone="danger"
        >
          <Input
            value={deleteConfirmText}
            onChange={(event) => setDeleteConfirmText(event.target.value)}
            placeholder={t("storageZones.typeExactName", { name: selectedZone.name })}
          />
        </ConfirmationDialog>
      ) : null}
    </>
  );
}
