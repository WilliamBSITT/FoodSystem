import { type CSSProperties } from "react";

interface FilterTabItem {
  key: string;
  label: string;
  count: number;
  style?: CSSProperties;
}

interface FilterTabsProps {
  items: FilterTabItem[];
  activeKey: string;
  onChange: (key: string) => void;
}

export function FilterTabs({ items, activeKey, onChange }: FilterTabsProps) {
  if (items.length <= 1) return null;

  return (
    <div className="mb-4 overflow-x-auto pb-1">
      <div className="flex min-w-max flex-nowrap gap-2">
      {items.map(({ key, label, count, style }) => {
        const isActive = activeKey === key;

        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            style={!isActive ? style : undefined}
            className={`inline-flex h-9 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-all ${
              isActive
                ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--background)] shadow-sm"
                : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted-strong)] hover:border-[var(--primary-soft)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <span className="truncate">{label}</span>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${isActive ? "bg-white/15 text-white" : "bg-[var(--surface-muted)] text-[var(--muted)]"}`}>
              {count}
            </span>
          </button>
        );
      })}
      </div>
    </div>
  );
}
