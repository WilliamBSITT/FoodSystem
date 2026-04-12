"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { InventoryContent } from "@/components/inventory/inventory-content";
import { AddProductFAB } from "@/components/ui/add-product-fab";
import type { SortMode } from "@/hooks/useInventoryFilters";

function parseCsvParam(values: string[]): string[] {
  const parsedValues: string[] = [];

  values.forEach((value) => {
    value
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0)
      .forEach((entry) => {
        if (!parsedValues.includes(entry)) {
          parsedValues.push(entry);
        }
      });
  });

  return parsedValues;
}

function parseSortMode(value: string | null): SortMode {
  if (value === "created-desc" || value === "alpha" || value === "family") {
    return value;
  }

  return "created-asc";
}

export function InventoryPageClient() {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");

  const initialFilters = useMemo(() => {
    const rawStatus = searchParams.get("status");
    const statusFilter = rawStatus === "expiring" ? "expiring" : "all";

    const rawFamily = searchParams.get("family")?.trim();
    const selectedFamilyFilter = rawFamily ? rawFamily : "all";

    const selectedCategoryFilters = parseCsvParam([
      ...searchParams.getAll("categoryIds"),
      ...searchParams.getAll("categoryId"),
    ]);

    const selectedZoneFilters = parseCsvParam([
      ...searchParams.getAll("zoneIds"),
      ...searchParams.getAll("zoneId"),
    ]);

    const sortMode = parseSortMode(searchParams.get("sort"));

    return {
      statusFilter,
      selectedFamilyFilter,
      selectedCategoryFilters,
      selectedZoneFilters,
      sortMode,
    } as const;
  }, [searchParams]);

  const filterKey = useMemo(() => {
    return JSON.stringify(initialFilters);
  }, [initialFilters]);

  return (
    <ProtectedRoute>
      <DashboardLayout
        activeItem="inventory"
        showTopbar
        showTopbarSearch={false}
      >
        <InventoryContent
          key={filterKey}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          initialStatusFilter={initialFilters.statusFilter}
          initialFamilyFilter={initialFilters.selectedFamilyFilter}
          initialCategoryFilters={initialFilters.selectedCategoryFilters}
          initialZoneFilters={initialFilters.selectedZoneFilters}
          initialSortMode={initialFilters.sortMode}
        />
        <AddProductFAB />
      </DashboardLayout>
    </ProtectedRoute>
  );
}