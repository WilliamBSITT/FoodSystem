"use client";

import { type CSSProperties, useEffect, useMemo, useRef } from "react";
import { ShoppingCart, Plus, ClipboardList } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { AddItemModal } from "@/components/shopping-list/add-item-modal";
import { ShoppingListFilters } from "@/components/shopping-list/shopping-list-filters";
import { ShoppingListTable } from "@/components/shopping-list/shopping-list-table";
import { UndoToastContainer } from "@/components/shopping-list/undo-toast-container";
import { SwipeableRow } from "@/components/shopping-list/swipeable-row";
import { BottomToast } from "@/components/ui/bottom-toast";
import { type ShoppingItem } from "@/components/shopping-list/types";
import { useAutoDismissToast } from "@/hooks/useAutoDismissToast";
import { useCategories } from "@/hooks/useCategories";
import { useShoppingList } from "@/hooks/useShoppingList";
import { useShoppingListUI } from "@/hooks/useShoppingListUI";
import { useI18n } from "@/components/providers/i18n-provider";
import { buildSearchableText, normalizeSearchText } from "@/lib/search-normalization";

const HEX_COLOR_REGEX = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})/;

function extractHexColor(value: string | null | undefined) {
  return value?.match(HEX_COLOR_REGEX)?.[0] ?? null;
}

export default function Page() {
  const { t } = useI18n();
  const { searchQuery, setSearchQuery, modalState, setModalState, activeFilter, setActiveFilter } = useShoppingListUI();
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);
  const { toastMessage, showToast } = useAutoDismissToast();
  const { categories: dbCategories } = useCategories();
  const {
    items,
    totalRemainingCount,
    hasMore,
    loading,
    loadingMore,
    error,
    undoToasts,
    loadMore,
    checkItemWithUndo,
    undoCheckedItem,
    deleteItem,
    addItem,
    editItem,
  } = useShoppingList({ loadFailedMessage: t("shoppingList.loadFailed") });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!hasMore || loading || loadingMore || !loadMoreSentinelRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;

        if (entry?.isIntersecting) {
          loadMore();
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
  }, [hasMore, loadMore, loading, loadingMore]);

  const normalizedSearch = normalizeSearchText(searchQuery);

  const visibleItems = useMemo(() => items.filter((item) => {
    if (item.checked) return false;
    if (!normalizedSearch) return true;
    return buildSearchableText([item.name, item.category?.name ?? ""]).includes(normalizedSearch);
  }), [items, normalizedSearch]);

  const presentCategories = useMemo(() => Array.from(
    new Set(visibleItems.map((item) => item.category_id).filter((id): id is number => typeof id === "number")),
  ), [visibleItems]);

  const filteredItems = useMemo(() =>
    activeFilter === "__none__"
      ? visibleItems.filter((item) => !item.category_id)
      : activeFilter
        ? visibleItems.filter((item) => item.category_id === Number(activeFilter))
        : visibleItems,
  [activeFilter, visibleItems]);

  const displayRemainingCount = useMemo(() =>
    hasMore ? totalRemainingCount : visibleItems.length,
  [hasMore, totalRemainingCount, visibleItems]);

  const filters = useMemo(() => [
    { key: null, label: t("shoppingList.all"), count: displayRemainingCount },
    ...presentCategories.map((catId) => {
      const cat = dbCategories.find((c) => c.id === catId);
      return {
        key: String(catId),
        label: cat?.name ?? "Unknown",
        count: visibleItems.filter((item) => item.category_id === catId).length,
      };
    }),
    ...(visibleItems.some((item) => !item.category_id)
      ? [{ key: "__none__", label: t("shoppingList.uncategorized"), count: visibleItems.filter((item) => !item.category_id).length }]
      : []),
  ], [displayRemainingCount, presentCategories, visibleItems, dbCategories, t]);

  const categoryTagStyleByName = useMemo<Record<string, CSSProperties>>(() => {
    const styleByName: Record<string, CSSProperties> = {};

    dbCategories.forEach((category) => {
      const backgroundColor = extractHexColor(category.bg);
      const color = extractHexColor(category.color);

      if (!backgroundColor && !color) {
        return;
      }

      styleByName[category.name] = {
        ...(backgroundColor ? { backgroundColor } : {}),
        ...(color ? { color } : {}),
      };
    });

    return styleByName;
  }, [dbCategories]);

  const styledFilters = useMemo(() => filters.map((filter) => {
    let style: CSSProperties | undefined;
    if (filter.key && filter.key !== "__none__") {
      const catId = Number(filter.key);
      const cat = dbCategories.find((c) => c.id === catId);
      style = cat ? categoryTagStyleByName[cat.name] : undefined;
    }
    return { ...filter, style };
  }), [filters, dbCategories, categoryTagStyleByName]);

  const modalCategoryOptions = useMemo(() => {
    return dbCategories.map((cat) => ({ id: cat.id, name: cat.name }));
  }, [dbCategories]);

  const handleCheck = checkItemWithUndo;

  const handleUndo = undoCheckedItem;

  const handleDelete = async (id: number) => {
    const deleted = await deleteItem(id);

    if (deleted) {
      showToast(t("shoppingList.itemDeleted"));
    }
  };

  const handleAdd = async (data: Omit<ShoppingItem, "id" | "checked">) => {
    const added = await addItem(data);

    if (added) {
      showToast(t("shoppingList.itemAdded"));
    }
  };

  const handleEdit = (data: Omit<ShoppingItem, "id" | "checked">) => {
    const editingItem = modalState.editingItem;

    if (!editingItem) return;

    void (async () => {
      const updated = await editItem(editingItem.id, data);

      if (updated) {
        showToast(t("shoppingList.itemUpdated"));
      }
    })();
  };

  return (
    <ProtectedRoute>
      <DashboardLayout
        activeItem="shopping-list"
        showTopbar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      >

            <section className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">{t("shoppingList.pageLabel")}</p>
                  <h1 className="mt-1 text-[32px] font-bold leading-tight text-[var(--foreground)]">{t("shoppingList.title")}</h1>
                  <p className="mt-1 text-sm text-[var(--muted)]">{t("shoppingList.subtitle")}</p>
              </div>
                <div className="mt-3 flex items-center gap-3 rounded-2xl bg-[var(--surface)] px-4 py-3 shadow-sm sm:mt-0">
                  <ShoppingCart size={16} className="text-[var(--primary)]" />
                <div>
                    <p className="text-xs text-[var(--muted)]">{t("shoppingList.remaining")}</p>
                    <p className="text-sm font-semibold text-[var(--foreground)]">{t("shoppingList.totalItems", { count: displayRemainingCount })}</p>
                </div>
              </div>
            </section>

            <ShoppingListFilters filters={styledFilters} activeFilter={activeFilter} onChange={setActiveFilter} />

            {/* Mobile list */}
            <div className="block md:hidden">
              <div className="overflow-hidden rounded-3xl bg-[var(--surface)] shadow-sm">
                <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-4">
                  <div className="flex items-center gap-2">
                    <ClipboardList size={15} className="text-[var(--primary)]" />
                    <span className="text-sm font-semibold text-[var(--foreground)]">{t("shoppingList.itemsToBuy")}</span>
                    <span className="rounded-full bg-[var(--primary-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--primary)]">
                      {displayRemainingCount}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalState({ showModal: true, editingItem: undefined })}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--primary)] text-[var(--background)]"
                    aria-label={t("shoppingList.addItem")}
                  >
                    <Plus size={13} />
                    <span className="sr-only">{t("shoppingList.addItem")}</span>
                  </button>
                </div>

                {/* Column headers */}
                <div className="grid grid-cols-[1fr_3rem] gap-3 border-b border-[var(--border)] px-4 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{t("shoppingList.item")}</p>
                  <p className="text-right text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{t("shoppingList.qty")}</p>
                </div>

                {loading && <p className="px-4 py-8 text-center text-sm text-[var(--muted)]">{t("shoppingList.loading")}</p>}
                {error && <p className="px-4 py-8 text-center text-sm text-red-400">{error}</p>}
                {!loading && !error && filteredItems.length === 0 && (
                  <p className="px-4 py-8 text-center text-sm text-[var(--muted)]">
                    {activeFilter ? t("shoppingList.noItemsCategory") : `${t("shoppingList.noItems")} — ${t("shoppingList.addFirstItem")}`}
                  </p>
                )}

                {filteredItems.map((item, index) => (
                  <SwipeableRow
                    key={item.id}
                    item={item}
                    categoryStyleByName={categoryTagStyleByName}
                    isLast={index === filteredItems.length - 1}
                    onCheck={() => handleCheck(item)}
                    onEdit={() => setModalState({ showModal: true, editingItem: item })}
                    onDelete={() => handleDelete(item.id)}
                  />
                ))}

                {items.length > 0 && (
                  <p className="px-4 py-3 text-xs text-[var(--muted)]">{t("shoppingList.totalItems", { count: displayRemainingCount })}</p>
                )}
              </div>

            </div>

            {/* Desktop table */}
            <div className="hidden md:block">
              <ShoppingListTable
                items={filteredItems}
                categoryStyleByName={categoryTagStyleByName}
                totalItems={displayRemainingCount}
                activeFilter={activeFilter}
                loading={loading}
                error={error}
                onAdd={() => setModalState({ showModal: true, editingItem: undefined })}
                onCheck={handleCheck}
                onEdit={(item) => setModalState({ showModal: true, editingItem: item })}
                onDelete={handleDelete}
              />
            </div>

            {!loading && !error && hasMore && (
              <>
                <div ref={loadMoreSentinelRef} className="h-1" />
                <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-[var(--primary)] px-5 text-sm font-medium text-[var(--background)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loadingMore ? t("common.loading") : t("shoppingList.loadMore")}
                </button>
                </div>
              </>
            )}
      </DashboardLayout>

        <UndoToastContainer undoToasts={undoToasts} onUndo={handleUndo} />
        <BottomToast
          message={toastMessage}
          bottomOffsetClassName="bottom-[calc(7rem+env(safe-area-inset-bottom))] lg:bottom-6"
        />

        {modalState.showModal ? (
          <AddItemModal
            onClose={() => setModalState({ showModal: false, editingItem: undefined })}
            onSave={modalState.editingItem ? handleEdit : handleAdd}
            initial={modalState.editingItem}
            categories={modalCategoryOptions}
          />
        ) : null}
    </ProtectedRoute>
  );
}
