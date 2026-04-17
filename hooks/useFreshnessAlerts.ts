"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { DAY_MS, EXPIRY_THRESHOLD_DAYS } from "@/lib/constants";

const SELECT_QUERY = `
  *,
  familly:familly(id,name,description),
  category:categories(*),
  zone:storage_zones(*),
  zone_detail:storage_zone_details(*)
`;

type CategoryData = Record<string, unknown>;
type ZoneData = Record<string, unknown>;
type ZoneDetailData = Record<string, unknown>;

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
  category?: CategoryData;
  zone?: ZoneData;
  zone_detail?: ZoneDetailData;
};

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

      const rows = (data ?? []) as Array<Record<string, unknown>>;

      const mapped = rows.map((r) => ({
        ...r,
        family_id: typeof r.family_id === "number" ? r.family_id : undefined,
        family: Array.isArray(r.familly) ? r.familly[0]?.name ?? "—" : r.familly?.name ?? "—",
      }));

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
