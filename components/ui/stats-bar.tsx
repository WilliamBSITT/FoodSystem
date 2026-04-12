interface StatsBarItem {
  label: string;
  value: string | number;
}

interface StatsBarProps {
  items: StatsBarItem[];
}

export function StatsBar({ items }: StatsBarProps) {
  return (
    <div className="mt-4 grid grid-cols-3 gap-3">
      {items.map((item) => (
        <div key={item.label}>
          <p className="text-xs text-[#7a8090]">{item.label}</p>
          <p className="text-3xl font-semibold text-[#20242d]">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
