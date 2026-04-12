import { Card, CardContent } from "@/components/ui/card";
import { STAT_CARD_COLORS } from "@/lib/colors";

interface StatCardProps {
  label: string;
  value: string | number;
  valueColor?: string;
  variant?: "default" | "success" | "danger";
}

export function StatCard({ label, value, valueColor, variant = "default" }: StatCardProps) {
  return (
    <Card>
      <CardContent className="px-5 py-4">
        <p className="text-[11px] font-semibold uppercase text-[#7a7f8f]">{label}</p>
        <p className="text-3xl font-semibold" style={{ color: valueColor ?? STAT_CARD_COLORS[variant] }}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
