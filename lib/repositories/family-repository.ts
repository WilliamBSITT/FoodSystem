import { supabase } from "@/lib/supabase";

export type FamilyOption = {
  id: number;
  name: string;
  description?: string | null;
};

/**
 * FamilyRepository - Encapsulates Supabase access for families
 * Pure data operations without business logic
 */
export class FamilyRepository {
  static async fetchPage(page: number, pageSize: number): Promise<FamilyOption[]> {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from("familly")
      .select("id,name,description")
      .order("name")
      .range(from, to);

    if (error) {
      throw error;
    }

    return (data ?? []) as FamilyOption[];
  }

  static async fetchCount(): Promise<number> {
    const { count, error } = await supabase
      .from("familly")
      .select("id", { count: "exact", head: true });

    if (error) {
      throw error;
    }

    return count ?? 0;
  }

  static async create(name: string, description?: string | null): Promise<FamilyOption> {
    const { data, error } = await supabase
      .from("familly")
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
      })
      .select("id,name,description")
      .single();

    if (error) {
      throw error;
    }

    return data as FamilyOption;
  }

  static async update(id: number, name: string, description?: string | null): Promise<FamilyOption> {
    const { data, error } = await supabase
      .from("familly")
      .update({
        name: name.trim(),
        description: description?.trim() || null,
      })
      .eq("id", id)
      .select("id,name,description")
      .single();

    if (error) {
      throw error;
    }

    return data as FamilyOption;
  }

  static async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from("familly")
      .delete()
      .eq("id", id);

    if (error) {
      throw error;
    }
  }
}
