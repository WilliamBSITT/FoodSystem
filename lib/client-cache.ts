"use client";

type CacheEntry<T> = {
  data: T;
  updatedAt: number;
};

export type { CacheEntry };

const CACHE_PREFIX = "stock-cache:";
const memoryCache = new Map<string, CacheEntry<unknown>>();

export const LOCAL_CACHE_KEYS = {
  inventoryItems: "inventory-items",
  categories: "categories",
  families: "families",
  storageZones: "storage-zones",
  attentionItems: "attention-items",
  shoppingListItems: "shopping-list-items",
  dashboardQuickFilters: "dashboard-quick-filters",
} as const;

function getStorageKey(key: string) {
  return `${CACHE_PREFIX}${key}`;
}

export function getUserScopedCacheKey(key: string, userId: string) {
  return `${key}:${userId}`;
}

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readClientCache<T>(key: string): CacheEntry<T> | null {
  const memoryEntry = memoryCache.get(key);

  if (memoryEntry) {
    return memoryEntry as CacheEntry<T>;
  }

  if (!canUseLocalStorage()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(getStorageKey(key));

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as CacheEntry<T>;

    if (!parsed || typeof parsed.updatedAt !== "number" || !("data" in parsed)) {
      window.localStorage.removeItem(getStorageKey(key));
      return null;
    }

    memoryCache.set(key, parsed as CacheEntry<unknown>);
    return parsed;
  } catch {
    if (canUseLocalStorage()) {
      window.localStorage.removeItem(getStorageKey(key));
    }

    return null;
  }
}

export function writeClientCache<T>(key: string, data: T) {
  const entry: CacheEntry<T> = {
    data,
    updatedAt: Date.now(),
  };

  memoryCache.set(key, entry as CacheEntry<unknown>);

  if (!canUseLocalStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(getStorageKey(key), JSON.stringify(entry));
  } catch {
    // Ignore quota/storage errors and keep memory cache only.
  }
}

export function invalidateClientCache(key: string) {
  memoryCache.delete(key);

  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.removeItem(getStorageKey(key));
}

export function invalidateClientCaches(keys: string[]) {
  keys.forEach((key) => invalidateClientCache(key));
}

export function isClientCacheStale(entry: { updatedAt: number } | null, maxAgeMs: number) {
  if (!entry) {
    return true;
  }

  return Date.now() - entry.updatedAt > maxAgeMs;
}
