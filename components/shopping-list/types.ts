export interface ShoppingItem {
  id: number;
  name: string;
  category: string | null;
  qty: number;
  checked: boolean;
}

export interface UndoToast {
  item: ShoppingItem;
  timeoutId: ReturnType<typeof setTimeout>;
}
