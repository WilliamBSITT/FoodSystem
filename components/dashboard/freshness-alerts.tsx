"use client";

import { useMemo, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CategoryIcon } from "@/components/ui/category-icon";
import { ExpiryAlertItem } from "./expiry-alert-item";
import { InventoryItemForm } from "@/components/inventory/inventory-item-form";
import { useFreshnessAlerts, useFreshnessCalendarMonthItems } from "@/hooks/useFreshnessAlerts";
import { useCategories } from "@/hooks/useCategories";
import { useStorageZones } from "@/hooks/useStorageZones";
import { useEditInventoryItem } from "@/hooks/useEditInventoryItem";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useFreshnessCalendar, buildCalendarDays, getMonthEntries, getMonthEntriesByDay } from "@/hooks/useFreshnessCalendar";
import {
  MAX_VISIBLE_ALERTS,
  EXPIRY_THRESHOLD_DAYS,
} from "@/lib/constants";
import {
  formatCalendarTitle,
  formatDateKey,
  formatDayLabel,
  getAlertVariant,
  getExpiryLabel,
} from "@/lib/freshness-utils";
import { useI18n } from "@/components/providers/i18n-provider";

interface FreshnessAlertsProps {
  searchQuery?: string;
}

type EditMode = "quantity-only" | "full";

export function FreshnessAlerts({ searchQuery = "" }: FreshnessAlertsProps) {
  const { items: alertItems, loading, error, refetch: refetchAlerts } = useFreshnessAlerts();
  const { categories } = useCategories();
  const { zones } = useStorageZones();
  const { t } = useI18n();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [editMode, setEditMode] = useState<EditMode>("quantity-only");
  useBodyScrollLock(isCalendarOpen);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  });
  const {
    items: calendarItems,
    loading: calendarLoading,
    error: calendarError,
    refetch: refetchCalendar,
  } = useFreshnessCalendarMonthItems(calendarMonth);

  const { calendarEntries: alertEntries } = useFreshnessCalendar(alertItems ?? [], searchQuery);
  const { calendarEntries, itemsByDay } = useFreshnessCalendar(calendarItems ?? [], searchQuery);

  const edit = useEditInventoryItem({
    onSuccess: async () => {
      await Promise.all([refetchAlerts(), refetchCalendar()]);
    },
    categories,
  });

  const alerts = useMemo(() => {
    return alertEntries
      .filter(({ daysLeft }) => daysLeft <= EXPIRY_THRESHOLD_DAYS)
      .slice(0, MAX_VISIBLE_ALERTS);
  }, [alertEntries]);

  const calendarDays = useMemo(() => buildCalendarDays(calendarMonth), [calendarMonth]);

  const selectedMonthEntries = useMemo(
    () => getMonthEntries(calendarEntries, calendarMonth),
    [calendarEntries, calendarMonth],
  );

  const selectedMonthEntriesByDay = useMemo(
    () => getMonthEntriesByDay(selectedMonthEntries),
    [selectedMonthEntries],
  );

  function openEdit(item: NonNullable<typeof alertItems>[number]) {
    setEditMode("quantity-only");
    edit.open(item);
  }

  return (
    <>
      <Card className="bg-[#f0f1f6] dark:bg-[var(--surface)]">
        <CardContent className="p-5 md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-semibold text-[var(--foreground)]">{t("freshness.title")}</h2>
              <p className="mt-1 text-xs text-[var(--muted)]">{t("freshness.subtitle", { count: MAX_VISIBLE_ALERTS })}</p>
            </div>
            <Button onClick={() => setIsCalendarOpen(true)}>
              {t("freshness.viewCalendar")} <ArrowRight size={12} />
            </Button>
          </div>

          <div className="space-y-3">
            {loading ? <p className="px-1 py-4 text-sm text-[var(--muted)]">{t("freshness.loading")}</p> : null}
            {error ? <p className="px-1 py-4 text-sm text-red-500">{t("common.error")}: {error}</p> : null}
            {!loading && !error && alerts.length === 0 ? (
              <p className="px-1 py-4 text-sm text-[var(--muted)]">{t("freshness.noItemsSoon")}</p>
            ) : null}

            {!loading &&
              !error &&
              alerts.map(({ item, daysLeft }) => (
                <ExpiryAlertItem
                  key={item.id}
                  item={item}
                  daysLeft={daysLeft}
                  onClick={() => openEdit(item)}
                />
              ))}
          </div>
        </CardContent>
      </Card>

      {edit.editingItem ? (
        <InventoryItemForm
          item={edit.editingItem}
          editName={edit.fields.editName}
          editFamily={edit.fields.editFamily}
          editStock={edit.fields.editStock}
          editExpiry={edit.fields.editExpiry}
          editCreatedAt={edit.fields.editCreatedAt}
          editValue={edit.fields.editValue}
          editCategoryId={edit.fields.editCategoryId}
          editZoneId={edit.fields.editZoneId}
          editZoneDetailId={edit.fields.editZoneDetailId}
          onNameChange={edit.setters.setEditName}
          onFamilyChange={edit.setters.setEditFamily}
          onStockChange={edit.setters.setEditStock}
          onExpiryChange={edit.setters.setEditExpiry}
          onCreatedAtChange={edit.setters.setEditCreatedAt}
          onValueChange={edit.setters.setEditValue}
          onCategoryChange={edit.setters.setEditCategoryId}
          onZoneChange={edit.setters.setEditZoneId}
          onZoneDetailChange={edit.setters.setEditZoneDetailId}
          onSave={edit.save}
          onCancel={edit.close}
          isSaving={edit.isSaving}
          error={edit.saveError}
          showDeleteConfirmation={edit.showDeleteConfirmation}
          onConfirmDelete={edit.confirmDelete}
          onCancelDelete={edit.continueWithoutShoppingList}
          pendingDelete={edit.pendingDelete}
          categories={categories}
          zones={zones}
          mode={editMode}
          onSwitchToFullEdit={editMode === "quantity-only" ? () => setEditMode("full") : undefined}
        />
      ) : null}

      {isCalendarOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto overscroll-contain bg-black/55 p-2 pb-[calc(1rem+env(safe-area-inset-bottom))]" onClick={() => setIsCalendarOpen(false)}>
          <div
            className="max-h-[94vh] w-full max-w-6xl overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] shadow-2xl sm:rounded-3xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-4 sm:px-5 md:px-6">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{t("freshness.calendarLabel")}</p>
                <h3 className="mt-1 text-xl font-semibold text-[var(--foreground)] sm:text-2xl">{t("freshness.calendarTitle")}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCalendarOpen(false)}
                className="rounded-full p-2 text-[var(--muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
                aria-label={t("freshness.closeCalendar")}
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-5 p-4 sm:p-5 md:grid-cols-[minmax(0,1.45fr)_320px] md:gap-6 md:p-6 lg:grid-cols-[minmax(0,1.6fr)_360px]">
              <div className="min-w-0">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCalendarMonth(
                        new Date(Date.UTC(calendarMonth.getUTCFullYear(), calendarMonth.getUTCMonth() - 1, 1)),
                      )
                    }
                    className="inline-flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-strong)]"
                  >
                    <ChevronLeft size={16} />
                    {t("freshness.prev")}
                  </button>
                  <p className="text-center text-base font-semibold text-[var(--foreground)] sm:text-lg">{formatCalendarTitle(calendarMonth)}</p>
                  <button
                    type="button"
                    onClick={() =>
                      setCalendarMonth(
                        new Date(Date.UTC(calendarMonth.getUTCFullYear(), calendarMonth.getUTCMonth() + 1, 1)),
                      )
                    }
                    className="inline-flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-strong)]"
                  >
                    {t("freshness.next")}
                    <ChevronRight size={16} />
                  </button>
                </div>

                {calendarLoading ? (
                  <p className="mb-3 text-sm text-[var(--muted)]">{t("freshness.loading")}</p>
                ) : null}
                {calendarError ? (
                  <p className="mb-3 text-sm text-red-500">{t("common.error")}: {calendarError}</p>
                ) : null}

                <div className="hidden grid-cols-7 gap-2 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)] md:grid">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="py-2">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="hidden grid-cols-7 gap-2 md:grid">
                  {calendarDays.map((date, index) => {
                    if (!date) {
                      return <div key={`empty-${index}`} className="min-h-[110px] rounded-2xl bg-[var(--surface-elevated)] lg:min-h-[118px]" />;
                    }

                    const dayKey = formatDateKey(date);
                    const dayEntries = itemsByDay[dayKey] ?? [];

                    return (
                      <div key={dayKey} className="min-h-[110px] rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-2 lg:min-h-[118px]">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm font-semibold text-[var(--foreground)]">{date.getUTCDate()}</span>
                          {dayEntries.length > 0 ? (
                            <span className="rounded-full bg-[var(--primary-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--primary)]">
                              {dayEntries.length}
                            </span>
                          ) : null}
                        </div>

                        <div className="space-y-1.5">
                          {dayEntries.slice(0, 2).map(({ item, daysLeft }) => (
                            <div
                              key={item.id}
                              className={`rounded-xl px-2 py-1.5 text-[11px] leading-4 ${
                                getAlertVariant(daysLeft) === 'danger'
                                  ? 'bg-[var(--danger)] text-[var(--background)]'
                                  : 'bg-[var(--surface-muted)] text-[var(--muted-strong)]'
                              }`}
                            >
                              <p className="line-clamp-2 font-semibold">{item.name}</p>
                              <p className="opacity-80">{t("freshness.inStock", { count: item.stock })}</p>
                            </div>
                          ))}
                          {dayEntries.length > 2 ? (
                            <p className="px-1 text-[11px] font-medium text-[var(--muted)]">{t("freshness.more", { count: dayEntries.length - 2 })}</p>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-3 md:hidden">
                  {selectedMonthEntries.length === 0 ? (
                    <div className="rounded-2xl bg-[var(--surface-elevated)] p-4 text-sm text-[var(--muted)]">
                      {t("freshness.noItemsMonth")}
                    </div>
                  ) : (
                    Object.entries(selectedMonthEntriesByDay).map(([dayKey, dayEntries]) => {
                      const displayDate = dayEntries[0]?.expiryDate;

                      return (
                        <div key={dayKey} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-3">
                          <div className="mb-3 flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-[var(--foreground)]">
                              {displayDate ? formatDayLabel(displayDate) : dayKey}
                            </p>
                            <Badge variant="secondary">
                              {dayEntries.length > 1
                                ? t("freshness.itemsCount", { count: dayEntries.length })
                                : t("freshness.itemCount", { count: dayEntries.length })}
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            {dayEntries.map(({ item, daysLeft }) => (
                              <div key={`${item.id}-${item.expiry}`} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                                <div className="flex items-start gap-3">
                                  <CategoryIcon category={item.category} />
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <p className="font-semibold text-[var(--foreground)]">{item.name}</p>
                                      <Badge variant={getAlertVariant(daysLeft)}>{getExpiryLabel(daysLeft, t)}</Badge>
                                    </div>
                                    <p className="mt-1 text-xs text-[var(--muted)]">{item.family}</p>
                                    <p className="mt-2 text-xs text-[var(--muted-strong)]">{t("freshness.qty", { count: item.stock })}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <Card className="hidden h-fit bg-[var(--surface-elevated)] md:sticky md:top-[88px] sm:block">
                <CardContent className="p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">{t("freshness.monthDetails")}</p>
                      <h4 className="mt-1 text-xl font-semibold text-[var(--foreground)]">{formatCalendarTitle(calendarMonth)}</h4>
                    </div>
                    <Badge variant="secondary">{t("freshness.itemsCount", { count: selectedMonthEntries.length })}</Badge>
                  </div>

                  <div className="space-y-3">
                    {selectedMonthEntries.length === 0 ? (
                      <p className="text-sm text-[var(--muted)]">{t("freshness.noItemsMonth")}</p>
                    ) : (
                      selectedMonthEntries.map(({ item, daysLeft, expiryDate }) => (
                        <div key={`${item.id}-${item.expiry}`} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
                          <div className="flex items-start gap-3">
                            <CategoryIcon category={item.category} />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="font-semibold text-[var(--foreground)]">{item.name}</p>
                                <Badge variant={getAlertVariant(daysLeft)}>{getExpiryLabel(daysLeft, t)}</Badge>
                              </div>
                              <p className="mt-1 text-xs text-[var(--muted)]">{item.family}</p>
                              <div className="mt-2 flex flex-wrap gap-3 text-xs text-[var(--muted-strong)]">
                                <span>{t("freshness.expiry", { value: formatDayLabel(expiryDate) })}</span>
                                <span>{t("freshness.qty", { count: item.stock })}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}