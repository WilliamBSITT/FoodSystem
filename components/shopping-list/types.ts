import { type Category } from "@/hooks/useInventory";

export interface ShoppingItem {
  id: number;
  name: string;
  category_id: number | null;
  category?: Category | null;
  qty: number;
  checked: boolean;
}

export interface UndoToast {
  item: ShoppingItem;
  timeoutId: ReturnType<typeof setTimeout>;
}
