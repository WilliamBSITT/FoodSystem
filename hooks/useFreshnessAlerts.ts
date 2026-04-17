"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { DAY_MS, EXPIRY_THRESHOLD_DAYS } from "@/lib/constants";
import type { InventoryItem } from "@/hooks/useInventory";

const SELECT_QUERY = `
  *,
  familly:familly(id,name,description),
  category:categories(*),
  zone:storage_zones(*),
  zone_detail:storage_zone_details(*)
`;

type InventoryItemRow = {
  id?: number;
  family?: string;
  family_id?: number | null;
  name?: string;
  stock?: number;
  expiry?: string | null;
  created_at?: string;
  value?: string;
  category_id?: number | null;
  zone_id?: number | null;
  zone_detail_id?: number | null;
  familly?: { id?: number; name?: string; description?: string }[] | { id?: number; name?: string; description?: string } | null;
  category?: unknown;
  zone?: unknown;
  zone_detail?: unknown;
  [key: string]: unknown;
};

function mapRowsToInventoryItems(rows: InventoryItemRow[]): InventoryItem[] {
  return rows.map((r) => ({
    ...(r as unknown as InventoryItem),
    family_id: typeof r.family_id === "number" ? r.family_id : undefined,
    family: Array.isArray(r.familly)
      ? r.familly[0]?.name ?? "—"
      : r.familly && typeof r.familly === "object"
      ? (r.familly as { name?: string }).name ?? "—"
      : "—",
  }));
}

function getMonthDateRange(month: Date) {
  const year = month.getUTCFullYear();
  const monthIndex = month.getUTCMonth();
  const start = new Date(Date.UTC(year, monthIndex, 1)).toISOString().slice(0, 10);
  const end = new Date(Date.UTC(year, monthIndex + 1, 0)).toISOString().slice(0, 10);
  return { start, end };
}

export function useFreshnessAlerts({ days = EXPIRY_THRESHOLD_DAYS, limit = 50 } = {}) {
  const [items, setItems] = useState<InventoryItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const threshold = new Date(Date.now() + days * DAY_MS).toISOString();

      const { data, error: fetchError } = await supabase
        .from("inventory_items")
        .select(SELECT_QUERY)
        .not("expiry", "is", null)
        .lte("expiry", threshold)
        .order("expiry", { ascending: true })
        .limit(limit);

      if (fetchError) {
        throw fetchError;
      }

      const rows = (data ?? []) as InventoryItemRow[];
      const mapped = mapRowsToInventoryItems(rows);

      setItems(mapped);
      return mapped;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setItems([]);
      return [] as InventoryItem[];
    } finally {
      setLoading(false);
    }
  }, [days, limit]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return {
    items: items ?? [],
    loading,
    error,
    refetch: fetch,
  };
}

export function useFreshnessCalendarMonthItems(calendarMonth: Date) {
  const [items, setItems] = useState<InventoryItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMonth = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { start, end } = getMonthDateRange(calendarMonth);

      const { data, error: fetchError } = await supabase
        .from("inventory_items")
        .select(SELECT_QUERY)
        .not("expiry", "is", null)
        .gte("expiry", start)
        .lte("expiry", end)
        .order("expiry", { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      const rows = (data ?? []) as InventoryItemRow[];
      const mapped = mapRowsToInventoryItems(rows);

      setItems(mapped);
      return mapped;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setItems([]);
      return [] as InventoryItem[];
    } finally {
      setLoading(false);
    }
  }, [calendarMonth]);

  useEffect(() => {
    void fetchMonth();
  }, [fetchMonth]);

  return {
    items: items ?? [],
    loading,
    error,
    refetch: fetchMonth,
  };
}
