import { supabase } from "./supabase";
import { type ShoppingItem } from "../components/shopping-list/types";

const SHOPPING_LIST_TABLE = "shopping_list_items";

export interface ShoppingListMutationInput {
  name: string;
  category_id: number | null;
  qty: number;
}

export async function fetchShoppingItemsPage(pageNumber: number, pageSize: number): Promise<ShoppingItem[]> {
  const from = pageNumber * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await supabase
    .from(SHOPPING_LIST_TABLE)
    .select("*,category:categories(*)")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Fetch shopping list page data failed:", error);
    throw error;
  }

  return (data as ShoppingItem[]) ?? [];
}

export async function fetchShoppingRemainingCount(): Promise<number> {
  const { count, error } = await supabase
    .from(SHOPPING_LIST_TABLE)
    .select("id", { count: "exact", head: true })
    .eq("checked", false);

  if (error) {
    console.error("Fetch shopping list remaining count failed:", error);
    throw error;
  }

  return count ?? 0;
}

export async function deleteShoppingItem(itemId: number): Promise<void> {
  const { error } = await supabase.from(SHOPPING_LIST_TABLE).delete().eq("id", itemId);

  if (error) {
    console.error("Delete shopping item failed:", error);
    throw error;
  }
}

export async function updateShoppingItem(
  itemId: number,
  data: Partial<ShoppingListMutationInput>,
): Promise<ShoppingItem> {
  const { data: updated, error } = await supabase
    .from(SHOPPING_LIST_TABLE)
    .update(data)
    .eq("id", itemId)
    .select("*,category:categories(*)")
    .single();

  if (error) {
    console.error("Update shopping item failed:", error);
    throw error;
  }

  return updated as ShoppingItem;
}

export async function addShoppingItem(
  data: ShoppingListMutationInput,
): Promise<ShoppingItem> {
  const { data: inserted, error } = await supabase
    .from(SHOPPING_LIST_TABLE)
    .insert({ name: data.name, category_id: data.category_id, qty: data.qty })
    .select("*,category:categories(*)")
    .single();

  if (error) {
    console.error("Add shopping item failed:", error);
    throw error;
  }

  return inserted as ShoppingItem;
}
