import { FilterDropdown } from "./filter-dropdown";

interface InventoryZoneFilterProps {
  zones: Array<{ id: number; name: string }>;
  selectedFilters: string[];
  zoneCounts: Map<string, number>;
  itemsCount: number;
  onToggle: (zoneId: string) => void;
  onClearAll: () => void;
}

export function InventoryZoneFilter({
  zones,
  selectedFilters,
  zoneCounts,
  itemsCount,
  onToggle,
  onClearAll,
}: InventoryZoneFilterProps) {
  const selectedSet = new Set(selectedFilters);
  const items = zones.map((zone) => ({
    id: String(zone.id),
    label: zone.name,
    count: zoneCounts.get(String(zone.id)) ?? 0,
  }));

  const summary =
    selectedFilters.length === 0
      ? "Toutes les zones"
      : selectedFilters.length === zones.length
        ? "Toutes les zones"
        : `${selectedFilters.length} sélectionnée${selectedFilters.length > 1 ? "s" : ""}`;

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-[#5a6070]">
      <span>Zone:</span>
      <FilterDropdown
        label="zones"
        summary={summary}
        items={items}
        selected={selectedSet}
        onToggle={onToggle}
        onClearAll={onClearAll}
        allItemsCount={itemsCount}
        specialItem={{
          id: "unassigned",
          label: "Sans zone",
          count: zoneCounts.get("unassigned") ?? 0,
          selected: selectedSet.has("unassigned"),
          onToggle: () => onToggle("unassigned"),
        }}
      />
    </div>
  );
}
