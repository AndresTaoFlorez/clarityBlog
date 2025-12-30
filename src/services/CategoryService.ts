// backend/src/services/CategoryService.js
import { db } from "../config/database";
import { isValid } from "@/utils/validator";
import type { PostgrestError } from "@supabase/supabase-js";
import { Category, CategoryInput } from "../models/Category";
import { ServiceResponse } from "@/utils";
import { UUID } from "node:crypto";

interface PaginationParams {
  page?: number;
  limit?: number;
}

interface PaginatedCategory<T = Category[]> {
  categories: T;
  total: number;
  page: number;
  pages: number;
}

/**
 * Custom type for Supabase responses that include pagination/count
 */
type DbResponse<T = unknown> = {
  data: T[] | [] | null;
  error: PostgrestError | null;
  count: number | 0 | null;
};
export class CategoryService {
  static async create(
    incomingCategory: CategoryInput,
  ): Promise<ServiceResponse<Category>> {
    try {
      const categoryCleaned = Category.create(incomingCategory);

      const { data, error } = await db
        .from("article_categories")
        .insert(categoryCleaned.toInsert())
        .select("*")
        .single();

      if (error || !isValid(data)) {
        return ServiceResponse.error(
          data,
          isValid(data)
            ? error?.message
            : `Category could be exist \n${categoryCleaned}`,
        );
      }

      const category = Category.fromDatabase(data);
      return ServiceResponse.ok(category, "Category was successfully creaded");
    } catch (error) {
      return ServiceResponse.error(
        {} as Category,
        error instanceof Error
          ? error.message
          : "An unexpencted error ocurred while created cateogory",
      );
    }
  }

  static async update(
    categoryId: UUID,
    updateData: object = {},
  ): Promise<ServiceResponse<Category>> {
    try {
      const categoryInstance = Category.create(updateData);

      const { data, error } = await db
        .from("article_categories")
        .update(categoryInstance.toJSON())
        .eq("id", categoryId)
        .select("*")
        .single();

      if (error || !isValid(data)) {
        return ServiceResponse.error(
          {} as Category,
          isValid(data) ? error?.message : "No category to updated finded",
        );
      }

      const category = Category.fromDatabase(data);
      return ServiceResponse.ok(category, "Category was updated successfully");
    } catch (error) {
      return ServiceResponse.error(
        {} as Category,
        error instanceof Error
          ? error.message
          : "An unexpencted error ocurred while updating Category",
      );
    }
  }

  static async findAll({
    page = 1,
    limit = 10,
  }: PaginationParams = {}): Promise<
    ServiceResponse<PaginatedCategory<Category[]>>
  > {
    try {
      const noLimit = limit === 0;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await db
        .from("article_categories")
        .select("*", { count: "exact" })
        .order("label", { ascending: true })
        .range(from, to);

      if (error || !isValid(data)) {
        return ServiceResponse.error(
          {} as PaginatedCategory,
          isValid(data) ? error?.message : "Categories not found",
        );
      }

      const categories = Category.fromDatabaseList(data as any);
      return ServiceResponse.ok<PaginatedCategory>(
        {
          categories,
          page,
          pages: noLimit ? 1 : Math.ceil((count || 0) / limit),
          total: count || 0,
        },
        "The categories were found correctly",
      );
    } catch (error) {
      return ServiceResponse.error(
        {} as PaginatedCategory,
        error instanceof Error
          ? error.message
          : "An unexpencted error ocurred while fetching all Category",
      );
    }
  }

  static async search(
    query: string,
    { page = 1, limit = 10 }: PaginationParams = {},
  ): Promise<ServiceResponse<PaginatedCategory<Category[]>>> {
    try {
      const noLimit = limit === 0;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await db
        .from("article_categories")
        .select("*", { count: "exact" })
        .or(`value.ilike.%${query}%,label.ilike.%${query}%`)
        .order("label", { ascending: true })
        .range(from, to);

      if (error || !isValid(data)) {
        return ServiceResponse.error(
          {} as PaginatedCategory,
          isValid(data) ? error?.message : "Categories not found",
        );
      }

      const categories = Category.fromDatabaseList(data as any);
      return ServiceResponse.ok<PaginatedCategory>(
        {
          categories,
          page,
          pages: noLimit ? 1 : Math.ceil((count || 0) / limit),
          total: count || 0,
        },
        "Categories were found correctly",
      );
    } catch (error) {
      return ServiceResponse.error(
        {} as PaginatedCategory,
        error instanceof Error
          ? error.message
          : "An unexpencted error ocurred while searching  Category",
      );
    }
  }

  /**
   * Delete a category by ID
   * @param {String} categoryId - Category UUID
   * @returns {Promise<Object>} Deleted category or error object
   */
  static async delete(categoryId: UUID): Promise<ServiceResponse<Category>> {
    try {
      const { data, error } = await db
        .from("article_categories")
        .delete()
        .select("*")
        .eq("id", categoryId)
        .single();

      if (error || !isValid(data)) {
        return ServiceResponse.error(
          {} as Category,
          isValid(data) ? error?.message : "Category not found",
        );
      }

      const category = Category.fromDatabase(data);
      return ServiceResponse.ok(category, "Category was successfully deleted");
    } catch (error) {
      return ServiceResponse.error(
        {} as Category,
        error instanceof Error
          ? error.message
          : "An unexpencted error ocurred while created cateogory",
      );
    }
  }

  static async findByArticleId(
    articleId: UUID,
    { page = 1, limit = 10 }: PaginationParams = {},
  ): Promise<ServiceResponse<PaginatedCategory<Category[]>>> {
    try {
      const noLimit = limit === 0;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await db
        .from("articles_categories")
        .select(
          `
        article_categories!inner (
          id,
          value,
          label,
          created_at,
          updated_at
        )
      `,
          { count: "exact" },
        )
        .eq("article_id", articleId)
        .range(from, to);

      if (error || !isValid(data)) {
        return ServiceResponse.error(
          {} as PaginatedCategory,
          isValid(data) ? error?.message : "Categories not found",
        );
      }

      const categories = Category.fromDatabaseList(data as any);
      return ServiceResponse.ok<PaginatedCategory>(
        {
          categories,
          page,
          pages: noLimit ? 1 : Math.ceil((count || 0) / limit),
          total: count || 0,
        },
        "The categories were found correctly",
      );
    } catch (error) {
      return ServiceResponse.error(
        {} as PaginatedCategory,
        error instanceof Error
          ? error.message
          : "An unexpencted error ocurred while fetching all Category",
      );
    }
  }
}
