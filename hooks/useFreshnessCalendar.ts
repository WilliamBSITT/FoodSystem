import { useMemo } from "react";
import { type InventoryItem } from "@/hooks/useInventory";
import {
  daysUntil,
  formatDateKey,
  parseExpiryDate,
  isSameMonth,
} from "@/lib/freshness-utils";
import { buildSearchableText, normalizeSearchText } from "@/lib/search-normalization";

interface CalendarEntry {
  item: InventoryItem;
  daysLeft: number;
  expiryDate: Date;
  dateKey: string;
}

/**
 * Hook for building and managing freshness calendar data
 * Handles parsing expiry dates, counting items by day, and filtering
 */
export function useFreshnessCalendar(items: InventoryItem[], searchQuery: string) {
  return useMemo(() => {
    const normalizedSearch = normalizeSearchText(searchQuery);

    const filteredItems = (items ?? []).filter((item: InventoryItem) => {
      if (!normalizedSearch) return true;

      const searchable = buildSearchableText([
        item.name,
        item.family,
        item.value ?? "",
        item.category?.name ?? "",
        item.zone?.name ?? "",
        item.zone_detail?.label ?? "",
      ]);

      return searchable.includes(normalizedSearch);
    });

    const calendarEntries = filteredItems
      .map((item: InventoryItem) => {
        if (!item.expiry || item.category?.notify_on_expiry === false) {
          return null;
        }

        const expiryDate = parseExpiryDate(item.expiry);
        if (!expiryDate) return null;

        const daysLeft = daysUntil(item.expiry);
        return {
          item,
          daysLeft,
          expiryDate,
          dateKey: formatDateKey(expiryDate),
        };
      })
      .filter((entry): entry is CalendarEntry => entry !== null)
      .sort((left, right) => left.expiryDate.getTime() - right.expiryDate.getTime());

    const itemsByDay = calendarEntries.reduce<Record<string, CalendarEntry[]>>((acc, entry) => {
      acc[entry.dateKey] ??= [];
      acc[entry.dateKey].push(entry);
      return acc;
    }, {});

    return {
      calendarEntries,
      itemsByDay,
    };
  }, [items, searchQuery]);
}

/**
 * Build calendar grid for a specific month
 * Returns array of Date cells (null for padding) representing the calendar grid
 */
export function buildCalendarDays(month: Date): Array<Date | null> {
  const firstOfMonth = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), 1));
  const startWeekday = firstOfMonth.getUTCDay();
  const daysInMonth = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0)).getUTCDate();

  const cells: Array<Date | null> = [];

  for (let index = 0; index < startWeekday; index += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), day)));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

/**
 * Get entries for a specific month
 */
export function getMonthEntries(
  calendarEntries: CalendarEntry[],
  calendarMonth: Date,
): CalendarEntry[] {
  return calendarEntries.filter(({ expiryDate }) => isSameMonth(expiryDate, calendarMonth));
}

/**
 * Get entries grouped by day for a specific month
 */
export function getMonthEntriesByDay(
  monthEntries: CalendarEntry[],
): Record<string, CalendarEntry[]> {
  return monthEntries.reduce<Record<string, CalendarEntry[]>>((acc, entry) => {
    acc[entry.dateKey] ??= [];
    acc[entry.dateKey].push(entry);
    return acc;
  }, {});
}
