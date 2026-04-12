import { Funnel } from "lucide-react";
import { FilterDropdown } from "./filter-dropdown";

interface InventoryCategoryFilterProps {
  categories: Array<{ id: number; name: string }>;
  selectedFilters: string[];
  categoryCounts: Map<string, number>;
  itemsCount: number;
  onToggle: (categoryId: string) => void;
  onClearAll: () => void;
}

export function InventoryCategoryFilter({
  categories,
  selectedFilters,
  categoryCounts,
  itemsCount,
  onToggle,
  onClearAll,
}: InventoryCategoryFilterProps) {
  const selectedSet = new Set(selectedFilters);
  const items = categories.map((cat) => ({
    id: String(cat.id),
    label: cat.name,
    count: categoryCounts.get(String(cat.id)) ?? 0,
  }));

  const summary =
    selectedFilters.length === 0
      ? "All categories"
      : selectedFilters.length === categories.length
        ? "All categories"
        : `${selectedFilters.length} selected${selectedFilters.length > 1 ? "s" : ""}`;

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-[#5a6070]">
      <span className="inline-flex items-center gap-1.5">
        <Funnel size={14} />
        Category:
      </span>
      <FilterDropdown
        label="catégories"
        summary={summary}
        items={items}
        selected={selectedSet}
        onToggle={onToggle}
        onClearAll={onClearAll}
        allItemsCount={itemsCount}
        specialItem={{
          id: "uncategorized",
          label: "Uncategorized",
          count: categoryCounts.get("uncategorized") ?? 0,
          selected: selectedSet.has("uncategorized"),
          onToggle: () => onToggle("uncategorized"),
        }}
      />
    </div>
  );
}
