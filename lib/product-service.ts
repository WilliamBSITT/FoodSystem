import { supabase } from "@/lib/supabase";
import { invalidateClientCache, LOCAL_CACHE_KEYS } from "@/lib/client-cache";
import { sanitizeInput, validateNotes, validateProductName } from "@/lib/input-validation";

export interface CreateProductInput {
  name: string;
  familyId: number;
  stock: number;
  expiryDate?: string | null;
  creationDate: string;
  note?: string;
  categoryId?: number | null;
  zoneId?: number | null;
  zoneDetailId?: number | null;
}

export async function createProduct(input: CreateProductInput): Promise<void> {
  const sanitizedName = sanitizeInput(input.name);
  const sanitizedNote = sanitizeInput(input.note ?? "");
  const nameError = validateProductName(sanitizedName);
  const noteError = validateNotes(sanitizedNote);

  if (nameError) {
    throw new Error(nameError);
  }

  if (noteError) {
    throw new Error(noteError);
  }

  const hasExpiry = Boolean(input.expiryDate);

  const { error } = await supabase.from("inventory_items").insert({
    name: sanitizedName,
    family_id: input.familyId,
    stock: input.stock,
    expiry: hasExpiry ? input.expiryDate : null,
    created_at: input.creationDate,
    value: sanitizedNote || null,
    category_id: input.categoryId ?? null,
    zone_id: input.zoneId ?? null,
    zone_detail_id: input.zoneDetailId ?? null,
  });

  if (error) {
    console.error("Create product failed:", error);
    throw error;
  }

  // Invalidate cache so the new product appears in inventory
  invalidateClientCache(LOCAL_CACHE_KEYS.inventoryItems);
}
