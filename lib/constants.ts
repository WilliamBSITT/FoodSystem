/**
 * Freshness and expiry constants
 */
// Number of alerts to show in the freshness alerts section
export const MAX_VISIBLE_ALERTS = 4;

// Number of milliseconds in a day, used for calculating days until expiry
export const DAY_MS = 24 * 60 * 60 * 1000;

// Number of days before expiry to consider an item as "expiring soon" and show in freshness alerts
export const EXPIRY_THRESHOLD_DAYS = 30;

// Number of days before expiry to consider an item as "critical" and show with a red alert
export const ALERT_CRITICAL_DAYS = 7;

/**
 * Shopping list constants
 */
// Delay in milliseconds before permanent deletion of a shopping list item after undo toast
export const SHOPPING_LIST_UNDO_DELAY_MS = 8000;

// Maximum pixel distance for swipe gesture on shopping list items
export const SHOPPING_LIST_SWIPE_MAX = 110;

// Minimum password length for authentication
export const MIN_PASSWORD_LENGTH = 12;

export const PASSWORD_COMPLEXITY_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;

export function isPasswordComplex(password: string) {
  return PASSWORD_COMPLEXITY_REGEX.test(password);
}

export const APP_VERSION = "v1.16.2";
export const APP_REPOSITORY_URL = "https://github.com/WilliamBSITT/FoodSystem";
