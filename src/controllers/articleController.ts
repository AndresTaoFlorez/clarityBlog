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
      if (!ArticleController.isUuidValid(userId)) {
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

      if (!ArticleController.isUuidValid(articleId) || !ArticleController.isUuidValid(userId)) {
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
   * Validate if a value is a valid UUID v4 string (Supabase/Postgres format)
   * Returns false for null, undefined, non-string, or malformed UUIDs
   *
   * @param uuid - Value to validate (string | null | undefined | any)
   * @returns true only if it's a properly formatted UUID string
   */
  private static isUuidValid(uuid: any): boolean {
    // Guard clauses: reject non-strings, null, undefined, empty
    if (!uuid || typeof uuid !== "string" || uuid.trim() === "") {
      return false;
    }

    // Regex for standard UUID v4 (case-insensitive)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    return uuidRegex.test(uuid.trim());
  }
}
