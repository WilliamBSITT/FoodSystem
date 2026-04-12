"use client";

import { useCallback, useState } from "react";
import { useI18n } from "@/components/providers/i18n-provider";
import { createProduct, type CreateProductInput } from "@/lib/product-service";
import { sanitizeInput, validateNotes, validateProductName } from "@/lib/input-validation";

interface UseAddProductReturn {
  submit: (input: Omit<CreateProductInput, "stock"> & { stock: string }) => Promise<boolean>;
  loading: boolean;
  error: string | null;
  success: string | null;
}

export function useAddProduct(): UseAddProductReturn {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const submit = useCallback(async (input: Omit<CreateProductInput, "stock"> & { stock: string }) => {
    setError(null);
    setSuccess(null);

    const sanitizedName = sanitizeInput(input.name);
    const sanitizedNote = sanitizeInput(input.note ?? "");
    const nameError = validateProductName(sanitizedName);
    const noteError = validateNotes(sanitizedNote);
    const parsedFamilyId = Number.parseInt(String(input.familyId), 10);
    const trimmedQuantity = input.stock.trim();
    const parsedQuantity = Number.parseFloat(trimmedQuantity.replace(",", "."));

    if (nameError) {
      setError(nameError);
      return false;
    }

    if (noteError) {
      setError(noteError);
      return false;
    }

    if (Number.isNaN(parsedFamilyId) || parsedFamilyId <= 0) {
      setError(t("addProduct.familyRequired"));
      return false;
    }

    if (!trimmedQuantity) {
      setError(t("addProduct.quantityRequired"));
      return false;
    }

    if (Number.isNaN(parsedQuantity)) {
      setError(t("addProduct.quantityInvalid"));
      return false;
    }

    if (!input.creationDate) {
      setError(t("addProduct.creationDateRequired"));
      return false;
    }

    setLoading(true);

    try {
      await createProduct({
        name: sanitizedName,
        familyId: parsedFamilyId,
        stock: parsedQuantity,
        expiryDate: input.expiryDate,
        creationDate: input.creationDate,
        note: sanitizedNote,
        categoryId: input.categoryId,
        zoneId: input.zoneId,
        zoneDetailId: input.zoneDetailId,
      });

      setSuccess(t("addProduct.createdSuccessfully"));
      return true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t("addProduct.unknownError");
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [t]);

  return { submit, loading, error, success };
}
