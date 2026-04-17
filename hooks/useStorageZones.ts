"use client";

import { useCallback, useState } from "react";
import {
  invalidateClientCaches,
  LOCAL_CACHE_KEYS,
  readClientCache,
} from "@/lib/client-cache";
import { supabase } from "@/lib/supabase";
import { usePaginatedData } from "./usePaginatedData";

export type StorageZoneDetail = {
  id: number;
  zone_id: number;
  label: string;
};

type StorageZoneRow = {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  details?: StorageZoneDetail[];
  linked_items?: Array<{ id: number }>;
};

export type StorageZone = {
  id: number;
  name: string;
  description: string;
  location: string;
  items: number;
  icon: "fridge" | "freezer" | "wine" | "archive";
  priority: number;
  details: StorageZoneDetail[];
};

export type CreateStorageZoneInput = {
  name: string;
  description?: string;
  icon?: StorageZone["icon"];
  location?: string;
  detailLabels?: string[];
};

export type UpdateStorageZoneInput = {
  name?: string;
  description?: string;
  icon?: StorageZone["icon"];
  priority?: number;
};

type AttentionItemRow = {
  id: number;
  name: string;
  stock: string;
  expiry: string | null;
  familly?: { name: string }[] | null;
  family_id?: number | null;
  zone_id: number | null;
  zone_detail_id: number | null;
};

export type AttentionItem = {
  id: number;
  name: string;
  stock: string;
  expiry: string | null;
  family: string;
  zoneId: number | null;
  zoneDetailId: number | null;
};

const STORAGE_ZONES_CACHE_MAX_AGE_MS = 10 * 60 * 1000;
const ATTENTION_ITEMS_CACHE_MAX_AGE_MS = 5 * 60 * 1000;
const STORAGE_ZONES_PAGE_SIZE = 50;
const ATTENTION_ITEMS_PAGE_SIZE = 50;

function normalizeIcon(icon: string | null): StorageZone["icon"] {
  const value = (icon ?? "archive").toLowerCase();

  if (value.includes("snow") || value.includes("freezer")) {
    return "freezer";
  }

  if (value.includes("wine")) {
    return "wine";
  }

  if (value.includes("fridge") || value.includes("refrigerator")) {
    return "fridge";
  }

  return "archive";
}

function toDatabaseIcon(icon: StorageZone["icon"] | undefined): string {
  if (icon === "fridge") {
    return "Refrigerator";
  }

  if (icon === "freezer") {
    return "Snowflake";
  }

  if (icon === "wine") {
    return "Wine";
  }

  return "Archive";
}

export function useStorageZones() {
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [mutatingDetails, setMutatingDetails] = useState(false);
  const [updatingAttention, setUpdatingAttention] = useState(false);

  const fetchZones = useCallback(async (page = 0, pageSize = STORAGE_ZONES_PAGE_SIZE) => {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error: fetchError } = await supabase
      .from("storage_zones")
      .select(
        "id,name,description,icon,details:storage_zone_details(id,zone_id,label),linked_items:inventory_items(id)",
      )
      .order("id", { ascending: true })
      .range(from, to);

      if (fetchError) {
        throw fetchError;
    }

    const mapped = ((data as StorageZoneRow[] | null) ?? []).map((zone, index) => ({
      id: zone.id,
      name: zone.name,
      description: zone.description ?? "No description",
      location: zone.details?.[0]?.label ?? "Not specified",
      items: zone.linked_items?.length ?? 0,
      icon: normalizeIcon(zone.icon),
      priority: index,
      details: zone.details ?? [],
    }));

    return mapped;
  }, []);

  const verifyZones = useCallback(
    async (refetch: (options?: { silent?: boolean }) => Promise<StorageZone[]>) => {
      const { count, error: verifyError } = await supabase
        .from("storage_zones")
        .select("id", { count: "exact", head: true });

        if (verifyError) {
          throw verifyError;
      }

      const cacheEntry = readClientCache<StorageZone[]>(LOCAL_CACHE_KEYS.storageZones);
      if (!cacheEntry) return;

      const remoteCount = count ?? 0;
      const idsChanged = remoteCount !== cacheEntry.data.length;

      if (idsChanged) {
        await refetch({ silent: true });
      }
    },
    [],
  );

  const fetchAttentionItems = useCallback(async (page = 0, pageSize = ATTENTION_ITEMS_PAGE_SIZE) => {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error: fetchError } = await supabase
      .from("inventory_items")
      .select("id,name,stock,expiry,family_id,zone_id,zone_detail_id,familly:familly(name)")
      .is("zone_id", null)
      .order("name", { ascending: true })
      .range(from, to);

      if (fetchError) {
        throw fetchError;
    }

    const rows = (data as AttentionItemRow[] | null) ?? [];

    const mapped = rows.map((item) => ({
      id: item.id,
      name: item.name,
      stock: item.stock,
      expiry: item.expiry,
      family: item.familly?.[0]?.name ?? "Unknown family",
      zoneId: item.zone_id,
      zoneDetailId: item.zone_detail_id,
    }));

    return mapped;
  }, []);

  const verifyAttentionItems = useCallback(
    async (refetch: (options?: { silent?: boolean }) => Promise<AttentionItem[]>) => {
      const { count, error: verifyError } = await supabase
        .from("inventory_items")
        .select("id", { count: "exact", head: true })
        .is("zone_id", null);

      if (verifyError) {
        throw verifyError;
      }

      const cacheEntry = readClientCache<AttentionItem[]>(LOCAL_CACHE_KEYS.attentionItems);
      if (!cacheEntry) return;

      const remoteCount = count ?? 0;
      const idsChanged = remoteCount !== cacheEntry.data.length;

      if (idsChanged) {
        await refetch({ silent: true });
      }
    },
    [],
  );

  const { items: zones, loading, error, refetch: refreshZones } = usePaginatedData<StorageZone>({
    cacheKey: LOCAL_CACHE_KEYS.storageZones,
    maxAgeMs: STORAGE_ZONES_CACHE_MAX_AGE_MS,
    pageSize: STORAGE_ZONES_PAGE_SIZE,
    fetchPage: fetchZones,
    verifyFn: verifyZones,
  });

  const {
    items: attentionItems,
    loading: attentionLoading,
    error: attentionError,
    refetch: refreshAttentionItems,
  } = usePaginatedData<AttentionItem>({
    cacheKey: LOCAL_CACHE_KEYS.attentionItems,
    maxAgeMs: ATTENTION_ITEMS_CACHE_MAX_AGE_MS,
    pageSize: ATTENTION_ITEMS_PAGE_SIZE,
    fetchPage: fetchAttentionItems,
    verifyFn: verifyAttentionItems,
  });

  function invalidateRelatedCaches() {
    invalidateClientCaches([
      LOCAL_CACHE_KEYS.storageZones,
      LOCAL_CACHE_KEYS.attentionItems,
      LOCAL_CACHE_KEYS.inventoryItems,
      LOCAL_CACHE_KEYS.dashboardInventory,
    ]);
  }

  async function fetchZonesAndAttention() {
    await refreshZones();
    await refreshAttentionItems();
  }

  async function createZone(input: CreateStorageZoneInput) {
    const trimmedName = input.name.trim();

    if (!trimmedName) {
      throw new Error("Name is required");
    }

    setCreating(true);

    const { data: zoneData, error: zoneError } = await supabase
      .from("storage_zones")
      .insert({
        name: trimmedName,
        description: input.description?.trim() || null,
        icon: toDatabaseIcon(input.icon),
      })
      .select("id")
      .single();

    if (zoneError) {
      setCreating(false);
      throw zoneError;
    }

    const detailLabels = (input.detailLabels ?? [])
      .map((label) => label.trim())
      .filter((label) => label.length > 0);

    const fallbackLocation = input.location?.trim();

    if (detailLabels.length === 0 && fallbackLocation) {
      detailLabels.push(fallbackLocation);
    }

    if (detailLabels.length > 0 && zoneData?.id) {
      const { error: detailError } = await supabase.from("storage_zone_details").insert(
        detailLabels.map((label) => ({
          zone_id: zoneData.id,
          label,
        })),
      );

      if (detailError) {
        setCreating(false);
        throw detailError;
      }
    }

    invalidateRelatedCaches();
    await fetchZonesAndAttention();
    setCreating(false);
  }

  async function updateZone(zoneId: number, input: UpdateStorageZoneInput) {
    setUpdating(true);

    const payload: {
      name?: string;
      description?: string | null;
      icon?: string;
    } = {};

    if (typeof input.name === "string") {
      const trimmed = input.name.trim();
      if (!trimmed) {
        setUpdating(false);
        throw new Error("Name is required");
      }
      payload.name = trimmed;
    }

    if (typeof input.description === "string") {
      payload.description = input.description.trim() || null;
    }

    if (input.icon) {
      payload.icon = toDatabaseIcon(input.icon);
    }

    const { error: updateError } = await supabase.from("storage_zones").update(payload).eq("id", zoneId);

    if (updateError) {
      setUpdating(false);
      throw updateError;
    }

    invalidateRelatedCaches();
    await fetchZonesAndAttention();
    setUpdating(false);
  }

  async function deleteZone(zoneId: number) {
    setDeleting(true);

    try {
      const { data: detailsData, error: detailsFetchError } = await supabase
        .from("storage_zone_details")
        .select("id")
        .eq("zone_id", zoneId);

        if (detailsFetchError) {
          throw detailsFetchError;
      }

      const detailIds = ((detailsData as Array<{ id: number }> | null) ?? []).map((detail) => detail.id);

      if (detailIds.length > 0) {
        const { error: unlinkDetailsError } = await supabase
          .from("inventory_items")
          .update({ zone_detail_id: null })
          .in("zone_detail_id", detailIds);

          if (unlinkDetailsError) {
            throw unlinkDetailsError;
        }
      }

      const { error: unlinkZoneError } = await supabase
        .from("inventory_items")
        .update({ zone_id: null })
        .eq("zone_id", zoneId);

        if (unlinkZoneError) {
          throw unlinkZoneError;
      }

      const { error: deleteDetailsError } = await supabase.from("storage_zone_details").delete().eq("zone_id", zoneId);

        if (deleteDetailsError) {
          throw deleteDetailsError;
      }

      const { error: deleteZoneError } = await supabase.from("storage_zones").delete().eq("id", zoneId);

        if (deleteZoneError) {
          throw deleteZoneError;
      }

      invalidateRelatedCaches();
      await fetchZonesAndAttention();
    } finally {
      setDeleting(false);
    }
  }

  async function addDetail(zoneId: number, label: string) {
    const trimmed = label.trim();

    if (!trimmed) {
      throw new Error("Detail label is required");
    }

    setMutatingDetails(true);

    const { error: insertError } = await supabase.from("storage_zone_details").insert({
      zone_id: zoneId,
      label: trimmed,
    });

    if (insertError) {
      setMutatingDetails(false);
      throw insertError;
    }

    invalidateRelatedCaches();
    await fetchZonesAndAttention();
    setMutatingDetails(false);
  }

  async function updateDetail(detailId: number, label: string) {
    const trimmed = label.trim();

    if (!trimmed) {
      throw new Error("Detail label is required");
    }

    setMutatingDetails(true);

    const { error: updateError } = await supabase
      .from("storage_zone_details")
      .update({ label: trimmed })
      .eq("id", detailId);

    if (updateError) {
      setMutatingDetails(false);
      throw updateError;
    }

    invalidateRelatedCaches();
    await fetchZonesAndAttention();
    setMutatingDetails(false);
  }

  async function deleteDetail(detailId: number) {
    setMutatingDetails(true);

    try {
      const { error: unlinkError } = await supabase
        .from("inventory_items")
        .update({ zone_detail_id: null })
        .eq("zone_detail_id", detailId);

      if (unlinkError) {
        throw unlinkError;
      }

      const { error: deleteError } = await supabase.from("storage_zone_details").delete().eq("id", detailId);

      if (deleteError) {
        throw deleteError;
      }

      invalidateRelatedCaches();
      await fetchZonesAndAttention();
    } finally {
      setMutatingDetails(false);
    }
  }

  async function updateAttentionItem(
    itemId: number,
    input: {
      name?: string;
      stock?: string;
      zoneId?: number | null;
      zoneDetailId?: number | null;
    },
  ) {
    setUpdatingAttention(true);

    const parsedStock =
      typeof input.stock === "string" ? Number.parseFloat(input.stock.trim().replace(",", ".")) : null;

    if (parsedStock === 0) {
      const { data: inventoryRow, error: categoryCheckError } = await supabase
        .from("inventory_items")
        .select("category:categories(keep_zero)")
        .eq("id", itemId)
        .single();

      if (categoryCheckError) {
        setUpdatingAttention(false);
        throw categoryCheckError;
      }

      const shouldKeep = Boolean(
        (inventoryRow as { category?: { keep_zero?: boolean } | null } | null)?.category?.keep_zero,
      );

      if (!shouldKeep) {
        const { error: deleteError } = await supabase.from("inventory_items").delete().eq("id", itemId);

        if (deleteError) {
          setUpdatingAttention(false);
          throw deleteError;
        }

        invalidateRelatedCaches();
        await refreshAttentionItems();
        await refreshZones();
        setUpdatingAttention(false);
        return;
      }
    }

    const payload: {
      name?: string;
      stock?: string;
      zone_id?: number | null;
      zone_detail_id?: number | null;
    } = {};

    if (typeof input.name === "string") {
      const trimmedName = input.name.trim();
      if (!trimmedName) {
        setUpdatingAttention(false);
        throw new Error("Item name is required");
      }
      payload.name = trimmedName;
    }

    if (typeof input.stock === "string") {
      const trimmedStock = input.stock.trim();
      if (!trimmedStock) {
        setUpdatingAttention(false);
        throw new Error("Stock is required");
      }
      payload.stock = trimmedStock;
    }

    if (Object.prototype.hasOwnProperty.call(input, "zoneId")) {
      payload.zone_id = input.zoneId ?? null;
    }

    if (Object.prototype.hasOwnProperty.call(input, "zoneDetailId")) {
      payload.zone_detail_id = input.zoneDetailId ?? null;
    }

    const { error: updateError } = await supabase.from("inventory_items").update(payload).eq("id", itemId);

    if (updateError) {
      setUpdatingAttention(false);
      throw updateError;
    }

    invalidateRelatedCaches();
    await refreshAttentionItems();
    await refreshZones();
    setUpdatingAttention(false);
  }

  return {
    zones,
    loading,
    error,
    attentionItems,
    attentionLoading,
    attentionError,
    creating,
    updating,
    deleting,
    mutatingDetails,
    updatingAttention,
    createZone,
    updateZone,
    deleteZone,
    addDetail,
    updateDetail,
    deleteDetail,
    updateAttentionItem,
    refresh: refreshZones,
    refreshAttentionItems,
  };
}
