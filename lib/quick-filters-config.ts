import {
  Archive,
  Boxes,
  Leaf,
  Package,
  Snowflake,
  Timer,
  Warehouse,
  Wheat,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type QuickFilterKind = "category" | "family" | "zone" | "status";

export type QuickFilterIconName =
  | "Archive"
  | "Boxes"
  | "Leaf"
  | "Package"
  | "Snowflake"
  | "Timer"
  | "Warehouse"
  | "Wheat";

export type DashboardQuickFilterRow = {
  id: string;
  kind: QuickFilterKind;
  target_value: string;
  custom_title: string | null;
  custom_description: string | null;
  icon: QuickFilterIconName;
  accent_color: string;
  order_index: number;
};

export type QuickFilterDraft = {
  id: string;
  kind: QuickFilterKind;
  targetValue: string;
  customTitle: string;
  customDescription: string;
  icon: QuickFilterIconName;
  accentColor: string;
};

export type QuickFilterTargetOption = {
  id: string;
  kind: QuickFilterKind;
  label: string;
  href: string;
};

const ADVANCED_QUERY_PREFIX = "query:";

const QUICK_FILTER_DEFAULTS: Record<QuickFilterKind, { icon: QuickFilterIconName; accentColor: string }> = {
  category: { icon: "Boxes", accentColor: "#3345b8" },
  family: { icon: "Leaf", accentColor: "#2e8a4f" },
  zone: { icon: "Warehouse", accentColor: "#b86c2f" },
  status: { icon: "Timer", accentColor: "#c43f3f" },
};

export function getQuickFilterDefaults(kind: QuickFilterKind) {
  return QUICK_FILTER_DEFAULTS[kind];
}

export function createQuickFilterDraft(kind: QuickFilterKind, targetValue: string): QuickFilterDraft {
  const defaults = QUICK_FILTER_DEFAULTS[kind];

  return {
    id: typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${kind}-${targetValue}-${Date.now()}`,
    kind,
    targetValue,
    customTitle: "",
    customDescription: "",
    icon: defaults.icon,
    accentColor: defaults.accentColor,
  };
}

export function normalizeQuickFilterRow(row: DashboardQuickFilterRow): QuickFilterDraft {
  return {
    id: row.id,
    kind: row.kind,
    targetValue: row.target_value,
    customTitle: row.custom_title ?? "",
    customDescription: row.custom_description ?? "",
    icon: row.icon,
    accentColor: row.accent_color,
  };
}

export function toQuickFilterRow(draft: QuickFilterDraft, orderIndex: number): DashboardQuickFilterRow {
  return {
    id: draft.id,
    kind: draft.kind,
    target_value: draft.targetValue,
    custom_title: draft.customTitle.trim().length > 0 ? draft.customTitle.trim() : null,
    custom_description: draft.customDescription.trim().length > 0 ? draft.customDescription.trim() : null,
    icon: draft.icon,
    accent_color: draft.accentColor,
    order_index: orderIndex,
  };
}

export function buildInventoryFilterHref(kind: QuickFilterKind, value: string | number): string {
  const rawValue = String(value);

  if (rawValue.startsWith(ADVANCED_QUERY_PREFIX)) {
    const queryString = rawValue.slice(ADVANCED_QUERY_PREFIX.length);
    return queryString.length > 0 ? `/inventory?${queryString}` : "/inventory";
  }

  const params = new URLSearchParams();

  if (kind === "category") {
    params.set("categoryIds", String(value));
  } else if (kind === "family") {
    params.set("family", String(value));
  } else if (kind === "zone") {
    params.set("zoneIds", String(value));
  } else if (kind === "status") {
    params.set("status", String(value));
  }

  const queryString = params.toString();
  return queryString ? `/inventory?${queryString}` : "/inventory";
}

export function encodeAdvancedInventoryQuery(params: URLSearchParams): string {
  return `${ADVANCED_QUERY_PREFIX}${params.toString()}`;
}

export function decodeAdvancedInventoryQuery(value: string): URLSearchParams | null {
  if (!value.startsWith(ADVANCED_QUERY_PREFIX)) {
    return null;
  }

  return new URLSearchParams(value.slice(ADVANCED_QUERY_PREFIX.length));
}

export function getQuickFilterIcon(iconName: QuickFilterIconName): LucideIcon {
  const icons: Record<QuickFilterIconName, LucideIcon> = {
    Archive,
    Boxes,
    Leaf,
    Package,
    Snowflake,
    Timer,
    Warehouse,
    Wheat,
  };

  return icons[iconName] ?? Package;
}
