"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  isClientCacheStale,
  readClientCache,
  writeClientCache,
} from "@/lib/client-cache";

interface UseCachedDataOptions<T> {
  cacheKey: string;
  maxAgeMs: number;
  fetchFn: () => Promise<T>;
  verifyFn?: (refetch: (options?: { silent?: boolean }) => Promise<T>) => Promise<void>;
}

export function useCachedData<T>({ cacheKey, maxAgeMs, fetchFn, verifyFn }: UseCachedDataOptions<T>) {
  const cachedData = readClientCache<T>(cacheKey);
  const [hasCachedData] = useState(Boolean(cachedData));

  const [data, setData] = useState<T>(cachedData?.data as T);
  const [loading, setLoading] = useState(!cachedData);
  const [error, setError] = useState<string | null>(null);

  // Track if initialization is running to prevent duplicate fetches
  const initializingRef = useRef(false);

  const refetch = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setLoading(true);
      }

      try {
        const result = await fetchFn();
        setData(result);
        writeClientCache(cacheKey, result);
        setError(null);

        if (!options?.silent) {
          setLoading(false);
        }

        return result;
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);

        if (!options?.silent) {
          setLoading(false);
        }

        throw err;
      }
    },
    [cacheKey, fetchFn],
  );

  const verify = useCallback(async () => {
    if (!verifyFn) return;

    const cacheEntry = readClientCache<T>(cacheKey);

    if (!cacheEntry) {
      await refetch({ silent: true });
      return;
    }

    if (isClientCacheStale(cacheEntry, maxAgeMs)) {
      await refetch({ silent: true });
      return;
    }

    await verifyFn(refetch);
  }, [cacheKey, maxAgeMs, refetch, verifyFn]);

  useEffect(() => {
    // Only initialize once per mount
    if (initializingRef.current) {
      return;
    }

    let isMounted = true;
    initializingRef.current = true;

    async function initAndFetch() {
      try {
        if (hasCachedData) {
          await verify();
        } else {
          await refetch();
        }
      } catch (err: unknown) {
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : "Unknown error";
          setError(errorMessage);
          setLoading(false);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void initAndFetch();

    return () => {
      isMounted = false;
    };
  }, [hasCachedData, refetch, verify]);

  return { data, loading, error, refetch };
}
