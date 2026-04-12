interface FilterDropdownProps {
  label: string;
  summary: string;
  items: Array<{ id: string | number; label: string; count: number }>;
  selected: Set<string>;
  onToggle: (id: string) => void;
  onClearAll: () => void;
  allItemsCount: number;
  specialItem?: { id: string; label: string; count: number; selected: boolean; onToggle: () => void };
}

export function FilterDropdown({
  label,
  summary,
  items,
  selected,
  onToggle,
  onClearAll,
  allItemsCount,
  specialItem,
}: FilterDropdownProps) {
  return (
    <details className="group relative">
      <summary className="flex min-w-[230px] cursor-pointer list-none items-center justify-between rounded-xl border border-[#d2d6e2] bg-white px-3 py-2 text-sm text-[#3b4050]">
        <span>{summary}</span>
        <span className="text-xs text-[#7a8090]">▾</span>
      </summary>
      <div className="absolute left-0 top-[calc(100%+8px)] z-20 w-[280px] rounded-xl border border-[#d2d6e2] bg-white p-3 shadow-lg">
        <button
          type="button"
          className="mb-2 w-full rounded-lg bg-[#f3f4f8] px-2 py-1 text-left text-xs font-medium text-[#3b4050]"
          onClick={onClearAll}
        >
          Tous les {label} ({allItemsCount})
        </button>

        <div className="max-h-56 space-y-1 overflow-auto pr-1">
          {items.map((item) => (
            <label key={item.id} className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-[#f7f8fb]">
              <span className="text-sm text-[#2f3442]">{item.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#7a8090]">{item.count}</span>
                <input
                  type="checkbox"
                  checked={selected.has(String(item.id))}
                  onChange={() => onToggle(String(item.id))}
                  className="h-4 w-4 accent-[#3345b8]"
                />
              </div>
            </label>
          ))}

          {specialItem && (
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-[#f7f8fb]">
              <span className="text-sm text-[#2f3442]">{specialItem.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#7a8090]">{specialItem.count}</span>
                <input
                  type="checkbox"
                  checked={specialItem.selected}
                  onChange={specialItem.onToggle}
                  className="h-4 w-4 accent-[#3345b8]"
                />
              </div>
            </label>
          )}
        </div>
      </div>
    </details>
  );
}
