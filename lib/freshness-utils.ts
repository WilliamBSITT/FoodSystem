import { DAY_MS, ALERT_CRITICAL_DAYS } from "./constants";

type ExpiryLabelTranslationKey =
  | "freshness.expired"
  | "freshness.today"
  | "freshness.oneDayLeft"
  | "freshness.daysLeft";

type ExpiryLabelTranslator = (
  key: ExpiryLabelTranslationKey,
  values?: Record<string, string | number>,
) => string;

export function toUtcDay(expiryDate: string) {
  const match = expiryDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const year = Number.parseInt(match[1], 10);
    const month = Number.parseInt(match[2], 10);
    const day = Number.parseInt(match[3], 10);

    if (!Number.isNaN(year) && !Number.isNaN(month) && !Number.isNaN(day)) {
      return Date.UTC(year, month - 1, day);
    }
  }

  const parsed = new Date(expiryDate);
  if (Number.isNaN(parsed.getTime())) return Number.NaN;
  return Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate());
}

export function daysUntil(expiryDate: string) {
  const expiryUtcDay = toUtcDay(expiryDate);
  if (!Number.isFinite(expiryUtcDay)) return Number.NaN;

  const now = new Date();
  const todayUtcDay = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.floor((expiryUtcDay - todayUtcDay) / DAY_MS);
}

export function getExpiryLabel(daysLeft: number, t?: ExpiryLabelTranslator) {
  if (daysLeft < 0) return t ? t("freshness.expired") : "Expired";
  if (daysLeft === 0) return t ? t("freshness.today") : "Today";
  if (daysLeft === 1) return t ? t("freshness.oneDayLeft") : "1 day left";
  return t ? t("freshness.daysLeft", { count: daysLeft }) : `${daysLeft} days left`;
}

export function getAlertVariant(daysLeft: number): "danger" | "secondary" {
  return daysLeft <= ALERT_CRITICAL_DAYS ? "danger" : "secondary";
}

export function formatDateKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

export function parseExpiryDate(expiryDate: string) {
  const utcDay = toUtcDay(expiryDate);
  if (!Number.isFinite(utcDay)) return null;
  return new Date(utcDay);
}

export function formatCalendarTitle(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatDayLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
  }).format(date);
}

export function isSameMonth(left: Date, right: Date) {
  return left.getUTCFullYear() === right.getUTCFullYear() && left.getUTCMonth() === right.getUTCMonth();
}
