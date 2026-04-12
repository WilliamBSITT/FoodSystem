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

export const SHOPPING_CATEGORY_COLORS: Record<string, string> = {
  Dairy: "bg-blue-100 text-blue-700",
  Pantry: "bg-amber-100 text-amber-700",
  Fruits: "bg-orange-100 text-orange-700",
  Meat: "bg-red-100 text-red-700",
  Seafood: "bg-cyan-100 text-cyan-700",
  Frozen: "bg-indigo-100 text-indigo-700",
  Vegetables: "bg-green-100 text-green-700",
  Bakery: "bg-yellow-100 text-yellow-700",
  Beverages: "bg-purple-100 text-purple-700",
};

export const SHOPPING_CATEGORY_LABEL_KEYS = {
  Dairy: "shoppingCategories.dairy",
  Pantry: "shoppingCategories.pantry",
  Fruits: "shoppingCategories.fruits",
  Meat: "shoppingCategories.meat",
  Seafood: "shoppingCategories.seafood",
  Frozen: "shoppingCategories.frozen",
  Vegetables: "shoppingCategories.vegetables",
  Bakery: "shoppingCategories.bakery",
  Beverages: "shoppingCategories.beverages",
} as const;

export const SHOPPING_CATEGORY_OPTIONS = Object.keys(SHOPPING_CATEGORY_LABEL_KEYS) as Array<keyof typeof SHOPPING_CATEGORY_LABEL_KEYS>;

export const APP_VERSION = "v1.15.5";
export const APP_REPOSITORY_URL = "https://github.com/WilliamBSITT/FoodSystem";
