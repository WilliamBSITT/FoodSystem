"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  LOCAL_CACHE_KEYS,
  readClientCache,
} from "@/lib/client-cache";
import { supabase } from "@/lib/supabase";
import { usePaginatedData } from "./usePaginatedData";

export type Category = {
  id: number;
  name: string;
  icon: string;
  bg: string;
  color: string;
  keep_zero?: boolean;
  default_expiry_months?: number;
  default_expiry_days?: number;
  notify_on_expiry?: boolean;
};

export type StorageZoneDetail = {
  id: number;
  zone_id: number;
  label: string;
};

export type StorageZone = {
  id: number;
  name: string;
  description?: string;
  icon: string;
};

export type InventoryItem = {
  id: number;
  family: string;
  family_id?: number;
  name: string;
  stock: number;
  expiry: string | null;
  created_at?: string;
  value?: string;
  category_id?: number;
  zone_id?: number;
  zone_detail_id?: number;
  category?: Category;
  zone?: StorageZone;
  zone_detail?: StorageZoneDetail;
};

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

const SELECT_QUERY = `
  *,
  familly:familly(id,name,description),
  category:categories(*),
  zone:storage_zones(*),
  zone_detail:storage_zone_details(*)
`;

const INVENTORY_CACHE_MAX_AGE_MS = 10 * 60 * 1000;
const INVENTORY_PAGE_SIZE = 50;
const INVENTORY_SCHEMA_MISSING_MESSAGE =
  "L'inventaire est temporairement indisponible. Veuillez reessayer plus tard.";

function mapInventoryError(error: { code?: string; message?: string } | null): Error {
  if (error?.code === "42P01") {
    return new Error(INVENTORY_SCHEMA_MISSING_MESSAGE);
  }

  return new Error(error?.message ?? "Failed to load inventory data");
}

export function useInventory() {
  const [totalItemsCount, setTotalItemsCount] = useState(0);
  const didTryFamilyCacheRecoveryRef = useRef(false);

  const refreshTotalItemsCount = useCallback(async () => {
    const { count, error: countError } = await supabase
      .from("inventory_items")
      .select("id", { count: "exact", head: true });

    if (countError) {
      throw mapInventoryError(countError);
    }

    setTotalItemsCount(count ?? 0);
  }, []);

  const fetchItems = useCallback(async (pageNumber = 0, pageSize = INVENTORY_PAGE_SIZE) => {
    const from = pageNumber * pageSize;
    const to = from + pageSize - 1;

    const { data, error: fetchError } = await supabase
      .from("inventory_items")
      .select(SELECT_QUERY)
      .order("name")
      .range(from, to);

    if (fetchError) {
      throw mapInventoryError(fetchError);
    }

    const rows = (data ?? []) as InventoryItemRow[];
    const nextItems = rows.map((item) => ({
      ...item,
      family_id: typeof item.family_id === "number" ? item.family_id : undefined,
      family: resolveFamilyName(item.familly),
    }));

    return nextItems;
  }, []);

  const verifyItems = useCallback(
    async (refetch: (options?: { silent?: boolean }) => Promise<InventoryItem[]>) => {

      const { data, error: verifyError } = await supabase
        .from("inventory_items")
        .select("id")
        .order("name")
        .range(0, INVENTORY_PAGE_SIZE - 1);

      if (verifyError) {
        throw mapInventoryError(verifyError);
      }

      const cacheEntry = readClientCache<InventoryItem[]>(LOCAL_CACHE_KEYS.inventoryItems);
      if (!cacheEntry) return;

      const remoteIds = ((data as Array<{ id: number }> | null) ?? []).map((item) => item.id);
      const cachedFirstPageIds = cacheEntry.data.slice(0, INVENTORY_PAGE_SIZE).map((item) => item.id);

      const idsChanged =
        remoteIds.length !== cachedFirstPageIds.length || remoteIds.some((id, index) => id !== cachedFirstPageIds[index]);

      if (idsChanged) {
        await refetch({ silent: true });
      }
    },
    [],
  );

  const {
    items,
    loading,
    loadingMore,
    hasMore,
    error,
    refetch: baseRefetch,
    loadMore,
  } = usePaginatedData<InventoryItem>({
    cacheKey: LOCAL_CACHE_KEYS.inventoryItems,
    maxAgeMs: INVENTORY_CACHE_MAX_AGE_MS,
    pageSize: INVENTORY_PAGE_SIZE,
    fetchPage: fetchItems,
    verifyFn: verifyItems,
  });

  useEffect(() => {
    if (didTryFamilyCacheRecoveryRef.current || !items.length) {
      return;
    }

    const hasLegacyUnknownFamily = items.some(
      (item) => Boolean(item.family_id) && item.family.trim().toLowerCase() === "unknown family",
    );

    if (!hasLegacyUnknownFamily) {
      return;
    }

    didTryFamilyCacheRecoveryRef.current = true;
    void baseRefetch({ silent: true });
  }, [baseRefetch, items]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refreshTotalItemsCount();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [refreshTotalItemsCount]);

  const refetch = useCallback(
    async (options?: { silent?: boolean }) => {
      const refreshedItems = await baseRefetch(options);
      const nextItems = refreshedItems ?? [];
      await refreshTotalItemsCount();
      return nextItems;
    },
    [baseRefetch, refreshTotalItemsCount],
  );

  return {
    items,
    totalItemsCount,
    loading,
    error,
    refetch,
    loadMore,
    hasMore,
    loadingMore,
    pageSize: INVENTORY_PAGE_SIZE,
  };
}