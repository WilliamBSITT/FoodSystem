"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronUp, Funnel, House, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BorderedSelect } from "@/components/ui/bordered-select";
import { BottomToast } from "@/components/ui/bottom-toast";
import { InventoryItemForm } from "./inventory-item-form";
import { InventoryCard } from "./inventory-card";
import { useInventory, type InventoryItem } from "@/hooks/useInventory";
import { useDashboardInventory } from "@/hooks/useDashboardInventory";
import { useCategories } from "@/hooks/useCategories";
import { useFamilies } from "@/hooks/useFamilies";
import { useStorageZones } from "@/hooks/useStorageZones";
import { useEditInventoryItem } from "@/hooks/useEditInventoryItem";
import { useInventoryFilters, type SortMode, type StatusFilter } from "@/hooks/useInventoryFilters";
import { useAutoDismissToast } from "@/hooks/useAutoDismissToast";
import { useInventoryViewMode } from "@/hooks/useInventoryViewMode";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { useI18n } from "@/components/providers/i18n-provider";

interface InventoryContentProps {
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  initialStatusFilter?: StatusFilter;
  initialFamilyFilter?: string;
  initialCategoryFilters?: string[];
  initialZoneFilters?: string[];
  initialSortMode?: SortMode;
}

type EditMode = "quantity-only" | "full";

export function InventoryContent({
  searchQuery = "",
  onSearchChange,
  initialStatusFilter = "all",
  initialFamilyFilter = "all",
  initialCategoryFilters = [],
  initialZoneFilters = [],
  initialSortMode = "created-asc",
}: InventoryContentProps) {
  const { items, totalItemsCount, loading, error, refetch, hasMore, loadMore, loadingMore } = useInventory();
  const { items: dashboardItems, loading: dashboardLoading } = useDashboardInventory();
  const { categories } = useCategories();
  const { families } = useFamilies();
  const { zones } = useStorageZones();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(initialStatusFilter);
  const [selectedFamilyFilter, setSelectedFamilyFilter] = useState(initialFamilyFilter);
  const [selectedCategoryFilters, setSelectedCategoryFilters] = useState<string[]>(initialCategoryFilters);
  const [selectedZoneFilters, setSelectedZoneFilters] = useState<string[]>(initialZoneFilters);
  const [sortMode, setSortMode] = useState<SortMode>(initialSortMode);
  const { toastMessage, showToast } = useAutoDismissToast();
  const { viewMode } = useInventoryViewMode();
  const { t } = useI18n();
  const { showBackToTop, scrollToTop } = useScrollToTop();
  const [editMode, setEditMode] = useState<EditMode>("quantity-only");
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);

  const edit = useEditInventoryItem({ onSuccess: refetch, onCompleted: showToast, categories });

  const { visibleItems, sortedVisibleItems, categoryCounts, zoneCounts, stats } = useInventoryFilters({
    items,
    searchQuery,
    statusFilter,
    selectedFamilyFilter,
    selectedCategoryFilters,
    selectedZoneFilters,
    sortMode,
  });

  const { zonesCount, unassignedItems, storageCoverage } = stats;
  const uncategorizedLabel = t("inventory.uncategorized");
  const itemsCount = totalItemsCount;
  const stockedItems = useMemo(() => {
    return dashboardItems.reduce((accumulator, item) => accumulator + (Number(item.stock) || 0), 0);
  }, [dashboardItems]);

  const groupedItems = useMemo(() => {
    const groups = new Map<string, InventoryItem[]>();

    sortedVisibleItems.forEach((item) => {
      const groupName = item.category?.name ?? "Uncategorized";
      const current = groups.get(groupName) ?? [];
      current.push(item);
      groups.set(groupName, current);
    });

    return Array.from(groups.entries()).sort(([left], [right]) => left.localeCompare(right));
  }, [sortedVisibleItems]);

  function toggleCategoryFilter(value: string) {
    setSelectedCategoryFilters((current) => {
      if (current.includes(value)) {
        return current.filter((entry) => entry !== value);
      }
      return [...current, value];
    });
  }

  function toggleZoneFilter(value: string) {
    setSelectedZoneFilters((current) => {
      if (current.includes(value)) {
        return current.filter((entry) => entry !== value);
      }
      return [...current, value];
    });
  }

  function openQuantityOnlyEdit(item: InventoryItem) {
    setEditMode("quantity-only");
    edit.open(item);
  }

  const selectedCategorySummary = selectedCategoryFilters.length === 0
    ? t("inventory.allFeminine")
    : t("inventory.selectedSummary", {
      count: selectedCategoryFilters.length,
      plural: selectedCategoryFilters.length > 1 ? "s" : "",
    });
  const selectedZoneSummary = selectedZoneFilters.length === 0
    ? t("inventory.allFeminine")
    : t("inventory.selectedSummary", {
      count: selectedZoneFilters.length,
      plural: selectedZoneFilters.length > 1 ? "s" : "",
    });

  const handleAutoLoadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) {
      return;
    }

    void loadMore();
  }, [hasMore, loadMore, loading, loadingMore]);

  useEffect(() => {
    if (!hasMore || loading || loadingMore || !loadMoreSentinelRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;

        if (entry?.isIntersecting) {
          handleAutoLoadMore();
        }
      },
      {
        root: null,
        rootMargin: "120px 0px",
        threshold: 0.1,
      },
    );

    observer.observe(loadMoreSentinelRef.current);

    return () => {
      observer.disconnect();
    };
  }, [handleAutoLoadMore, hasMore, loading, loadingMore]);

  return (
    <>
      <section className="mb-6">
        <h1 className="text-[34px] font-semibold text-[var(--foreground)]">{t("inventory.currentStock")}</h1>
        <p className="mt-1 text-lg text-[var(--muted)]">
          {t("inventory.subtitle")}
        </p>
      </section>

      <section className="mb-5 hidden grid-cols-1 gap-4 lg:grid xl:grid-cols-[1.7fr_0.8fr]">
        <Card className="bg-[var(--surface)]">
          <CardContent className="grid grid-cols-1 gap-5 p-5 md:grid-cols-[0.95fr_1.35fr]">
            <div className="flex h-40 w-full items-center justify-center rounded-3xl bg-[radial-gradient(circle_at_50%_60%,color-mix(in_srgb,var(--primary-soft)_82%,white)_0,color-mix(in_srgb,var(--primary-soft)_60%,white)_48%,color-mix(in_srgb,var(--primary-soft)_40%,white)_100%)] dark:bg-[radial-gradient(circle_at_50%_60%,rgba(99,102,241,0.24)_0,rgba(99,102,241,0.16)_48%,rgba(99,102,241,0.08)_100%)]">
              <House size={54} className="text-[var(--primary)]" />
            </div>
            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">{t("inventory.overview")}</p>
                <Badge className="rounded-xl px-3 py-1 text-[11px]">{t("inventory.liveData")}</Badge>
              </div>
              <h2 className="text-4xl font-semibold leading-tight text-[var(--foreground)]">{t("inventory.warehouseSnapshot")}</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">
                {t("inventory.centralView")}
              </p>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-[var(--muted)]">{t("inventory.itemsInStock")}</p>
                  <p className="text-3xl font-semibold text-[var(--foreground)]">
                    {dashboardLoading ? "…" : stockedItems.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--muted)]">{t("inventory.storageZones")}</p>
                  <p className="text-4xl font-semibold text-[var(--foreground)]">{zonesCount}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--muted)]">{t("inventory.unassignedItems")}</p>
                  <p className="text-4xl font-semibold text-[var(--primary)]">{unassignedItems}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-[#3345b8] text-white">
          <CardContent className="p-6">
            <h3 className="text-3xl font-semibold">{t("inventory.storageCoverage")}</h3>
            <p className="mt-2 text-sm text-white/80">
              {unassignedItems > 0
                ? t("inventory.needAssignment", { count: unassignedItems, plural: unassignedItems > 1 ? "s" : "" })
                : t("inventory.allAssigned")}
            </p>
            <div className="mt-16">
              <p className="text-6xl font-semibold">
                {storageCoverage}<span className="text-2xl">%</span>
              </p>
              <Progress value={storageCoverage} className="mt-2 bg-white/30" barClassName="bg-white" />
            </div>
          </CardContent>
          <div className="pointer-events-none absolute -bottom-8 -right-6 h-44 w-44 rounded-full bg-white/10" />
        </Card>
      </section>

      <section className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
        <div className="mb-4">
          <Input
            className="max-w-full"
            placeholder={t("topbar.searchInventory")}
            value={searchQuery}
            onChange={onSearchChange ? (e) => onSearchChange(e.target.value) : undefined}
            startIcon={<Search size={14} className="text-[#7f8392]" />}
            clearable
            onClear={onSearchChange ? () => onSearchChange("") : undefined}
            clearAriaLabel={t("common.clear")}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.9fr_0.9fr_1fr]">
          <div className="space-y-2">
            <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--foreground)]">
              <Funnel size={14} />
              {t("inventory.category")}
            </p>
            <details className="group relative w-full max-w-[260px]">
              <summary className="flex h-10 w-full cursor-pointer list-none items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 text-sm text-[var(--foreground)]">
                <span className="truncate">{selectedCategorySummary}</span>
                <span className="text-xs text-[var(--muted)]">▾</span>
              </summary>
              <div className="absolute left-0 top-[calc(100%+8px)] z-20 w-[280px] rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-lg">
                <button
                  type="button"
                  className="mb-2 w-full rounded-lg bg-[var(--surface-muted)] px-2 py-1 text-left text-xs font-medium text-[var(--foreground)]"
                  onClick={() => setSelectedCategoryFilters([])}
                >
                  {t("inventory.allCategories", { count: itemsCount })}
                </button>

                <div className="max-h-56 space-y-1 overflow-auto pr-1">
                  {categories.map((category) => {
                    const value = String(category.id);
                    const checked = selectedCategoryFilters.includes(value);

                    return (
                      <label key={category.id} className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-[var(--surface-muted)]">
                        <span className="text-sm text-[var(--foreground)]">{category.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[var(--muted)]">{categoryCounts.get(value) ?? 0}</span>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleCategoryFilter(value)}
                            className="h-4 w-4 accent-[#3345b8]"
                          />
                        </div>
                      </label>
                    );
                  })}

                  <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-[var(--surface-muted)]">
                    <span className="text-sm text-[var(--foreground)]">{uncategorizedLabel}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--muted)]">{categoryCounts.get("uncategorized") ?? 0}</span>
                      <input
                        type="checkbox"
                        checked={selectedCategoryFilters.includes("uncategorized")}
                        onChange={() => toggleCategoryFilter("uncategorized")}
                        className="h-4 w-4 accent-[#3345b8]"
                      />
                    </div>
                  </label>
                </div>
              </div>
            </details>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-[var(--foreground)]">{t("inventory.familyFilter")}</p>
            <div className="w-full max-w-[260px]">
              <BorderedSelect
                value={selectedFamilyFilter}
                onChange={(event) => setSelectedFamilyFilter(event.target.value)}
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
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-[var(--foreground)]">{t("inventory.zone")}</p>
            <details className="group relative w-full max-w-[260px]">
              <summary className="flex h-10 w-full cursor-pointer list-none items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 text-sm text-[var(--foreground)]">
                <span className="truncate">{selectedZoneSummary}</span>
                <span className="text-xs text-[var(--muted)]">▾</span>
              </summary>
              <div className="absolute left-0 top-[calc(100%+8px)] z-20 w-[280px] rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-lg">
                <button
                  type="button"
                  className="mb-2 w-full rounded-lg bg-[var(--surface-muted)] px-2 py-1 text-left text-xs font-medium text-[var(--foreground)]"
                  onClick={() => setSelectedZoneFilters([])}
                >
                  {t("inventory.allZones", { count: itemsCount })}
                </button>

                <div className="max-h-56 space-y-1 overflow-auto pr-1">
                  {zones.map((zone) => {
                    const value = String(zone.id);
                    const checked = selectedZoneFilters.includes(value);

                    return (
                      <label key={zone.id} className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-[var(--surface-muted)]">
                        <span className="text-sm text-[var(--foreground)]">{zone.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[var(--muted)]">{zoneCounts.get(value) ?? 0}</span>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleZoneFilter(value)}
                            className="h-4 w-4 accent-[#3345b8]"
                          />
                        </div>
                      </label>
                    );
                  })}

                  <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-[var(--surface-muted)]">
                    <span className="text-sm text-[var(--foreground)]">{t("inventory.noZone")}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--muted)]">{zoneCounts.get("unassigned") ?? 0}</span>
                      <input
                        type="checkbox"
                        checked={selectedZoneFilters.includes("unassigned")}
                        onChange={() => toggleZoneFilter("unassigned")}
                        className="h-4 w-4 accent-[#3345b8]"
                      />
                    </div>
                  </label>
                </div>
              </div>
            </details>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-[var(--foreground)]">{t("inventory.filter")}</p>
            <div className="w-full max-w-[260px]">
              <BorderedSelect
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value as typeof sortMode)}
                className="h-10"
              >
                <option value="created-asc">{t("inventory.dateFreezeOldNew")}</option>
                <option value="created-desc">{t("inventory.dateFreezeNewOld")}</option>
                <option value="alpha">{t("inventory.alphabetical")}</option>
              </BorderedSelect>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-4 text-sm text-[#5a6070]">
          <span>{t("inventory.status")}:</span>
          <button
            onClick={() => setStatusFilter("all")}
            className="h-7 rounded-full px-3 text-xs font-medium transition-colors"
            style={statusFilter === "all" ? { background: "var(--primary)", color: "white" } : { background: "var(--surface-strong)", color: "var(--foreground)" }}
          >
            {t("common.all")}
          </button>
          <button
            onClick={() => setStatusFilter(statusFilter === "expiring" ? "all" : "expiring")}
            className="h-7 rounded-full px-3 text-xs font-medium transition-colors"
            style={statusFilter === "expiring" ? { background: "var(--danger)", color: "white" } : { background: "var(--surface-strong)", color: "var(--foreground)" }}
          >
            {t("inventory.expiringSoonOnly")}
          </button>
        </div>
      </section>

      {viewMode === "grouped" ? (
        <section className="space-y-8">
          {loading && <p className="py-12 text-center text-sm text-[var(--muted)]">{t("inventory.loading")}</p>}
          {error && <p className="py-12 text-center text-sm text-red-500">{t("common.error")}: {error}</p>}
          {!loading && !error && groupedItems.length === 0 && (
            <p className="py-12 text-center text-sm text-[var(--muted)]">{t("inventory.noItems")}</p>
          )}

          {!loading && !error && groupedItems.map(([categoryName, categoryItems]) => (
            <div key={categoryName}>
              <h2 className="mb-3 text-2xl font-semibold text-[var(--foreground)]">{categoryName}</h2>
              <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {categoryItems.map((item) => (
                  <InventoryCard
                    key={item.id}
                    item={item}
                    onEditQuantity={openQuantityOnlyEdit}
                  />
                ))}
              </section>
            </div>
          ))}
        </section>
      ) : (
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading && <p className="col-span-3 py-12 text-center text-sm text-[var(--muted)]">{t("inventory.loading")}</p>}
        {error && <p className="col-span-3 py-12 text-center text-sm text-red-500">{t("common.error")}: {error}</p>}
        {!loading && !error && visibleItems.length === 0 && (
          <p className="col-span-3 py-12 text-center text-sm text-[var(--muted)]">{t("inventory.noItems")}</p>
        )}
        {!loading && !error && sortedVisibleItems.map((item: InventoryItem) => (
          <InventoryCard
            key={item.id}
            item={item}
            onEditQuantity={openQuantityOnlyEdit}
          />
        ))}
      </section>
      )}

      {!loading && !error && hasMore && <div ref={loadMoreSentinelRef} className="h-1" />}
      {!loading && !error && loadingMore && (
        <p className="mt-4 text-center text-sm text-[var(--muted)]">{t("common.loading")}</p>
      )}

      {edit.editingItem && (
        <InventoryItemForm
          item={edit.editingItem}
          editName={edit.fields.editName}
          editFamily={edit.fields.editFamily}
          editStock={edit.fields.editStock}
          editExpiry={edit.fields.editExpiry}
          editCreatedAt={edit.fields.editCreatedAt}
          editValue={edit.fields.editValue}
          editCategoryId={edit.fields.editCategoryId}
          editZoneId={edit.fields.editZoneId}
          editZoneDetailId={edit.fields.editZoneDetailId}
          onNameChange={edit.setters.setEditName}
          onFamilyChange={edit.setters.setEditFamily}
          onStockChange={edit.setters.setEditStock}
          onExpiryChange={edit.setters.setEditExpiry}
          onCreatedAtChange={edit.setters.setEditCreatedAt}
          onValueChange={edit.setters.setEditValue}
          onCategoryChange={edit.setters.setEditCategoryId}
          onZoneChange={edit.setters.setEditZoneId}
          onZoneDetailChange={edit.setters.setEditZoneDetailId}
          onSave={edit.save}
          onCancel={edit.close}
          isSaving={edit.isSaving}
          error={edit.saveError}
          showDeleteConfirmation={edit.showDeleteConfirmation}
          onConfirmDelete={edit.confirmDelete}
          onCancelDelete={edit.continueWithoutShoppingList}
          pendingDelete={edit.pendingDelete}
          canForceDelete={Boolean(edit.editingItem.category?.keep_zero)}
          showForceDeleteConfirmation={edit.showForceDeleteConfirmation}
          onRequestForceDelete={edit.requestForceDelete}
          onConfirmForceDelete={edit.forceDelete}
          onCancelForceDelete={edit.cancelForceDelete}
          pendingForceDelete={edit.pendingForceDelete}
          categories={categories}
          zones={zones}
          mode={editMode}
          onSwitchToFullEdit={editMode === "quantity-only" ? () => setEditMode("full") : undefined}
        />
      )}

      {showBackToTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-24 right-6 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--primary)] text-white shadow-md transition hover:opacity-90"
          aria-label={t("inventory.backToTop")}
          title={t("inventory.backToTop")}
        >
          <ChevronUp size={18} />
        </button>
      )}

      <BottomToast message={toastMessage} />
    </>
  );
}