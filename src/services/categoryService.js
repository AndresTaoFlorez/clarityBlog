// backend/src/services/CategoryService.js
import { db } from "../config/database.js";
import { Category } from "../models/Category.js";

export class CategoryService {
  /**
   * Create a new category
   * @param {Object} incomingCategory
   * @param {String} incomingCategory.value - Category value (slug)
   * @param {String} incomingCategory.label - Category display name
   * @returns {Promise<Category|Object>} Category instance or error object
   */
  static async create(incomingCategory) {
    try {
      const category = Category.create(incomingCategory);
      const insertData = category.toInsert();

      const { data: existing, error: checkError } = await db
        .from("article_categories")
        .select("*")
        .or(
          `value.eq.${incomingCategory.value},label.eq.${incomingCategory.label}`,
        )
        .maybeSingle();

      if (existing) {
        return {
          error: true,
          data: {
            message: `Category with ${existing.value === incomingCategory.value ? "value" : "label"} already exists`,
            existing,
          },
        };
      }

      if (checkError) throw checkError;

      const { data, error } = await db
        .from("article_categories")
        .insert(insertData)
        .select("*");

      if (error) throw error;

      return Category.fromDatabase(data[0]);
    } catch (error) {
      throw new Error(`Create category failed: ${error.message}`);
    }
  }

  /**
   * Update an existing category
   * @param {String} categoryId - Category UUID
   * @param {Object} updateData
   * @param {String} [updateData.value] - New category value
   * @param {String} [updateData.label] - New category label
   * @returns {Promise<Category|Object>} Updated category or error object
   */
  static async update(categoryId, updateData) {
    try {
      // Check if category exists
      const { data: existing, error: checkError } = await db
        .from("article_categories")
        .select("*")
        .eq("id", categoryId)
        .single();

      if (checkError || !existing) {
        return { error: true, data: "Category not found" };
      }

      // Check for duplicates if value or label is being changed
      if (updateData.value || updateData.label) {
        const conditions = [];
        if (updateData.value) conditions.push(`value.eq.${updateData.value}`);
        if (updateData.label) conditions.push(`label.eq.${updateData.label}`);

        const { data: duplicate } = await db
          .from("article_categories")
          .select("*")
          .or(conditions.join(","))
          .neq("id", categoryId)
          .maybeSingle();

        if (duplicate) {
          return {
            error: true,
            data: {
              message: `Category with ${duplicate.value === updateData.value ? "value" : "label"} already exists`,
              existing: duplicate,
            },
          };
        }
      }

      const category = new Category({ ...existing, ...updateData });
      const updatePayload = category.toDatabase();

      const { data, error } = await db
        .from("article_categories")
        .update(updatePayload)
        .eq("id", categoryId)
        .select("*")
        .single();

      if (error) throw error;

      return { data: Category.fromDatabase(data) };
    } catch (error) {
      throw new Error(`Update category failed: ${error.message}`);
    }
  }

  /**
   * Get all categories with pagination
   * @param {Object} options - Pagination options
   * @param {number} [options.page=1] - Page number
   * @param {number} [options.limit=10] - Items per page
   * @returns {Promise<Object>} Paginated categories with metadata
   */
  static async findAll({ page = 1, limit = 10 } = {}) {
    try {
      const offset = (page - 1) * limit;

      const { data, error, count } = await db
        .from("article_categories")
        .select("*", { count: "exact" })
        .order("label", { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      const categories = Category.fromDatabaseList(data);

      return {
        categories,
        total: count,
        page,
        pages: Math.ceil(count / limit),
      };
    } catch (error) {
      throw new Error(`Error fetching categories: ${error.message}`);
    }
  }

  /**
   * Search categories by value or label
   * @param {String} query - Search term
   * @param {Object} options - Pagination options
   * @param {number} [options.page=1] - Page number
   * @param {number} [options.limit=10] - Items per page
   * @returns {Promise<Object>} Paginated search results with metadata
   */
  static async search(query, { page = 1, limit = 10 } = {}) {
    try {
      const offset = (page - 1) * limit;

      const { data, error, count } = await db
        .from("article_categories")
        .select("*", { count: "exact" })
        .or(`value.ilike.%${query}%,label.ilike.%${query}%`)
        .order("label", { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      const categories = Category.fromDatabaseList(data);

      return {
        categories,
        total: count,
        page,
        pages: Math.ceil(count / limit),
      };
    } catch (error) {
      throw new Error(`Error searching categories: ${error.message}`);
    }
  }

  /**
   * Delete a category by ID
   * @param {String} categoryId - Category UUID
   * @returns {Promise<Object>} Deleted category or error object
   */
  static async delete(categoryId) {
    try {
      const { data: existing, error: checkError } = await db
        .from("article_categories")
        .select("*")
        .eq("id", categoryId)
        .single();

      if (checkError || !existing) {
        return { error: true, data: "Category not found" };
      }

      const { error } = await db
        .from("article_categories")
        .delete()
        .eq("id", categoryId);

      if (error) throw error;

      return { error: false, data: existing };
    } catch (error) {
      throw new Error(`Delete category failed: ${error.message}`);
    }
  }
}
