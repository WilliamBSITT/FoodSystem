import { supabase } from "@/lib/supabase";
import type { Category } from "@/hooks/useInventory";

/**
 * CategoryRepository - Encapsulates Supabase access for categories
 * Pure data operations without business logic
 */
export class CategoryRepository {
  static async fetchPage(page: number, pageSize: number): Promise<Category[]> {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name")
      .range(from, to);

    if (error) {
      throw error;
    }

    return (data ?? []) as Category[];
  }

  static async fetchCount(): Promise<number> {
    const { count, error } = await supabase
      .from("categories")
      .select("id", { count: "exact", head: true });

    if (error) {
      throw error;
    }

    return count ?? 0;
  }

  static async create(payload: Record<string, unknown>): Promise<Category> {
    const { data, error } = await supabase
      .from("categories")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return data as Category;
  }

  static async update(id: number, payload: Record<string, unknown>): Promise<Category> {
    const { data, error } = await supabase
      .from("categories")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return data as Category;
  }

  static async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id);

    if (error) {
      throw error;
    }
  }
}
