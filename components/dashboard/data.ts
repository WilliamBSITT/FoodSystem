export const menuItems = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { key: "inventory", label: "Inventory", href: "/inventory", icon: "inventory" },
  { key: "add-product", label: "Add Product", href: "/add-product", icon: "add" },
  { key: "shopping-list", label: "Shopping List", href: "/shopping-list", icon: "shopping-list" },
  { key: "settings", label: "Settings", href: "/settings", icon: "settings" },
] as const;

export type MenuItemKey = (typeof menuItems)[number]["key"];

export const suggestions = [
  {
    tag: "REDUCE WASTE",
    title: "Automated Surplus Reduction",
    description:
      "Your stock of Whole Milk is 25% higher than predicted usage. Decrease order for Tuesday by 4 units.",
  },
  {
    tag: "COST SAVING",
    title: "Bulk Purchase Alert",
    description:
      "San Marzano Tomatoes prices have dropped by 15%. Recommend stocking for 3 months (Saves $420).",
  },
  {
    tag: "EFFICIENCY",
    title: "Inventory Flow Shift",
    description:
      "Move Vanilla Pods to Storage Zone B for closer proximity to pastry prep station (Estimated -4 min/shift).",
  },
];