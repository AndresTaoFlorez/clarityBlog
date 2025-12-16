// backend/src/controllers/categoryController.js
import { json } from "express";
import { CategoryService } from "../services/categoryService.js";
import { isValid } from "../utils/validator.ts";

export class CategoryController {
  /**
   * Create a new category (Admin only)
   * @route POST /api/categories
   * @access Private (Admin)
   */
  static async createCategory(req, res, next) {
    try {
      if (!isValid(req.body)) {
        return res
          .status(400)
          .json({ success: false, message: "Category content is invalid" });
      }

      const role = req.user.rol || req.user.role;
      if (!isValid(role) || role !== "admin") {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      const { value, label } = req.body;
      const newCategory = { value, label };

      const { error, ...categoryData } =
        await CategoryService.create(newCategory);

      if (error) {
        const { message, existing: data } = categoryData.data;
        return res.status(409).json({ success: false, message, data });
      }

      return res.status(201).json({
        success: true,
        message: "Category created successfully",
        data: categoryData,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all categories with pagination
   * @route GET /api/categories
   * @access Public
   */
  static async getAllCategories(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;

      const result = await CategoryService.findAll({
        page: parseInt(page),
        limit: parseInt(limit),
      });

      return res.status(200).json({
        success: true,
        data: result.categories.map((cat) => cat.toJSON()),
        pagination: {
          total: result.total,
          page: result.page,
          pages: result.pages,
          limit: parseInt(limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAllCategoriesByArticleId(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;

      const { articleId } = req.params;
      if (!isValid(articleId)) {
        return res.status(400).json({
          success: false,
          message: "Article ID is required",
        });
      }
      const { data: result, error } = await CategoryService.findByArticleId(
        articleId,
        {
          page: parseInt(page),
          limit: parseInt(limit),
        },
      );
      if (error) {
        return res.status(404).json({
          success: false,
          message: `Article not found: ${error}`,
        });
      }

      return res.status(200).json({
        success: true,
        data: result.payload,
        pagination: {
          total: result.total,
          page: result.page,
          pages: result.pages,
          limit: parseInt(limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }
  /**
   * Update an existing category (Admin only)
   * @route PUT /api/categories/:categoryId
   * @access Private (Admin)
   */
  static async updateCategory(req, res, next) {
    try {
      const { categoryId } = req.params;
      const role = req.user.rol || req.user.role;

      if (!isValid(categoryId)) {
        return res
          .status(400)
          .json({ success: false, message: "Category ID is required" });
      }

      if (!isValid(role) || role !== "admin") {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      if (!isValid(req.body)) {
        return res
          .status(400)
          .json({ success: false, message: "Update data is invalid" });
      }

      const { value, label } = req.body;
      const updateData = {};
      if (value) updateData.value = value;
      if (label) updateData.label = label;

      if (!isValid(value) || !isValid(label)) {
        return res
          .status(400)
          .json({ success: false, message: "No valid fields to update" });
      }

      const { error, data } = await CategoryService.update(
        categoryId,
        updateData,
      );

      if (error) {
        return res.status(data === "Category not found" ? 404 : 409).json({
          success: false,
          message: data.message || data,
          data: data.existing,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Category updated successfully",
        data: data.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search categories by value or label
   * @route GET /api/categories/search
   * @access Public
   */
  static async searchCategories(req, res, next) {
    try {
      const { q, page = 1, limit = 10 } = req.query;

      if (!isValid(q)) {
        return res.status(400).json({
          success: false,
          message: "Search query is required",
        });
      }

      const result = await CategoryService.search(q, {
        page: parseInt(page),
        limit: parseInt(limit),
      });

      return res.status(200).json({
        success: true,
        data: result.categories.map((cat) => cat.toJSON()),
        pagination: {
          total: result.total,
          page: result.page,
          pages: result.pages,
          limit: parseInt(limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a category (Admin only)
   * @route DELETE /api/categories/:categoryId
   * @access Private (Admin)
   */
  static async deleteCategory(req, res, next) {
    try {
      const { categoryId } = req.params;
      const role = req.user.rol || req.user.role;

      if (!isValid(categoryId)) {
        return res
          .status(400)
          .json({ success: false, message: "Category ID is required" });
      }

      if (!isValid(role) || role !== "admin") {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      const { error, data } = await CategoryService.delete(categoryId);

      if (error) {
        return res.status(404).json({
          success: false,
          message: data,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Category deleted successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}
