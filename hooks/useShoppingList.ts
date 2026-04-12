"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { type ShoppingItem, type UndoToast } from "@/components/shopping-list/types";
import {
  LOCAL_CACHE_KEYS,
  readClientCache,
  writeClientCache,
} from "@/lib/client-cache";
import { SHOPPING_LIST_UNDO_DELAY_MS } from "@/lib/constants";
import {
  addShoppingItem,
  deleteShoppingItem,
  fetchShoppingItemsPage,
  fetchShoppingRemainingCount,
  type ShoppingListMutationInput,
  updateShoppingItem,
} from "@/lib/shopping-list-service";
import { usePaginatedData } from "./usePaginatedData";

const SHOPPING_LIST_PAGE_SIZE = 50;
const SHOPPING_LIST_CACHE_MAX_AGE_MS = 5 * 60 * 1000;

type ShoppingListCachePayload = {
  items: ShoppingItem[];
  totalRemainingCount: number;
  page: number;
  hasMore: boolean;
};

interface UseShoppingListOptions {
  loadFailedMessage: string;
}

export function useShoppingList({ loadFailedMessage }: UseShoppingListOptions) {
  const cachedShoppingList = readClientCache<ShoppingListCachePayload | ShoppingItem[]>(LOCAL_CACHE_KEYS.shoppingListItems);
  const [totalRemainingCount, setTotalRemainingCount] = useState(() => {
    if (cachedShoppingList && !Array.isArray(cachedShoppingList.data)) {
      return cachedShoppingList.data.totalRemainingCount ?? 0;
    }

    return 0;
  });
  const [undoToasts, setUndoToasts] = useState<UndoToast[]>([]);
  const remainingCountRef = useRef(totalRemainingCount);

  const setRemainingCount = useCallback((nextCount: number) => {
    remainingCountRef.current = nextCount;
    setTotalRemainingCount(nextCount);
  }, []);

  const {
    items,
    page,
    hasMore,
    loading,
    loadingMore,
    error,
    loadMore,
    updateItems,
  } = usePaginatedData<ShoppingItem>({
    cacheKey: LOCAL_CACHE_KEYS.shoppingListItems,
    maxAgeMs: SHOPPING_LIST_CACHE_MAX_AGE_MS,
    pageSize: SHOPPING_LIST_PAGE_SIZE,
    fetchPage: async (pageNumber, pageSize) => {
      const nextItemsPage = await fetchShoppingItemsPage(pageNumber, pageSize);
      const nextRemainingCount = await fetchShoppingRemainingCount();
      setRemainingCount(nextRemainingCount);
      return nextItemsPage;
    },
    fromCacheData: ({ data, pageSize }) => {
      if (Array.isArray(data)) {
        return {
          items: data,
          page: 0,
          hasMore: data.length === pageSize,
        };
      }

      if (
        data &&
        typeof data === "object" &&
        "items" in data &&
        Array.isArray((data as ShoppingListCachePayload).items)
      ) {
        const payload = data as ShoppingListCachePayload;
        const nextCount = typeof payload.totalRemainingCount === "number" ? payload.totalRemainingCount : 0;
        remainingCountRef.current = nextCount;

        return {
          items: payload.items,
          page: payload.page ?? 0,
          hasMore: payload.hasMore ?? payload.items.length === pageSize,
        };
      }

      return null;
    },
    toCacheData: ({ items: nextItems, page: nextPage, hasMore: nextHasMore }) => ({
      items: nextItems,
      totalRemainingCount: remainingCountRef.current,
      page: nextPage,
      hasMore: nextHasMore,
    }),
    mapErrorMessage: () => loadFailedMessage,
  });

  const pagingRef = useRef({ page, hasMore });

  useEffect(() => {
    pagingRef.current = { page, hasMore };
  }, [hasMore, page]);

  const persistShoppingListCache = useCallback(
    (nextItems: ShoppingItem[], nextTotalRemainingCount: number, nextPage: number, nextHasMore: boolean) => {
      remainingCountRef.current = nextTotalRemainingCount;
      const payload: ShoppingListCachePayload = {
        items: nextItems,
        totalRemainingCount: nextTotalRemainingCount,
        page: nextPage,
        hasMore: nextHasMore,
      };

      writeClientCache(LOCAL_CACHE_KEYS.shoppingListItems, payload);
    },
    [],
  );

  useEffect(() => {
    return () => {
      setUndoToasts((currentToasts) => {
        currentToasts.forEach((toast) => {
          clearTimeout(toast.timeoutId);
          void deleteShoppingItem(toast.item.id).catch((err) => console.error("Failed to delete item:", err));
        });
        return [];
      });
    };
  }, []);

  const checkItemWithUndo = useCallback(
    (item: ShoppingItem) => {
      updateItems((previousItems) => {
        const nextItems = previousItems.filter((listItem) => listItem.id !== item.id);

        const nextTotalCount = Math.max(0, remainingCountRef.current - 1);
        setRemainingCount(nextTotalCount);
        persistShoppingListCache(nextItems, nextTotalCount, pagingRef.current.page, pagingRef.current.hasMore);

        return nextItems;
      });

      const timeoutId = setTimeout(() => {
        setUndoToasts((currentToasts) => currentToasts.filter((toast) => toast.item.id !== item.id));
        void deleteShoppingItem(item.id).catch((err) => console.error("Failed to delete item:", err));
      }, SHOPPING_LIST_UNDO_DELAY_MS);

      setUndoToasts((currentToasts) => [...currentToasts, { item, timeoutId }]);
    },
    [persistShoppingListCache, setRemainingCount, updateItems],
  );

  const undoCheckedItem = useCallback(
    (toast: UndoToast) => {
      clearTimeout(toast.timeoutId);
      setUndoToasts((currentToasts) => currentToasts.filter((entry) => entry.item.id !== toast.item.id));

      updateItems((previousItems) => {
        const nextItems = [toast.item, ...previousItems];

        const nextTotalCount = remainingCountRef.current + 1;
        setRemainingCount(nextTotalCount);
        persistShoppingListCache(nextItems, nextTotalCount, pagingRef.current.page, pagingRef.current.hasMore);

        return nextItems;
      });
    },
    [persistShoppingListCache, setRemainingCount, updateItems],
  );

  const deleteItem = useCallback(
    async (id: number): Promise<boolean> => {
      updateItems((previousItems) => {
        const removedItem = previousItems.find((item) => item.id === id);
        const nextItems = previousItems.filter((item) => item.id !== id);

        const nextTotalCount = removedItem?.checked
          ? remainingCountRef.current
          : Math.max(0, remainingCountRef.current - 1);
        setRemainingCount(nextTotalCount);
        persistShoppingListCache(nextItems, nextTotalCount, pagingRef.current.page, pagingRef.current.hasMore);

        return nextItems;
      });

      try {
        await deleteShoppingItem(id);
        return true;
      } catch (err) {
        console.error("Failed to delete item:", err);
        return false;
      }
    },
    [persistShoppingListCache, setRemainingCount, updateItems],
  );

  const addItem = useCallback(
    async (data: ShoppingListMutationInput): Promise<boolean> => {
      try {
        const inserted = await addShoppingItem(data);

        updateItems((previousItems) => {
          const nextItems = [inserted, ...previousItems];

          const nextTotalCount = remainingCountRef.current + 1;
          setRemainingCount(nextTotalCount);
          persistShoppingListCache(nextItems, nextTotalCount, pagingRef.current.page, pagingRef.current.hasMore);

          return nextItems;
        });

        return true;
      } catch (err) {
        console.error("Failed to insert item:", err);
        return false;
      }
    },
    [persistShoppingListCache, setRemainingCount, updateItems],
  );

  const editItem = useCallback(
    async (itemId: number, data: ShoppingListMutationInput): Promise<boolean> => {
      try {
        const updated = await updateShoppingItem(itemId, data);

        updateItems((previousItems) => {
          const nextItems = previousItems.map((item) => (item.id === itemId ? updated : item));
          persistShoppingListCache(nextItems, remainingCountRef.current, pagingRef.current.page, pagingRef.current.hasMore);
          return nextItems;
        });

        return true;
      } catch (err) {
        console.error("Failed to update item:", err);
        return false;
      }
    },
    [persistShoppingListCache, updateItems],
  );

  return {
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
  };
}
