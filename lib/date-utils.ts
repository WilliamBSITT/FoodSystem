/**
 * Date utility functions for the application
 */

/**
 * Get today's date as an ISO string (YYYY-MM-DD)
 * Accounts for timezone offset to return the local date
 */
export function getTodayDateString(): string {
  const now = new Date();
  const timezoneOffsetMs = now.getTimezoneOffset() * 60 * 1000;
  return new Date(now.getTime() - timezoneOffsetMs).toISOString().slice(0, 10);
}

/**
 * Add months to an ISO date string (YYYY-MM-DD) and return YYYY-MM-DD
 */
export function addMonthsToDateString(baseDate: string, months: number): string {
  const match = baseDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return baseDate;
  }

  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10) - 1;
  const day = Number.parseInt(match[3], 10);

  const date = new Date(year, month, day);
  date.setMonth(date.getMonth() + months);

  const localOffsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - localOffsetMs).toISOString().slice(0, 10);
}
