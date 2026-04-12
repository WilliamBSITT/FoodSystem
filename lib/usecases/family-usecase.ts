import { FamilyRepository, type FamilyOption } from "@/lib/repositories/family-repository";

/**
 * FamilyUsecase - Business logic for family operations
 * Handles normalization, validation, error mapping
 */
export class FamilyUsecase {
  /**
   * Fetches a page of families
   */
  static async fetchFamiliesPage(page: number, pageSize: number): Promise<FamilyOption[]> {
    return FamilyRepository.fetchPage(page, pageSize);
  }

  /**
   * Fetches total count of families
   */
  static async fetchFamilyCount(): Promise<number> {
    return FamilyRepository.fetchCount();
  }

  /**
   * Creates a family
   */
  static async createFamily(name: string, description?: string | null): Promise<FamilyOption> {
    return FamilyRepository.create(name, description);
  }

  /**
   * Updates a family
   */
  static async updateFamily(id: number, name: string, description?: string | null): Promise<FamilyOption> {
    return FamilyRepository.update(id, name, description);
  }

  /**
   * Deletes a family
   */
  static async deleteFamily(id: number): Promise<void> {
    return FamilyRepository.delete(id);
  }

  /**
   * Sorts families by name
   */
  static sortByName(families: FamilyOption[]): FamilyOption[] {
    return [...families].sort((a, b) => a.name.localeCompare(b.name));
  }
}
