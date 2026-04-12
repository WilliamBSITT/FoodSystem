"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  isClientCacheStale,
  readClientCache,
  writeClientCache,
} from "@/lib/client-cache";

type PaginatedState<T> = {
  items: T[];
  page: number;
  hasMore: boolean;
};

type CachedPaginatedData = {
  data: unknown;
  pageSize: number;
};

interface UsePaginatedDataOptions<T> {
  cacheKey: string;
  maxAgeMs: number;
  pageSize: number;
  fetchPage: (pageNumber: number, pageSize: number) => Promise<T[]>;
  verifyFn?: (refetch: (options?: { silent?: boolean }) => Promise<T[]>) => Promise<void>;
  fromCacheData?: (cached: CachedPaginatedData) => PaginatedState<T> | null;
  toCacheData?: (state: PaginatedState<T>) => unknown;
  mapErrorMessage?: (error: unknown) => string;
}

function defaultFromCacheData<T>({ data, pageSize }: CachedPaginatedData): PaginatedState<T> | null {
  if (!Array.isArray(data)) {
    return null;
  }

  return {
    items: data as T[],
    page: 0,
    hasMore: data.length === pageSize,
  };
}

function defaultToCacheData<T>({ items }: PaginatedState<T>) {
  return items;
}

export function usePaginatedData<T>({
  cacheKey,
  maxAgeMs,
  pageSize,
  fetchPage,
  verifyFn,
  fromCacheData,
  toCacheData,
  mapErrorMessage,
}: UsePaginatedDataOptions<T>) {
  const cacheEntry = readClientCache<unknown>(cacheKey);

  const parseCache = useCallback(
    (cachedData: unknown) => {
      const parser = fromCacheData ?? defaultFromCacheData<T>;
      return parser({ data: cachedData, pageSize });
    },
    [fromCacheData, pageSize],
  );

  const parsedCacheState = cacheEntry ? parseCache(cacheEntry.data) : null;

  const [items, setItems] = useState<T[]>(parsedCacheState?.items ?? []);
  const [page, setPage] = useState(parsedCacheState?.page ?? 0);
  const [hasMore, setHasMore] = useState(parsedCacheState?.hasMore ?? false);
  const [loading, setLoading] = useState(!parsedCacheState);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializedRef = useRef(false);
  const itemsRef = useRef(items);
  const pageRef = useRef(page);
  const hasMoreRef = useRef(hasMore);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  const persist = useCallback(
    (nextState: PaginatedState<T>) => {
      const serializer = toCacheData ?? defaultToCacheData<T>;
      writeClientCache(cacheKey, serializer(nextState));
    },
    [cacheKey, toCacheData],
  );

  const setPaginationState = useCallback(
    (nextPage: number, nextHasMore: boolean, options?: { persistState?: boolean }) => {
      setPage(nextPage);
      setHasMore(nextHasMore);

      if (options?.persistState !== false) {
        persist({
          items: itemsRef.current,
          page: nextPage,
          hasMore: nextHasMore,
        });
      }
    },
    [persist],
  );

  const updateItems = useCallback(
    (updater: T[] | ((current: T[]) => T[]), options?: { persistState?: boolean }) => {
      setItems((current) => {
        const nextItems = typeof updater === "function" ? (updater as (current: T[]) => T[])(current) : updater;

        if (options?.persistState !== false) {
          persist({
            items: nextItems,
            page: pageRef.current,
            hasMore: hasMoreRef.current,
          });
        }

        return nextItems;
      });
    },
    [persist],
  );

  const refetch = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setLoading(true);
      }

      try {
        const firstPageItems = await fetchPage(0, pageSize);
        const nextHasMore = firstPageItems.length === pageSize;

        setItems(firstPageItems);
        setPage(0);
        setHasMore(nextHasMore);
        persist({ items: firstPageItems, page: 0, hasMore: nextHasMore });
        setError(null);

        return firstPageItems;
      } catch (err: unknown) {
        const errorMessage = mapErrorMessage
          ? mapErrorMessage(err)
          : err instanceof Error
            ? err.message
            : "Unknown error";

        setError(errorMessage);
        throw err;
      } finally {
        if (!options?.silent) {
          setLoading(false);
        }
      }
    },
    [fetchPage, mapErrorMessage, pageSize, persist],
  );

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMoreRef.current) {
      return;
    }

    setLoadingMore(true);

    try {
      const nextPage = pageRef.current + 1;
      const nextPageItems = await fetchPage(nextPage, pageSize);

      updateItems((current) => {
        const mergedItems = [...current, ...nextPageItems];
        return mergedItems;
      }, { persistState: false });

      const nextHasMore = nextPageItems.length === pageSize;
      setPage(nextPage);
      setHasMore(nextHasMore);

      persist({
        items: [...itemsRef.current, ...nextPageItems],
        page: nextPage,
        hasMore: nextHasMore,
      });
    } catch (err: unknown) {
      const errorMessage = mapErrorMessage
        ? mapErrorMessage(err)
        : err instanceof Error
          ? err.message
          : "Unknown error";

      setError(errorMessage);
      throw err;
    } finally {
      setLoadingMore(false);
    }
  }, [fetchPage, loading, loadingMore, mapErrorMessage, pageSize, persist, updateItems]);

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }

    initializedRef.current = true;
    let isMounted = true;

    async function init() {
      try {
        if (!cacheEntry || !parsedCacheState) {
          await refetch();
          return;
        }

        if (isClientCacheStale(cacheEntry, maxAgeMs)) {
          await refetch({ silent: true });
          return;
        }

        if (verifyFn) {
          await verifyFn(refetch);
        }
      } catch {
        if (isMounted) {
          setLoading(false);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void init();

    return () => {
      isMounted = false;
    };
  }, [cacheEntry, maxAgeMs, parsedCacheState, refetch, verifyFn]);

  return {
    items,
    page,
    hasMore,
    loading,
    loadingMore,
    error,
    refetch,
    loadMore,
    updateItems,
    setPaginationState,
  };
}
