// backend/src/controllers/articleController.js
import type { Request, Response, NextFunction } from "express";
import { ControllerResponse } from "../utils/ControllerResponse.ts";
import { ArticleService } from "../services/ArticleService.ts";
import { isValid, merge, equal } from "../utils/validator.ts";

/**
 * Safely parses an integer from query params with default fallback
 */
function parseIntSafely(value: any, defaultValue: number): number {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) || parsed < 1 ? defaultValue : parsed;
}

export class ArticleController {
  static async create(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const articleData = req.body;
      const userId = req.user?.id;

      if (!articleData) {
        const response = ControllerResponse.badRequest();
        res.status(response.status).json(response);
        return;
      }

      const serviceResponse = await ArticleService.create(
        merge(req.body, { userId }),
      );

      if (!serviceResponse.success) {
        const response = ControllerResponse.serverError();
        res.status(response.status).json(response);
        return;
      }

      const response = ControllerResponse.created(
        serviceResponse.data,
        serviceResponse.message,
      );

      res.status(response.status).json(response);
      return;
    } catch (error) {
      console.error("Error in ArticleController.create:", error);
      next(error);
    }
  }

  static async delete(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const articleId = req.params.articleId;
      const userId = req.user?.id;
      const role = req.user?.role;

      if (
        !isValid(articleId, { dataType: "uuid" }) ||
        !isValid(userId, { dataType: "uuid" })
      ) {
        const response = ControllerResponse.badRequest(
          "Invalid Article or User ID",
        );
        res.status(response.status).json(response);
        return;
      }

      const articleMatchedResponse =
        await ArticleService.findByArticleId(articleId);
      const articleMatched = articleMatchedResponse.data[0];
      if (!articleMatchedResponse.success) {
        const response = ControllerResponse.notFound();
        res.status(response.status).json(response);
        return;
      }

      if (!equal(articleMatched.userId, userId) && !equal(role, "admin")) {
        const response = ControllerResponse.unauthorized();
        res.status(response.status).json(response);
        return;
      }

      const { data, message, success } = await ArticleService.delete(articleId);
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

  static async hardDelete(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const articleId = req.params.articleId;
      const userId = req.user?.id;
      const role = req.user?.role;

      if (
        !isValid(articleId, { dataType: "uuid" }) ||
        !isValid(userId, { dataType: "uuid" })
      ) {
        const response = ControllerResponse.badRequest(
          "Invalid Article or User ID",
        );
        res.status(response.status).json(response);
        return;
      }

      const articleMatchedResponse =
        await ArticleService.findByArticleId(articleId);
      if (!articleMatchedResponse.success) {
        const response = ControllerResponse.notFound();
        res.status(response.status).json(response);
        return;
      }

      const { data, message, success } =
        await ArticleService.hardDelete(articleId);
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

  // Create article
  static async getAll(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const page = parseIntSafely(req.query.page, 1);
      const limit = parseIntSafely(req.query.limit, 5);

      const serviceResponse = await ArticleService.findAll({ page, limit });

      if (!serviceResponse.success) {
        const response = ControllerResponse.notFound(serviceResponse.message);
        res.status(response.status).json(response);
        return;
      }

      if (!serviceResponse.data || serviceResponse.data.length === 0) {
        const response = ControllerResponse.notFound("Articles not found");
        res.status(response.status).json(response);
        return;
      }

      const response = ControllerResponse.ok(
        serviceResponse.data,
        serviceResponse.message,
      );

      res.status(response.status).json(response);
      return;
    } catch (error) {
      console.error("Error in ArticleController.getAll:", error);
    }
  }

  /**
   * GET /api/articles/:id
   * Retrieve articles by article ID
   */
  static async getById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const articleId = req.params.articleId;

      if (!isValid(articleId)) {
        const response = ControllerResponse.badRequest("Invalid article ID");
        res.status(response.status).json(response.message);
        return;
      }

      const serviceResponse = await ArticleService.findByArticleId(articleId);

      if (!serviceResponse.success) {
        const response = ControllerResponse.notFound("Article not found");
        res.status(response.status).json(response);
        return;
      }

      const response = ControllerResponse.ok(
        serviceResponse.data,
        "The Article has been found",
      );
      res.status(response.status).json(response);
      return;
    } catch (error) {
      console.error("Error in ArticleController.getAll:", error);
    }
  }

  /**
   * GET /api/articles/user/:userId
   * Retrieve articles by user ID with pagination
   */
  static async getByUserId(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // Extract and validate parameters
      const userId = req.params.userId;
      const page = parseIntSafely(req.query.page, 1);
      const limit = parseIntSafely(req.query.limit, 5);

      // Validate userId presence
      if (!isValid(userId, { dataType: "uuid" })) {
        const response = ControllerResponse.badRequest("User ID is required");
        res.status(response.status).json(response);
        return;
      }

      // Call service layer
      const serviceResponse = await ArticleService.findByUserId(userId, {
        page,
        limit,
      });

      // Handle service errors
      if (!serviceResponse.success) {
        const response = ControllerResponse.notFound(
          serviceResponse.message || "Articles not found",
        );
        res.status(response.status).json(response);
        return;
      }

      // Handle empty results
      if (!serviceResponse.data || serviceResponse.data.length === 0) {
        const response = ControllerResponse.notFound(
          "No articles found for this user",
        );
        res.status(response.status).json(response);
        return;
      }

      // Success response
      const response = ControllerResponse.ok(
        serviceResponse.data,
        serviceResponse.message,
      );
      res.status(response.status).json(response);
    } catch (error) {
      // Pass error to error handling middleware
      console.error("Error in ArticleController.getByUserId:", error);
      next(error);
    }
  }

  /**
   * UPDATE /api/articles/:articleId
   * Update articles by article ID
   */
  static async update(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const articleId = req.params.articleId;
      const articleData = req.body;
      const userId = req.user?.id;
      const role = req.user?.role;

      if (
        !isValid(articleId, { dataType: "uuid" }) ||
        !isValid(userId, { dataType: "uuid" })
      ) {
        const response = ControllerResponse.badRequest(
          "Invalid Article or User ID",
        );
        res.status(response.status).json(response);
        return;
      }
      if (!isValid(articleData)) {
        const response = ControllerResponse.badRequest(
          "Invalid Article body content",
        );
        res.status(response.status).json(response);
        return;
      }

      const articleMatchedResponse =
        await ArticleService.findByArticleId(articleId);
      const articleMatched = articleMatchedResponse.data[0];
      if (!articleMatchedResponse.success) {
        const response = ControllerResponse.notFound();
        res.status(response.status).json(response);
        return;
      }

      if (!equal(articleMatched.userId, userId) && !equal(role, "admin")) {
        const response = ControllerResponse.unauthorized();
        res.status(response.status).json(response);
        return;
      }

      const { data, message, success } = await ArticleService.update(
        articleId,
        articleData,
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
   * GET /api/articles/search?q=searchTerm&page=1&limit=5kj
   * Search articles by title or description
   */
  static async search(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const searchTerm = req.query.q as string;
      const page = parseIntSafely(req.query.page, 1);
      const limit = parseIntSafely(req.query.limit, 5);

      if (!searchTerm || searchTerm.trim() === "") {
        const response = ControllerResponse.badRequest(
          "Search term is required",
        );
        res.status(response.status).json(response);
        return;
      }

      const serviceResponse = await ArticleService.search(searchTerm, {
        page,
        limit,
      });

      if (!serviceResponse.success) {
        const response = ControllerResponse.notFound(serviceResponse.message);
        res.status(response.status).json(response);
        return;
      }

      const response = ControllerResponse.ok(
        serviceResponse.data,
        serviceResponse.message,
      );
      res.status(response.status).json(response);
    } catch (error) {
      console.error("Error in ArticleController.search:", error);
      next(error);
    }
  }
}
