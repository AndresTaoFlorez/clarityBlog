import { UUID } from "node:crypto";

export type CategoryInput = Partial<Category>;

/**
 * Category model for article categorization
 */
export class Category {
  public id: UUID | null = null;
  public value: string = "";
  public label: string = "";
  public created_at: string = new Date().toISOString();
  public updated_at: string = new Date().toISOString();
  public deleted_at: string | null = null;
  constructor(data: Partial<Category> = {}) {
    Object.assign(this, data);
  }

  toJSON() {
    return {
      id: this.id,
      value: this.value,
      label: this.label,
      created_at: this.created_at,
      updated_at: this.updated_at,
      deleted_at: this.deleted_at,
    };
  }

  toDatabase() {
    return {
      value: this.value,
      label: this.label,
      updated_at: this.updated_at,
      deleted_at: this.deleted_at,
    };
  }

  toInsert() {
    return {
      value: this.value,
      label: this.label,
    };
  }

  static create(category: Partial<any> = {}) {
    return new Category(
      Object.fromEntries(
        Object.entries(category).filter(([_, v]) => v != null && v !== ""),
      ),
    );
  }

  static fromDatabase(dbCategory: Partial<any> = {}) {
    return new Category({
      id: dbCategory.id,
      value: dbCategory.value,
      label: dbCategory.label,
      created_at: dbCategory.created_at,
      updated_at: dbCategory.updated_at,
    });
  }

  static fromDatabaseList(dbCategories: Partial<any[]> = []) {
    return dbCategories.map((category) => Category.fromDatabase(category));
  }
}
