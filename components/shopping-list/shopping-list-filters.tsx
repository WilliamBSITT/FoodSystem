import { type CSSProperties } from "react";
import { FilterTabs } from "@/components/ui/filter-tabs";

interface ShoppingListFilter {
  key: string | null;
  label: string;
  count: number;
  style?: CSSProperties;
}

interface ShoppingListFiltersProps {
  filters: ShoppingListFilter[];
  activeFilter: string | null;
  onChange: (key: string | null) => void;
}

function normalizeFilterKey(key: string | null) {
  return key ?? "__all__";
}

export function ShoppingListFilters({ filters, activeFilter, onChange }: ShoppingListFiltersProps) {
  return (
    <FilterTabs
      items={filters.map((filter) => ({
        key: normalizeFilterKey(filter.key),
        label: filter.label,
        count: filter.count,
        style: filter.style,
      }))}
      activeKey={normalizeFilterKey(activeFilter)}
      onChange={(key) => onChange(key === "__all__" ? null : key)}
    />
  );
}
