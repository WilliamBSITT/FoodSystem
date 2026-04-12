import { useMemo } from "react";
import { type InventoryItem } from "@/hooks/useInventory";
import { isExpiringSoon } from "@/lib/overview-utils";
import { buildSearchableText, normalizeSearchText } from "@/lib/search-normalization";

export type StatusFilter = "all" | "expiring";
export type SortMode = "created-asc" | "created-desc" | "alpha" | "family";

interface UseInventoryFiltersProps {
  items: InventoryItem[];
  searchQuery: string;
  statusFilter: StatusFilter;
  selectedFamilyFilter: string;
  selectedCategoryFilters: string[];
  selectedZoneFilters: string[];
  sortMode: SortMode;
}

interface UseInventoryFiltersReturn {
  visibleItems: InventoryItem[];
  sortedVisibleItems: InventoryItem[];
  categoryCounts: Map<string, number>;
  zoneCounts: Map<string, number>;
  stats: {
    totalItems: number;
    zonesCount: number;
    assignedItems: number;
    unassignedItems: number;
    storageCoverage: number;
  };
}

/**
 * Hook for managing inventory filtering, sorting, and statistics
 * Handles status, category, zone, and search-based filtering
 */
export function useInventoryFilters({
  items,
  searchQuery,
  statusFilter,
  selectedFamilyFilter,
  selectedCategoryFilters,
  selectedZoneFilters,
  sortMode,
}: UseInventoryFiltersProps): UseInventoryFiltersReturn {
  const normalizedSearch = normalizeSearchText(searchQuery);
  const itemsList = useMemo(() => items ?? [], [items]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();

    itemsList.forEach((item) => {
      if (statusFilter === "expiring" && !isExpiringSoon(item)) {
        return;
      }

      if (selectedFamilyFilter !== "all" && String(item.family_id ?? "") !== selectedFamilyFilter) {
        return;
      }

      if (typeof item.category_id === "number") {
        const key = String(item.category_id);
        counts.set(key, (counts.get(key) ?? 0) + 1);
      } else {
        counts.set("uncategorized", (counts.get("uncategorized") ?? 0) + 1);
      }
    });

    return counts;
  }, [itemsList, statusFilter, selectedFamilyFilter]);

  const zoneCounts = useMemo(() => {
    const counts = new Map<string, number>();

    itemsList.forEach((item) => {
      if (statusFilter === "expiring" && !isExpiringSoon(item)) {
        return;
      }

      if (selectedFamilyFilter !== "all" && String(item.family_id ?? "") !== selectedFamilyFilter) {
        return;
      }

      if (typeof item.zone?.id === "number") {
        const key = String(item.zone.id);
        counts.set(key, (counts.get(key) ?? 0) + 1);
      } else {
        counts.set("unassigned", (counts.get("unassigned") ?? 0) + 1);
      }
    });

    return counts;
  }, [itemsList, statusFilter, selectedFamilyFilter]);

  const visibleItems = useMemo(() => {
    return itemsList.filter((item) => {
      if (statusFilter === "expiring" && !isExpiringSoon(item)) return false;

      if (selectedFamilyFilter !== "all" && String(item.family_id ?? "") !== selectedFamilyFilter) {
        return false;
      }
      
      if (selectedCategoryFilters.length > 0) {
        const itemCategoryKey = typeof item.category_id === "number" ? String(item.category_id) : "uncategorized";
        if (!selectedCategoryFilters.includes(itemCategoryKey)) {
          return false;
        }
      }
      
      if (selectedZoneFilters.length > 0) {
        const itemZoneKey = typeof item.zone?.id === "number" ? String(item.zone.id) : "unassigned";
        if (!selectedZoneFilters.includes(itemZoneKey)) {
          return false;
        }
      }
      
      if (!normalizedSearch) return true;

      const searchable = buildSearchableText([
        item.name,
        item.family,
        item.value ?? "",
        item.category?.name ?? "",
        item.zone?.name ?? "",
        item.zone_detail?.label ?? "",
      ]);

      return searchable.includes(normalizedSearch);
    });
  }, [itemsList, statusFilter, selectedFamilyFilter, selectedCategoryFilters, selectedZoneFilters, normalizedSearch]);

  const sortedVisibleItems = useMemo(() => {
    const nextItems = [...visibleItems];

    if (sortMode === "alpha") {
      nextItems.sort((left, right) => left.name.localeCompare(right.name));
      return nextItems;
    }

    if (sortMode === "family") {
      nextItems.sort((left, right) => {
        const familyComparison = left.family.localeCompare(right.family);

        if (familyComparison !== 0) {
          return familyComparison;
        }

        return left.name.localeCompare(right.name);
      });

      return nextItems;
    }

    nextItems.sort((left, right) => {
      const leftTimeRaw = left.created_at;
      const rightTimeRaw = right.created_at;
      const leftTime = leftTimeRaw ? new Date(leftTimeRaw).getTime() : Number.POSITIVE_INFINITY;
      const rightTime = rightTimeRaw ? new Date(rightTimeRaw).getTime() : Number.POSITIVE_INFINITY;

      if (sortMode === "created-desc") {
        return rightTime - leftTime;
      }

      return leftTime - rightTime;
    });

    return nextItems;
  }, [sortMode, visibleItems]);

  const stats = useMemo(() => {
    const totalItems = sortedVisibleItems.length;
    const zonesCount = new Set(
      sortedVisibleItems.map((item) => item.zone?.id).filter((id): id is number => typeof id === "number"),
    ).size;
    const assignedItems = sortedVisibleItems.filter((item) => typeof item.zone?.id === "number").length;
    const unassignedItems = totalItems - assignedItems;
    const storageCoverage = totalItems === 0 ? 0 : Math.round((assignedItems / totalItems) * 100);

    return {
      totalItems,
      zonesCount,
      assignedItems,
      unassignedItems,
      storageCoverage,
    };
  }, [sortedVisibleItems]);

  return {
    visibleItems,
    sortedVisibleItems,
    categoryCounts,
    zoneCounts,
    stats,
  };
}
