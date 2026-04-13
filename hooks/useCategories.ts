"use client";

import { useEffect } from "react";
import { useCallback, useState } from "react";
import {
  invalidateClientCache,
  LOCAL_CACHE_KEYS,
  readClientCache,
  writeClientCache,
} from "@/lib/client-cache";
import type { Category } from "@/hooks/useInventory";
import { useCachedData } from "./useCachedData";
import { CategoryUsecase } from "@/lib/usecases/category-usecase";

const CATEGORIES_CACHE_MAX_AGE_MS = 30 * 60 * 1000;
const CATEGORIES_PAGE_SIZE = 50;

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = useCallback(async (page = 0, pageSize = CATEGORIES_PAGE_SIZE) => {
    const nextCategories = await CategoryUsecase.fetchCategoriesPage(page, pageSize);
    setCategories(nextCategories);
    return nextCategories;
  }, []);

  const verifyCategories = useCallback(
    async (refetch: (options?: { silent?: boolean }) => Promise<Category[]>) => {
      const remoteCount = await CategoryUsecase.fetchCategoryCount();

      const cacheEntry = readClientCache<Category[]>(LOCAL_CACHE_KEYS.categories);
      if (!cacheEntry) return;

      const idsChanged = remoteCount !== cacheEntry.data.length;

      if (idsChanged) {
        const result = await refetch({ silent: true });
        setCategories(result);
      }
    },
    [],
  );

  const { data, loading, refetch } = useCachedData<Category[]>({
    cacheKey: LOCAL_CACHE_KEYS.categories,
    maxAgeMs: CATEGORIES_CACHE_MAX_AGE_MS,
    fetchFn: () => fetchCategories(0, CATEGORIES_PAGE_SIZE),
    verifyFn: verifyCategories,
  });

  useEffect(() => {
    if (data && Array.isArray(data)) {
      setCategories(data);
    }
  }, [data]);

  const syncedCategories = categories;

  const createCategory = useCallback(
    async (payload: Omit<Category, "id">) => {
      setCreating(true);

      try {
        const created = await CategoryUsecase.createCategory(payload);
        const nextCategories = CategoryUsecase.sortByName([...syncedCategories, created]);
        setCategories(nextCategories);
        writeClientCache(LOCAL_CACHE_KEYS.categories, nextCategories);

        return created;
      } finally {
        setCreating(false);
      }
    },
    [syncedCategories],
  );

  const updateCategory = useCallback(
    async (id: number, payload: Omit<Category, "id">) => {
      setUpdating(true);

      try {
        const updated = await CategoryUsecase.updateCategory(id, payload);
        const nextCategories = CategoryUsecase.sortByName(
          syncedCategories.map((category) => (category.id === id ? updated : category))
        );

        setCategories(nextCategories);
        writeClientCache(LOCAL_CACHE_KEYS.categories, nextCategories);
        invalidateClientCache(LOCAL_CACHE_KEYS.inventoryItems);

        return updated;
      } finally {
        setUpdating(false);
      }
    },
    [syncedCategories],
  );

  const countCategoryInventoryItems = useCallback(async (id: number) => {
    return CategoryUsecase.countInventoryItemsByCategory(id);
  }, []);

  const deleteCategory = useCallback(
    async (id: number) => {
      setDeleting(true);

      try {
        await CategoryUsecase.deleteCategory(id);

        const nextCategories = syncedCategories.filter((category) => category.id !== id);
        setCategories(nextCategories);
        writeClientCache(LOCAL_CACHE_KEYS.categories, nextCategories);
        invalidateClientCache(LOCAL_CACHE_KEYS.inventoryItems);
      } finally {
        setDeleting(false);
      }
    },
    [syncedCategories],
  );

  return {
    categories: syncedCategories,
    loading,
    creating,
    updating,
    deleting,
    refetch,
    createCategory,
    updateCategory,
    countCategoryInventoryItems,
    deleteCategory,
  };
}