// backend/src/controllers/categoryController.js
import { ControllerResponse } from "@/utils";
import { Request, Response, NextFunction } from "express";
import { CategoryService } from "../services/CategoryService";
import { isValid, parseIntSafely } from "../utils/validator";
import { UUID } from "node:crypto";

export class CategoryController {
  /**
   * Create a new category (Admin only)
   * @route POST /api/categories
   * @access Private (Admin)
   */
  static async createCategory(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const commentBody = req?.body;

      if (!isValid(commentBody, { dataType: "object" })) {
        const response = ControllerResponse.badRequest(
          "Category content is invalid",
        );
        res.status(response.status).json(response);
        return;
      }

      const { data, success, message } =
        await CategoryService.create(commentBody);

      if (!success) {
        const response = ControllerResponse.notFound(message);
        res.status(response.status).json(response);
        return;
      }

      const response = ControllerResponse.ok(data, message);
      res.status(response.status).json(response);
      return;
    } catch (error) {
      next(error);
    }
  }

  static async getAllCategories(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const page = parseIntSafely(req.params?.page, 1);
      const limit = parseIntSafely(req.params?.limit, 10);

      const { data, success, message } = await CategoryService.findAll({
        page,
        limit,
      });

      if (!success) {
        const response = ControllerResponse.notFound(message);
        res.status(response.status).json(response);
        return;
      }

      const response = ControllerResponse.ok(data, message);
      res.status(response.status).json(response);
      return;
    } catch (error) {
      next(error);
    }
  }

  static async getAllCategoriesByArticleId(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const articleId = req.params?.articleId as UUID;
      const page = parseIntSafely(req.params?.page, 1);
      const limit = parseIntSafely(req.params?.limit, 10);

      if (!isValid(articleId, { dataType: "uuid" })) {
        const response = ControllerResponse.badRequest(
          "Article ID is required",
        );
        res.status(response.status).json(response);
        return;
      }

      const { data, success, message } = await CategoryService.findByArticleId(
        articleId,
        {
          page,
          limit,
        },
      );

      if (!success) {
        const response = ControllerResponse.notFound(message);
        res.status(response.status).json(response);
        return;
      }

      const response = ControllerResponse.ok(data, message);
      res.status(response.status).json(response);
      return;
    } catch (error) {
      next(error);
    }
  }
  /**
   * Update an existing category (Admin only)
   * @route PUT /api/categories/:categoryId
   * @access Private (Admin)
   */
  static async updateCategory(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { categoryId } = req.params;
      const content = req?.body;

      if (!isValid(categoryId) || !isValid(content, { dataType: "object" })) {
        const response = ControllerResponse.badRequest(
          isValid(categoryId)
            ? "No valid field to update Category"
            : "Category ID is required",
        );
        res.status(response.status).json(response);
        return;
      }

      const { data, success, message } = await CategoryService.update(
        categoryId,
        content,
      );

      if (!success) {
        const response = ControllerResponse.notFound(message);
        res.status(response.status).json(response);
        return;
      }

      const response = ControllerResponse.ok(data, message);
      res.status(response.status).json(response);
      return;
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search categories by value or label
   * @route GET /api/categories/search
   * @access Public
   */
  static async searchCategories(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const q = req.query?.q as string;
      const page = parseIntSafely(req.params?.page, 1);
      const limit = parseIntSafely(req.params?.limit, 10);

      if (!isValid(q)) {
        const response = ControllerResponse.badRequest(
          "Search query is required",
        );
        res.status(response.status).json(response);
        return;
      }

      const { data, success, message } = await CategoryService.search(q, {
        page,
        limit,
      });

      if (!success) {
        const response = ControllerResponse.notFound(message);
        res.status(response.status).json(response);
        return;
      }

      const response = ControllerResponse.ok(data, message);
      res.status(response.status).json(response);
      return;
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a category (Admin only)
   * @route DELETE /api/categories/:categoryId
   * @access Private (Admin)
   */
  static async deleteCategory(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const categoryId = req.params?.categoryId as UUID;

      if (!isValid(categoryId, { dataType: "uuid" })) {
        const response = ControllerResponse.badRequest(
          "Category ID is required",
        );
        res.status(response.status).json(response);
        return;
      }

      const { data, success, message } =
        await CategoryService.delete(categoryId);

      if (!success) {
        const response = ControllerResponse.notFound(message);
        res.status(response.status).json(response);
      }

      const response = ControllerResponse.ok(data, message);
      res.status(response.status).json(response);
      return;
    } catch (error) {
      next(error);
    }
  }
}
