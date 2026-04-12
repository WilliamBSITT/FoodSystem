"use client";

import { StatCard } from "@/components/ui/stat-card";
import { useMemo } from "react";
import { useInventory } from "@/hooks/useInventory";
import { isExpiringSoon } from "@/lib/overview-utils";
import { useI18n } from "@/components/providers/i18n-provider";
import { buildSearchableText, normalizeSearchText } from "@/lib/search-normalization";

interface OverviewProps {
  searchQuery?: string;
}

export function Overview({ searchQuery = "" }: OverviewProps) {
  const { items = [] } = useInventory();
  const { t } = useI18n();

  const normalizedSearch = normalizeSearchText(searchQuery);

  const filteredItems = useMemo(() => {
    if (!normalizedSearch) return items;

    return items.filter((item) => {
      const searchable = buildSearchableText([
        item.name,
        item.family,
        item.value ?? "",
        item.category?.name ?? "",
        item.zone?.name ?? "",
        item.zone_detail?.label ?? "",
      ]);

      return searchable.includes(normalizedSearch);
    });
  }, [items, normalizedSearch]);

  const { stockedItems, wasteRisk } = useMemo(() => {
    const totalStock = (filteredItems ?? []).reduce((acc, it) => acc + (Number(it.stock) || 0), 0);
    const expiringSoonCount = (filteredItems ?? []).filter(isExpiringSoon).length;
    const totalItemsCount = (filteredItems ?? []).length || 0;
    const wastePct = totalItemsCount === 0 ? 0 : Math.round((expiringSoonCount / totalItemsCount) * 100);

    return {
      stockedItems: Math.round(totalStock),
      wasteRisk: wastePct,
    };
  }, [filteredItems]);

  return (
    <section className="mb-7 flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6f7485]">{t("overview.systemOverview")}</p>
        <h1 className="mt-1 text-[42px] leading-tight font-semibold text-[#3345b8]">{t("overview.dashboard")}</h1>
        <p className="mt-2 text-2xl font-medium text-[#5f6577]">
          {t("overview.subtitle")}
        </p>
      </div>
      <div className="flex gap-3">
        <StatCard label={t("overview.stockedItems")} value={stockedItems.toLocaleString()} valueColor="#3345b8" />
        <StatCard
          label={t("overview.wasteRisk")}
          value={`${wasteRisk}%`}
          variant={wasteRisk === 0 ? "success" : "danger"}
        />
      </div>
    </section>
  );
}