import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CategoryIcon } from "@/components/ui/category-icon";
import { type InventoryItem } from "@/hooks/useInventory";
import { useI18n } from "@/components/providers/i18n-provider";

interface InventoryCardProps {
  item: InventoryItem;
  onEditQuantity: (item: InventoryItem) => void;
}

export function InventoryCard({ item, onEditQuantity }: InventoryCardProps) {
  const { t } = useI18n();
  const createdAtDate = item.created_at ? new Date(item.created_at) : null;
  const createdAtLabel = createdAtDate && !Number.isNaN(createdAtDate.getTime())
    ? createdAtDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "2-digit" })
    : "—";
  const expiryDate = item.expiry ? new Date(item.expiry) : null;
  const expiryLabel = expiryDate && !Number.isNaN(expiryDate.getTime())
    ? expiryDate.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "2-digit",
    })
    : "No date";

  return (
    <Card
      className="cursor-pointer bg-[var(--surface)] transition-shadow hover:shadow-md"
      onClick={() => onEditQuantity(item)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <CategoryIcon category={item.category} />
            <div className="min-w-0">
              <h3 className="truncate text-2xl font-semibold leading-tight text-[var(--foreground)]">{item.name}</h3>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                {item.family}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 min-w-0">
            <Badge
              variant="secondary"
              className="rounded-xl px-3 py-1 text-[11px] font-semibold max-w-[10rem] truncate overflow-hidden whitespace-nowrap text-right"
            >
              {item.zone?.name}
            </Badge>
            {item.zone_detail?.label && (
              <span className="text-[11px] font-semibold text-[var(--muted)] max-w-[10rem] truncate block text-right">
                {item.zone_detail.label}
              </span>
            )}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-[var(--muted)]">Stock</p>
            <p className="font-semibold text-[var(--foreground)]">{item.stock}</p>
          </div>
          <div>
            <p className="text-[var(--muted)]">{t("inventory.card.expiring")}</p>
            <p className="font-semibold text-[var(--foreground)]">{expiryLabel}</p>
          </div>
          <div>
            <p className="text-[var(--muted)]">{t("inventory.card.created")}</p>
            <p className="font-semibold text-[var(--foreground)]">{createdAtLabel}</p>
          </div>
          {item.value && (
            <div>
              <p className="text-[var(--muted)]">Notes</p>
              <p className="font-semibold text-[var(--foreground)]">{item.value}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
