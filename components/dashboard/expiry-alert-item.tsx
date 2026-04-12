import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CategoryIcon } from "@/components/ui/category-icon";
import { getExpiryLabel, getAlertVariant } from "@/lib/freshness-utils";
import { type InventoryItem } from "@/hooks/useInventory";
import { useI18n } from "@/components/providers/i18n-provider";

interface ExpiryAlertItemProps {
  item: InventoryItem;
  daysLeft: number;
  onClick?: () => void;
}

export function ExpiryAlertItem({ item, daysLeft, onClick }: ExpiryAlertItemProps) {
  const { t } = useI18n();

  return (
    <Card
      onClick={onClick}
      className={onClick ? "cursor-pointer transition-shadow hover:shadow-md" : undefined}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <CardContent className="flex items-center gap-4 p-4">
        <CategoryIcon category={item.category} />
        <div className="flex-1">
          <p className="font-semibold text-[#202229]">{item.name}</p>
          <p className="text-xs text-[#7b8090]">{item.family}</p>
        </div>
        <div className="text-right">
          <Badge variant={getAlertVariant(daysLeft)} className="mb-1">
            {getExpiryLabel(daysLeft, t)}
          </Badge>
          <p className="text-xs text-[#666c7d]">{t("freshness.qty", { count: item.stock })}</p>
        </div>
      </CardContent>
    </Card>
  );
}
