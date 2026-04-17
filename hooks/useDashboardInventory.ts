"use client";

import { useCallback, useEffect } from "react";
import { useCachedData } from "./useCachedData";
import { LOCAL_CACHE_KEYS, subscribeToClientCacheInvalidation } from "@/lib/client-cache";
import { supabase } from "@/lib/supabase";
import type { InventoryItem } from "./useInventory";

const SELECT_QUERY = `
  *,
  familly:familly(id,name,description),
  category:categories(*),
  zone:storage_zones(*),
  zone_detail:storage_zone_details(*)
`;

const DASHBOARD_FETCH_BATCH_SIZE = 1000;
const DASHBOARD_INVENTORY_CACHE_MAX_AGE_MS = 5 * 60 * 1000;

type FamilyRelation = {
  id: number;
  name: string;
  description?: string | null;
};

type InventoryItemRow = Omit<InventoryItem, "family"> & {
  family_id?: number | null;
  familly?: FamilyRelation[] | FamilyRelation | null;
};

function resolveFamilyName(familyRelation: InventoryItemRow["familly"]): string {
  if (!familyRelation) {
    return "—";
  }

  if (Array.isArray(familyRelation)) {
    return familyRelation[0]?.name ?? "—";
  }

  return familyRelation.name ?? "—";
}

function mapInventoryRows(rows: InventoryItemRow[]): InventoryItem[] {
  return rows.map((item) => ({
    ...item,
    family_id: typeof item.family_id === "number" ? item.family_id : undefined,
    family: resolveFamilyName(item.familly),
  }));
}

async function fetchAllInventoryItems() {
  const { count, error: countError } = await supabase
    .from("inventory_items")
    .select("id", { count: "exact", head: true });

  if (countError) {
    throw new Error(countError.message ?? "Failed to load inventory data");
  }

  const totalCount = count ?? 0;

  if (totalCount === 0) {
    return [] as InventoryItem[];
  }

  const rows: InventoryItemRow[] = [];

  for (let from = 0; from < totalCount; from += DASHBOARD_FETCH_BATCH_SIZE) {
    const to = Math.min(from + DASHBOARD_FETCH_BATCH_SIZE - 1, totalCount - 1);

    const { data, error: fetchError } = await supabase
      .from("inventory_items")
      .select(SELECT_QUERY)
      .order("id", { ascending: true })
      .range(from, to);

    if (fetchError) {
      throw new Error(fetchError.message ?? "Failed to load inventory data");
    }

    rows.push(...((data ?? []) as InventoryItemRow[]));
  }

  return mapInventoryRows(rows);
}

export function useDashboardInventory() {
  const { data, loading, error, refetch } = useCachedData<InventoryItem[]>({
    cacheKey: LOCAL_CACHE_KEYS.dashboardInventory,
    maxAgeMs: DASHBOARD_INVENTORY_CACHE_MAX_AGE_MS,
    fetchFn: useCallback(async () => {
      return fetchAllInventoryItems();
    }, []),
  });

  useEffect(() => {
    return subscribeToClientCacheInvalidation(LOCAL_CACHE_KEYS.dashboardInventory, () => {
      void refetch({ silent: true });
    });
  }, [refetch]);

  return {
    items: data ?? [],
    loading,
    error,
    refetch,
  };
}