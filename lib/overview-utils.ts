import { EXPIRY_THRESHOLD_DAYS } from "./constants";
import { InventoryItem } from "@/hooks/useInventory";

export function getExpiryThresholdDate(): Date {
  const now = new Date();
  const threshold = new Date(now);
  threshold.setDate(now.getDate() + EXPIRY_THRESHOLD_DAYS);
  return threshold;
}

export function isExpiringSoon(item: InventoryItem): boolean {
  if (item.category?.notify_on_expiry === false) return false;
  if (!item.expiry) return false;
  const d = new Date(item.expiry);
  if (Number.isNaN(d.getTime())) return false;
  return d <= getExpiryThresholdDate();
}

export function getRiskColor(wasteRisk: number): string {
  return wasteRisk === 0 ? "#4a8c2a" : "#c73f3f";
}
