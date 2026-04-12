import { CategoryRepository } from "@/lib/repositories/category-repository";
import type { Category } from "@/hooks/useInventory";

const CATEGORY_SCHEMA_MISSING_MESSAGE = "Les catégories sont temporairement indisponibles. Veuillez réessayer plus tard.";

/**
 * CategoryUsecase - Business logic for category operations
 * Handles normalization, validation, error mapping
 */
export class CategoryUsecase {
  private static toErrorDetails(error: unknown): { code?: string; message?: string } | null {
    if (!error || typeof error !== "object") {
      return null;
    }

    const candidate = error as { code?: unknown; message?: unknown };

    return {
      code: typeof candidate.code === "string" ? candidate.code : undefined,
      message: typeof candidate.message === "string" ? candidate.message : undefined,
    };
  }

  private static mapError(error: { code?: string; message?: string } | null): Error {
    if (error?.code === "42P01") {
      return new Error(CATEGORY_SCHEMA_MISSING_MESSAGE);
    }

    return new Error(error?.message ?? "Failed to load categories");
  }

  private static normalizeCategory(category: Category): Category {
    const parsedExpiryMonths = Number.parseInt(
      String(category.default_expiry_months ?? category.default_expiry_days ?? 0),
      10,
    );

    return {
      ...category,
      keep_zero: Boolean(category.keep_zero),
      default_expiry_months: Number.isNaN(parsedExpiryMonths) ? 0 : Math.max(0, parsedExpiryMonths),
      notify_on_expiry: category.notify_on_expiry !== false,
    };
  }

  private static toLegacyPayload(payload: Omit<Category, "id">): Record<string, unknown> {
    const legacyPayload: Record<string, unknown> = { ...payload };

    const monthsValue = Number.parseInt(String(payload.default_expiry_months ?? 0), 10);
    const normalizedMonths = Number.isNaN(monthsValue) ? 0 : Math.max(0, monthsValue);

    delete legacyPayload.default_expiry_months;
    legacyPayload.default_expiry_days = normalizedMonths * 30;

    return legacyPayload;
  }

  private static withoutNotifyPayload(payload: Record<string, unknown>): Record<string, unknown> {
    const next = { ...payload };
    delete next.notify_on_expiry;
    return next;
  }

  /**
   * Fetches a page of categories with normalization
   */
  static async fetchCategoriesPage(page: number, pageSize: number): Promise<Category[]> {
    try {
      const data = await CategoryRepository.fetchPage(page, pageSize);
      return data.map((cat) => this.normalizeCategory(cat));
    } catch (error) {
      throw this.mapError(this.toErrorDetails(error));
    }
  }

  /**
   * Fetches total count of categories
   */
  static async fetchCategoryCount(): Promise<number> {
    try {
      return await CategoryRepository.fetchCount();
    } catch (error) {
      throw this.mapError(this.toErrorDetails(error));
    }
  }

  /**
   * Creates a category with fallback payload formats for schema compatibility
   */
  static async createCategory(payload: Omit<Category, "id">): Promise<Category> {
    try {
      let result: Category | null = null;
      let lastError: Error | null = null;

      // Try with original payload
      try {
        result = await CategoryRepository.create(payload);
      } catch (err) {
        lastError = err as Error;

        // Try with legacy payload format
        try {
          result = await CategoryRepository.create(this.toLegacyPayload(payload));
          lastError = null;
        } catch (err2) {
          lastError = err2 as Error;

          // Try without notify_on_expiry
          try {
            result = await CategoryRepository.create(this.withoutNotifyPayload(payload));
            lastError = null;
          } catch (err3) {
            lastError = err3 as Error;

            // Try legacy + without notify
            result = await CategoryRepository.create(
              this.withoutNotifyPayload(this.toLegacyPayload(payload))
            );
            lastError = null;
          }
        }
      }

      if (lastError) throw lastError;
      return this.normalizeCategory(result!);
    } catch (error) {
      throw this.mapError(this.toErrorDetails(error));
    }
  }

  /**
   * Updates a category with fallback payload formats
   */
  static async updateCategory(id: number, payload: Omit<Category, "id">): Promise<Category> {
    try {
      let result: Category | null = null;
      let lastError: Error | null = null;

      // Try with original payload
      try {
        result = await CategoryRepository.update(id, payload);
      } catch (err) {
        lastError = err as Error;

        // Try with legacy payload format
        try {
          result = await CategoryRepository.update(id, this.toLegacyPayload(payload));
          lastError = null;
        } catch (err2) {
          lastError = err2 as Error;

          // Try without notify_on_expiry
          try {
            result = await CategoryRepository.update(id, this.withoutNotifyPayload(payload));
            lastError = null;
          } catch (err3) {
            lastError = err3 as Error;

            // Try legacy + without notify
            result = await CategoryRepository.update(
              id,
              this.withoutNotifyPayload(this.toLegacyPayload(payload))
            );
            lastError = null;
          }
        }
      }

      if (lastError) throw lastError;
      return this.normalizeCategory(result!);
    } catch (error) {
      throw this.mapError(this.toErrorDetails(error));
    }
  }

  /**
   * Deletes a category
   */
  static async deleteCategory(id: number): Promise<void> {
    try {
      await CategoryRepository.delete(id);
    } catch (error) {
      throw this.mapError(this.toErrorDetails(error));
    }
  }

  /**
   * Sorts categories by name
   */
  static sortByName(categories: Category[]): Category[] {
    return [...categories].sort((a, b) => a.name.localeCompare(b.name));
  }
}
