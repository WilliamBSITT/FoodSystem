"use client";

import { useCallback, useEffect, useState } from "react";
import {
  invalidateClientCaches,
  LOCAL_CACHE_KEYS,
  readClientCache,
  writeClientCache,
} from "@/lib/client-cache";
import { useCachedData } from "./useCachedData";
import { FamilyUsecase } from "@/lib/usecases/family-usecase";
import { type FamilyOption } from "@/lib/repositories/family-repository";

type FamilyPayload = {
  name: string;
  description?: string | null;
};

const FAMILIES_CACHE_MAX_AGE_MS = 30 * 60 * 1000;
const FAMILIES_PAGE_SIZE = 50;

export type { FamilyOption };

export function useFamilies() {
  const [families, setFamilies] = useState<FamilyOption[]>([]);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchFamilies = useCallback(async (page = 0, pageSize = FAMILIES_PAGE_SIZE) => {
    return FamilyUsecase.fetchFamiliesPage(page, pageSize);
  }, []);

  const verifyFamilies = useCallback(
    async (refetch: (options?: { silent?: boolean }) => Promise<FamilyOption[]>) => {
      const remoteCount = await FamilyUsecase.fetchFamilyCount();

      const cacheEntry = readClientCache<FamilyOption[]>(LOCAL_CACHE_KEYS.families);
      if (!cacheEntry) return;

      const idsChanged = remoteCount !== cacheEntry.data.length;

      if (idsChanged) {
        await refetch({ silent: true });
      }
    },
    [],
  );

  const { data, loading, error, refetch } = useCachedData<FamilyOption[]>({
    cacheKey: LOCAL_CACHE_KEYS.families,
    maxAgeMs: FAMILIES_CACHE_MAX_AGE_MS,
    fetchFn: () => fetchFamilies(0, FAMILIES_PAGE_SIZE),
    verifyFn: verifyFamilies,
  });

  useEffect(() => {
    if (data && Array.isArray(data)) {
      setFamilies(data);
    }
  }, [data]);

  const syncedFamilies = families;

  const createFamily = useCallback(
    async (payload: FamilyPayload) => {
      setCreating(true);

      try {
        const created = await FamilyUsecase.createFamily(payload.name, payload.description);
        const nextFamilies = FamilyUsecase.sortByName([...syncedFamilies, created]);
        setFamilies(nextFamilies);
        writeClientCache(LOCAL_CACHE_KEYS.families, nextFamilies);

        return created;
      } finally {
        setCreating(false);
      }
    },
    [syncedFamilies],
  );

  const updateFamily = useCallback(
    async (id: number, payload: FamilyPayload) => {
      setUpdating(true);

      try {
        const updated = await FamilyUsecase.updateFamily(id, payload.name, payload.description);
        const nextFamilies = FamilyUsecase.sortByName(
          syncedFamilies.map((family) => (family.id === id ? updated : family))
        );

        setFamilies(nextFamilies);
        writeClientCache(LOCAL_CACHE_KEYS.families, nextFamilies);
        invalidateClientCaches([LOCAL_CACHE_KEYS.inventoryItems, LOCAL_CACHE_KEYS.attentionItems]);
        return updated;
      } finally {
        setUpdating(false);
      }
    },
    [syncedFamilies],
  );

  const deleteFamily = useCallback(async (id: number) => {
    setDeleting(true);

    try {
      await FamilyUsecase.deleteFamily(id);

      const nextFamilies = syncedFamilies.filter((family) => family.id !== id);
      setFamilies(nextFamilies);
      writeClientCache(LOCAL_CACHE_KEYS.families, nextFamilies);
      invalidateClientCaches([LOCAL_CACHE_KEYS.inventoryItems, LOCAL_CACHE_KEYS.attentionItems]);
    } finally {
      setDeleting(false);
    }
  }, [syncedFamilies]);

  return {
    families: syncedFamilies,
    loading,
    creating,
    updating,
    deleting,
    error,
    refetch,
    createFamily,
    updateFamily,
    deleteFamily,
  };
}
