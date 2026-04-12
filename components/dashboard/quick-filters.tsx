import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Archive,
  Boxes,
  Leaf,
  Package,
  Plus,
  RefreshCw,
  Snowflake,
  Timer,
  Trash2,
  Warehouse,
  Wheat,
} from "lucide-react";
import { HexColorPicker } from "react-colorful";
import { useI18n } from "@/components/providers/i18n-provider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BorderedSelect } from "@/components/ui/bordered-select";
import { useCategories } from "@/hooks/useCategories";
import { useFamilies } from "@/hooks/useFamilies";
import { useStorageZones } from "@/hooks/useStorageZones";
import { useDashboardQuickFilters } from "@/hooks/useDashboardQuickFilters";
import {
  buildInventoryFilterHref,
  createQuickFilterDraft,
  decodeAdvancedInventoryQuery,
  encodeAdvancedInventoryQuery,
  getQuickFilterIcon,
  type QuickFilterDraft,
  type QuickFilterIconName,
  type QuickFilterKind,
} from "@/lib/quick-filters-config";
import type { SortMode, StatusFilter } from "@/hooks/useInventoryFilters";

type TranslateFn = ReturnType<typeof useI18n>["t"];

type QuickFilterOption = {
  id: string;
  label: string;
  kind: QuickFilterKind;
};

const QUICK_FILTER_ICON_OPTIONS: Array<{ name: QuickFilterIconName; icon: typeof Package }> = [
  { name: "Package", icon: Package },
  { name: "Boxes", icon: Boxes },
  { name: "Leaf", icon: Leaf },
  { name: "Wheat", icon: Wheat },
  { name: "Warehouse", icon: Warehouse },
  { name: "Snowflake", icon: Snowflake },
  { name: "Timer", icon: Timer },
  { name: "Archive", icon: Archive },
];

const QUICK_FILTER_SORT_OPTIONS: SortMode[] = ["created-asc", "created-desc", "alpha"];

function createOption(kind: QuickFilterKind, id: string, label: string): QuickFilterOption {
  return { kind, id, label };
}

function defaultTargetValue(kind: QuickFilterKind, options: Record<QuickFilterKind, QuickFilterOption[]>) {
  if (kind === "status") {
    return "expiring";
  }

  return options[kind][0]?.id ?? (kind === "category" ? "uncategorized" : kind === "zone" ? "unassigned" : "all");
}

function buildInitialDraft(kind: QuickFilterKind, options: Record<QuickFilterKind, QuickFilterOption[]>) {
  return createQuickFilterDraft(kind, defaultTargetValue(kind, options));
}

function getTargetOptions(
  categories: Array<{ id: number; name: string }>,
  families: Array<{ id: number; name: string }>,
  zones: Array<{ id: number; name: string }>,
  t: TranslateFn,
): Record<QuickFilterKind, QuickFilterOption[]> {
  return {
    status: [createOption("status", "expiring", t("quickFilters.expiring.label"))],
    category: [
      ...categories.map((category) => createOption("category", String(category.id), category.name)),
      createOption("category", "uncategorized", t("inventory.uncategorized")),
    ],
    family: families.map((family) => createOption("family", String(family.id), family.name)),
    zone: [
      ...zones.map((zone) => createOption("zone", String(zone.id), zone.name)),
      createOption("zone", "unassigned", t("inventory.noZone")),
    ],
  };
}

function resolveTargetLabel(draft: QuickFilterDraft, t: TranslateFn) {
  if (draft.customTitle.trim().length > 0) {
    return draft.customTitle.trim();
  }

  if (draft.kind === "status") {
    return t("quickFilters.expiring.label");
  }

  return t("quickFilters.customTitleFallback");
}

function resolveTargetDescription(draft: QuickFilterDraft, t: TranslateFn) {
  if (draft.customDescription.trim().length > 0) {
    return draft.customDescription.trim();
  }

  if (draft.kind === "status") {
    return t("quickFilters.expiring.description");
  }

  return t("quickFilters.customDescriptionFallback");
}

function resolveTargetHref(draft: QuickFilterDraft) {
  return buildInventoryFilterHref(draft.kind, draft.targetValue);
}

function parseCsvParam(values: string[]): string[] {
  const parsedValues: string[] = [];

  values.forEach((value) => {
    value
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0)
      .forEach((entry) => {
        if (!parsedValues.includes(entry)) {
          parsedValues.push(entry);
        }
      });
  });

  return parsedValues;
}

type AdvancedQuickFilterTarget = {
  statusFilter: StatusFilter;
  selectedFamilyFilter: string;
  selectedCategoryFilters: string[];
  selectedZoneFilters: string[];
  sortMode: SortMode;
};

function parseSortMode(value: string | null): SortMode {
  if (value === "created-desc" || value === "alpha" || value === "family") {
    return value;
  }

  return "created-asc";
}

function buildAdvancedTargetValue(target: AdvancedQuickFilterTarget): string {
  const params = new URLSearchParams();

  if (target.statusFilter === "expiring") {
    params.set("status", "expiring");
  }

  if (target.selectedFamilyFilter !== "all") {
    params.set("family", target.selectedFamilyFilter);
  }

  if (target.selectedCategoryFilters.length > 0) {
    params.set("categoryIds", target.selectedCategoryFilters.join(","));
  }

  if (target.selectedZoneFilters.length > 0) {
    params.set("zoneIds", target.selectedZoneFilters.join(","));
  }

  if (target.sortMode !== "created-asc") {
    params.set("sort", target.sortMode);
  }

  return encodeAdvancedInventoryQuery(params);
}

function parseAdvancedTarget(draft: QuickFilterDraft): AdvancedQuickFilterTarget {
  const defaults: AdvancedQuickFilterTarget = {
    statusFilter: "all",
    selectedFamilyFilter: "all",
    selectedCategoryFilters: [],
    selectedZoneFilters: [],
    sortMode: "created-asc",
  };

  const advancedQuery = decodeAdvancedInventoryQuery(draft.targetValue);

  if (advancedQuery) {
    return {
      statusFilter: advancedQuery.get("status") === "expiring" ? "expiring" : "all",
      selectedFamilyFilter: advancedQuery.get("family")?.trim() || "all",
      selectedCategoryFilters: parseCsvParam([
        ...advancedQuery.getAll("categoryIds"),
        ...advancedQuery.getAll("categoryId"),
      ]),
      selectedZoneFilters: parseCsvParam([
        ...advancedQuery.getAll("zoneIds"),
        ...advancedQuery.getAll("zoneId"),
      ]),
      sortMode: parseSortMode(advancedQuery.get("sort")),
    };
  }

  if (draft.kind === "status") {
    return {
      ...defaults,
      statusFilter: draft.targetValue === "expiring" ? "expiring" : "all",
    };
  }

  if (draft.kind === "family") {
    return {
      ...defaults,
      selectedFamilyFilter: draft.targetValue || "all",
    };
  }

  if (draft.kind === "zone") {
    return {
      ...defaults,
      selectedZoneFilters: draft.targetValue ? [draft.targetValue] : [],
    };
  }

  return {
    ...defaults,
    selectedCategoryFilters: draft.targetValue ? [draft.targetValue] : [],
  };
}

function getSortLabel(t: TranslateFn, value: SortMode): string {
  if (value === "created-desc") {
    return t("inventory.dateFreezeNewOld");
  }

  if (value === "alpha") {
    return t("inventory.alphabetical");
  }

  if (value === "family") {
    return t("inventory.familyFilter");
  }

  return t("inventory.dateFreezeOldNew");
}

function resolvePreviewStyle(accentColor: string) {
  return {
    backgroundColor: `color-mix(in srgb, ${accentColor} 12%, var(--surface))`,
    borderColor: `color-mix(in srgb, ${accentColor} 22%, var(--border))`,
  } as const;
}

function normalizeHexColor(value: string, fallback: string): string {
  const normalized = value.trim();
  const validHex = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

  if (validHex.test(normalized)) {
    return normalized;
  }

  return fallback;
}

type QuickFiltersEditorProps = {
  initialDrafts: QuickFilterDraft[];
  loadingSavedFilters: boolean;
  saving: boolean;
  error: string | null;
  saveFilters: (nextFilters: QuickFilterDraft[]) => Promise<boolean>;
  loadFilters: () => Promise<QuickFilterDraft[]>;
};

function QuickFiltersEditor({
  initialDrafts,
  saving,
  error,
  saveFilters,
  loadFilters,
}: QuickFiltersEditorProps) {
  const { t } = useI18n();
  const { categories, loading: loadingCategories } = useCategories();
  const { families, loading: loadingFamilies } = useFamilies();
  const { zones, loading: loadingZones } = useStorageZones();
  const [showConfigurator, setShowConfigurator] = useState(false);
  const [drafts, setDrafts] = useState<QuickFilterDraft[]>(() => initialDrafts);
  const [editingFilterId, setEditingFilterId] = useState<string | null>(null);

  const targetOptions = useMemo(
    () => getTargetOptions(categories, families, zones, t),
    [categories, families, t, zones],
  );

  const renderedFilters = drafts.filter((draft) => draft.kind && draft.targetValue);
  const isLoadingOptions = loadingCategories || loadingFamilies || loadingZones;

  function updateDraft(id: string, updater: (current: QuickFilterDraft) => QuickFilterDraft) {
    setDrafts((current) => current.map((draft) => (draft.id === id ? updater(draft) : draft)));
  }

  function addDraft() {
    const defaultKind = categories.length > 0 ? "category" : families.length > 0 ? "family" : zones.length > 0 ? "zone" : "status";
    const nextDraft = buildInitialDraft(defaultKind, targetOptions);

    // For category quick-filters, start with no category selected by default
    // so the editor shows no checkboxes checked unless the user chooses one.
    if (defaultKind === "category") {
      nextDraft.targetValue = "";
    }
    setDrafts((current) => [...current, nextDraft]);
    setEditingFilterId(nextDraft.id);
    setShowConfigurator(true);
  }

  async function removeDraft(id: string) {
    const previousDrafts = drafts;
    const nextDrafts = previousDrafts.filter((draft) => draft.id !== id);

    setDrafts(nextDrafts);
    setEditingFilterId((current) => (current === id ? null : current));

    const sanitized = nextDrafts.map((draft) => ({
      ...draft,
      targetValue: draft.targetValue.trim(),
      customTitle: draft.customTitle.trim(),
      customDescription: draft.customDescription.trim(),
    }));

    const success = await saveFilters(sanitized);

    if (!success) {
      setDrafts(previousDrafts);
      return;
    }

    const refreshed = await loadFilters();
    setDrafts(refreshed);
    setEditingFilterId((current) => (current && refreshed.some((draft) => draft.id === current) ? current : null));
  }

  function updateAdvancedTarget(id: string, updater: (current: AdvancedQuickFilterTarget) => AdvancedQuickFilterTarget) {
    updateDraft(id, (current) => {
      const nextTarget = updater(parseAdvancedTarget(current));

      return {
        ...current,
        targetValue: buildAdvancedTargetValue(nextTarget),
      };
    });
  }

  function updateStatusFilter(id: string, value: StatusFilter) {
    updateAdvancedTarget(id, (current) => ({
      ...current,
      statusFilter: value,
    }));
  }

  function updateFamilyFilter(id: string, value: string) {
    updateAdvancedTarget(id, (current) => ({
      ...current,
      selectedFamilyFilter: value,
    }));
  }

  function toggleCategoryFilter(id: string, value: string) {
    updateAdvancedTarget(id, (current) => ({
      ...current,
      selectedCategoryFilters: current.selectedCategoryFilters.includes(value)
        ? current.selectedCategoryFilters.filter((entry) => entry !== value)
        : [...current.selectedCategoryFilters, value],
    }));
  }

  function toggleZoneFilter(id: string, value: string) {
    updateAdvancedTarget(id, (current) => ({
      ...current,
      selectedZoneFilters: current.selectedZoneFilters.includes(value)
        ? current.selectedZoneFilters.filter((entry) => entry !== value)
        : [...current.selectedZoneFilters, value],
    }));
  }

  function updateSortMode(id: string, value: SortMode) {
    updateAdvancedTarget(id, (current) => ({
      ...current,
      sortMode: value,
    }));
  }

  function updateIcon(id: string, icon: QuickFilterIconName) {
    updateDraft(id, (current) => ({ ...current, icon }));
  }

  function updateColor(id: string, accentColor: string) {
    updateDraft(id, (current) => ({ ...current, accentColor }));
  }

  function updateCustomTitle(id: string, customTitle: string) {
    updateDraft(id, (current) => ({ ...current, customTitle }));
  }

  function updateCustomDescription(id: string, customDescription: string) {
    updateDraft(id, (current) => ({ ...current, customDescription }));
  }

  async function onSave() {
    const sanitized = drafts.map((draft) => ({
      ...draft,
      targetValue: draft.targetValue.trim(),
      customTitle: draft.customTitle.trim(),
      customDescription: draft.customDescription.trim(),
    }));

    const success = await saveFilters(sanitized);

    if (success) {
      setDrafts(sanitized);
      setShowConfigurator(false);
      setEditingFilterId(null);
      await loadFilters();
    }
  }

  return (
    <section className="mt-6 mb-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--foreground)]">{t("quickFilters.title")}</h2>
          <p className="text-xs text-[var(--muted)]">{t("quickFilters.subtitle")}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--muted-strong)]"
            onClick={addDraft}
            aria-label={t("quickFilters.addFilter")}
            title={t("quickFilters.addFilter")}
          >
            <Plus size={14} />
          </Button>
          <Button
            className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border ${
              showConfigurator
                ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
                : "border-[var(--border)] bg-[var(--surface-muted)] text-[var(--muted-strong)]"
            }`}
            onClick={() => {
              setShowConfigurator((current) => {
                const next = !current;

                if (!next) {
                  setEditingFilterId(null);
                }

                return next;
              });
            }}
            aria-label={showConfigurator ? t("quickFilters.closeConfig") : t("quickFilters.configure")}
            title={showConfigurator ? t("quickFilters.closeConfig") : t("quickFilters.configure")}
          >
            <RefreshCw size={14} />
          </Button>
          {showConfigurator ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--primary)] bg-[var(--primary-soft)] px-3 py-2 text-xs font-semibold text-[var(--primary)]">
              {t("quickFilters.configMode")}
            </span>
          ) : null}
        </div>
      </div>

      {error ? <p className="mb-3 text-sm font-medium text-[#b13c3c]">{t("quickFilters.saveFailed", { error })}</p> : null}

      {showConfigurator ? (
        <div className="mb-4 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-3">
          {isLoadingOptions ? (
            <p className="text-sm text-[var(--muted)]">{t("quickFilters.loadingOptions")}</p>
          ) : drafts.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-[var(--muted)]">{t("quickFilters.noneSelected")}</p>
              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-[var(--background)] shadow-sm transition-opacity hover:opacity-90"
                  onClick={onSave}
                  disabled={saving}
                >
                  <RefreshCw size={14} />
                  {t("quickFilters.save")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="rounded-xl border border-dashed border-[var(--primary-soft)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--muted-strong)]">
                {t("quickFilters.clickCardToEdit")}
              </p>

              {drafts.map((draft, index) => {
                const previewStyle = resolvePreviewStyle(draft.accentColor);
                const isEditing = editingFilterId === draft.id;
                const Icon = getQuickFilterIcon(draft.icon);

                return (
                  <div
                    key={draft.id}
                    className={`rounded-2xl border bg-[var(--surface)] p-3 transition-all ${
                      isEditing ? "border-[var(--primary)] ring-2 ring-[var(--primary-soft)]" : "border-[var(--border)]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setEditingFilterId(draft.id)}
                      className="w-full text-left"
                    >
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                          {t("quickFilters.slotLabel", { count: index + 1 })}
                        </p>
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                            isEditing
                              ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                              : "bg-[var(--surface-muted)] text-[var(--muted)]"
                          }`}
                        >
                          {isEditing ? t("quickFilters.editing") : t("quickFilters.tapToEdit")}
                        </span>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/70" style={{ color: draft.accentColor }}>
                          <Icon size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                            {resolveTargetLabel(draft, t)}
                          </p>
                          <p className="line-clamp-1 text-xs text-[var(--muted)]">
                            {resolveTargetDescription(draft, t)}
                          </p>
                        </div>
                      </div>
                    </button>

                    {isEditing ? (
                      <div className="mt-4 space-y-3 border-t border-[var(--border)] pt-4">
                        <div className="grid gap-3 lg:grid-cols-[1.1fr_1fr]">
                          <div className="space-y-3">
                            <div>
                              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{t("quickFilters.combinedCriteriaTitle")}</p>
                              <p className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--muted-strong)]">
                                {t("quickFilters.combinedCriteriaDesc")}
                              </p>
                            </div>

                            <div>
                              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{t("quickFilters.customTitle")}</p>
                              <Input
                                value={draft.customTitle}
                                onChange={(event) => updateCustomTitle(draft.id, event.target.value)}
                                placeholder={t("quickFilters.customTitlePlaceholder")}
                                maxLength={80}
                              />
                            </div>

                            <div>
                              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{t("quickFilters.customDescription")}</p>
                              <Input
                                value={draft.customDescription}
                                onChange={(event) => updateCustomDescription(draft.id, event.target.value)}
                                placeholder={t("quickFilters.customDescriptionPlaceholder")}
                                maxLength={120}
                              />
                            </div>

                            <div>
                              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{t("inventory.filter")}</p>
                              {(() => {
                                const advancedTarget = parseAdvancedTarget(draft);

                                return (
                                  <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                                    <div>
                                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{t("inventory.status")}</p>
                                      <BorderedSelect
                                        value={advancedTarget.statusFilter}
                                        onChange={(event) => updateStatusFilter(draft.id, event.target.value as StatusFilter)}
                                        className="h-10"
                                      >
                                        <option value="all">{t("common.all")}</option>
                                        <option value="expiring">{t("inventory.expiringSoonOnly")}</option>
                                      </BorderedSelect>
                                    </div>

                                    <div>
                                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{t("inventory.familyFilter")}</p>
                                      <BorderedSelect
                                        value={advancedTarget.selectedFamilyFilter}
                                        onChange={(event) => updateFamilyFilter(draft.id, event.target.value)}
                                        className="h-10"
                                      >
                                        <option value="all">{t("inventory.allFamilies")}</option>
                                        {families.map((family) => (
                                          <option key={family.id} value={String(family.id)}>
                                            {family.name}
                                          </option>
                                        ))}
                                      </BorderedSelect>
                                    </div>

                                    <div>
                                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{t("inventory.category")}</p>
                                      <details className="group rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                                        <summary className="flex h-10 cursor-pointer list-none items-center justify-between px-3 text-sm text-[var(--foreground)]">
                                          <span>
                                            {advancedTarget.selectedCategoryFilters.length === 0
                                              ? t("inventory.allFeminine")
                                              : t("inventory.selectedSummary", {
                                                count: advancedTarget.selectedCategoryFilters.length,
                                                plural: advancedTarget.selectedCategoryFilters.length > 1 ? "s" : "",
                                              })}
                                          </span>
                                          <span className="text-xs text-[var(--muted)] transition-transform group-open:rotate-180">▾</span>
                                        </summary>
                                        <div className="max-h-36 space-y-1 overflow-auto border-t border-[var(--border)] px-2 py-2 pr-3">
                                          {targetOptions.category.map((option) => {
                                            const checked = advancedTarget.selectedCategoryFilters.includes(option.id);

                                            return (
                                              <label
                                                key={option.id}
                                                className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-[var(--surface-muted)]"
                                              >
                                                <span className="min-w-0 text-sm text-[var(--foreground)]">{option.label}</span>
                                                <input
                                                  type="checkbox"
                                                  checked={checked}
                                                  onChange={() => toggleCategoryFilter(draft.id, option.id)}
                                                  className="h-4 w-4 shrink-0 accent-[#3345b8]"
                                                />
                                              </label>
                                            );
                                          })}
                                        </div>
                                      </details>
                                    </div>

                                    <div>
                                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{t("inventory.zone")}</p>
                                      <details className="group rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                                        <summary className="flex h-10 cursor-pointer list-none items-center justify-between px-3 text-sm text-[var(--foreground)]">
                                          <span>
                                            {advancedTarget.selectedZoneFilters.length === 0
                                              ? t("inventory.allFeminine")
                                              : t("inventory.selectedSummary", {
                                                count: advancedTarget.selectedZoneFilters.length,
                                                plural: advancedTarget.selectedZoneFilters.length > 1 ? "s" : "",
                                              })}
                                          </span>
                                          <span className="text-xs text-[var(--muted)] transition-transform group-open:rotate-180">▾</span>
                                        </summary>
                                        <div className="max-h-36 space-y-1 overflow-auto border-t border-[var(--border)] px-2 py-2 pr-3">
                                          {targetOptions.zone.map((option) => {
                                            const checked = advancedTarget.selectedZoneFilters.includes(option.id);

                                            return (
                                              <label
                                                key={option.id}
                                                className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-[var(--surface-muted)]"
                                              >
                                                <span className="min-w-0 text-sm text-[var(--foreground)]">{option.label}</span>
                                                <input
                                                  type="checkbox"
                                                  checked={checked}
                                                  onChange={() => toggleZoneFilter(draft.id, option.id)}
                                                  className="h-4 w-4 shrink-0 accent-[#3345b8]"
                                                />
                                              </label>
                                            );
                                          })}
                                        </div>
                                      </details>
                                    </div>

                                    <div>
                                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{t("inventory.filter")}</p>
                                      <BorderedSelect
                                        value={advancedTarget.sortMode}
                                        onChange={(event) => updateSortMode(draft.id, event.target.value as SortMode)}
                                        className="h-10"
                                      >
                                        {QUICK_FILTER_SORT_OPTIONS.map((sortOption) => (
                                          <option key={sortOption} value={sortOption}>
                                            {getSortLabel(t, sortOption)}
                                          </option>
                                        ))}
                                      </BorderedSelect>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>

                          </div>

                          <div className="space-y-3">
                            <div>
                              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{t("quickFilters.color")}</p>
                              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                                <HexColorPicker
                                  color={normalizeHexColor(draft.accentColor, "#3345b8")}
                                  onChange={(hex) => updateColor(draft.id, hex)}
                                  className="!h-[170px] !w-full"
                                />
                                <div className="mt-2">
                                  <Input
                                    value={draft.accentColor}
                                    onChange={(event) => updateColor(draft.id, event.target.value)}
                                    placeholder="#3345b8"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-red-300 bg-red-50 text-red-600 hover:bg-red-100"
                                onClick={() => {
                                  void removeDraft(draft.id);
                                }}
                                disabled={saving}
                                aria-label={t("quickFilters.remove")}
                              >
                                <Trash2 size={14} />
                                {t("quickFilters.remove")}
                              </Button>
                            </div>

                            <div>
                              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{t("quickFilters.preview")}</p>
                              <div className="flex items-center gap-4 rounded-2xl border p-4" style={previewStyle}>
                                <div
                                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/70"
                                  style={{ color: draft.accentColor }}
                                >
                                  <Icon size={20} />
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                                    {resolveTargetLabel(draft, t)}
                                  </p>
                                  <p className="line-clamp-2 text-xs text-[var(--muted)]">
                                    {resolveTargetDescription(draft, t)}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div>
                              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{t("quickFilters.icon")}</p>
                              <div className="grid grid-cols-4 gap-2">
                                {QUICK_FILTER_ICON_OPTIONS.map((iconOption) => {
                                  const IconButton = iconOption.icon;
                                  const selected = draft.icon === iconOption.name;

                                  return (
                                    <button
                                      key={iconOption.name}
                                      type="button"
                                      onClick={() => updateIcon(draft.id, iconOption.name)}
                                      className={`flex h-12 items-center justify-center rounded-xl border transition-colors ${
                                        selected
                                          ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
                                          : "border-[var(--border)] bg-[var(--surface-muted)] text-[var(--muted-strong)] hover:bg-[var(--surface-strong)]"
                                      }`}
                                      aria-label={iconOption.name}
                                    >
                                      <IconButton size={16} />
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-[var(--background)] shadow-sm transition-opacity hover:opacity-90"
                  onClick={onSave}
                  disabled={saving}
                >
                  <RefreshCw size={14} />
                  {t("quickFilters.save")}
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {renderedFilters.length === 0 ? <p className="text-sm text-[var(--muted)]">{t("quickFilters.noneSelected")}</p> : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {renderedFilters.map((draft) => {
          const Icon = getQuickFilterIcon(draft.icon);
          const targetLabel = resolveTargetLabel(draft, t);
          const previewStyle = resolvePreviewStyle(draft.accentColor);

          return (
            <Link
              key={draft.id}
              href={resolveTargetHref(draft)}
              className="flex items-center gap-4 rounded-2xl border px-5 py-4 transition-opacity hover:opacity-80"
              style={previewStyle}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/70" style={{ color: draft.accentColor }}>
                <Icon size={20} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--foreground)]">{targetLabel}</p>
                <p className="line-clamp-2 text-xs text-[var(--muted)]">{resolveTargetDescription(draft, t)}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function QuickFilters() {
  const { filters: savedFilters, loading: loadingSavedFilters, saving, error, saveFilters, loadFilters } = useDashboardQuickFilters();

  const draftsKey = useMemo(() => {
    if (loadingSavedFilters) {
      return "loading";
    }

    return savedFilters
      .map((draft) => [draft.id, draft.kind, draft.targetValue, draft.customTitle, draft.customDescription, draft.icon, draft.accentColor].join("::"))
      .join("||");
  }, [loadingSavedFilters, savedFilters]);

  return (
    <QuickFiltersEditor
      key={draftsKey}
      initialDrafts={savedFilters}
      loadingSavedFilters={loadingSavedFilters}
      saving={saving}
      error={error}
      saveFilters={saveFilters}
      loadFilters={loadFilters}
    />
  );
}