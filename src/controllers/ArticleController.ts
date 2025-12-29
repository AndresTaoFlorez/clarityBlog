// backend/src/controllers/articleController.js
import type { Request, Response, NextFunction } from "express";
import { ControllerResponse } from "../utils/ControllerResponse";
import { ArticleService } from "../services/ArticleService";
import { isValid, merge, equal, checkUuids } from "../utils/validator";
import type { UUID } from "crypto";

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
      const userId = req.user?.id as UUID;

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
      const isArray: boolean = Array.isArray(req?.body.ids);
      const articleId = req.params?.articleId as UUID;

      if (isArray && isValid(articleId, { dataType: "uuid" })) {
        const response = ControllerResponse.badRequest(
          "Provide either articleId param or ids array in body, not both",
        );
        res.status(response.status).json(response);
        return;
      } else if (isArray) {
        return await ArticleController.softDeleteByArticleIds(req, res, next);
      } else {
        return await ArticleController.softDeleteByArticleId(req, res, next);
      }
    } catch (error) {
      next(error);
    }
  }

  private static async softDeleteByArticleIds(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId =
        isValid(req.user?.id, { dataType: "uuid" }) && (req.user?.id as UUID);
      const role = req.user?.role as string;
      const ids = req.body.ids;

      // 1. Validate input: array + UUIDs
      const {
        allFailed: allIdsWrogn,
        invalidIds: articleInvalidIds,
        validIds: articleValidIds,
      } = checkUuids(ids);

      if (allIdsWrogn || !userId) {
        const response = ControllerResponse.badRequest(
          userId
            ? `All Article IDs are invalid: ${JSON.stringify(articleInvalidIds, null, 2)}`
            : "User ID is invalid",
        );
        res.status(response.status).json(response);
        return;
      }

      let articleIdsToDelete = articleValidIds;
      let ownershipMeta: any = {};

      // 2. Non-admin: check ownership
      if (role !== "admin") {
        const ownershipResult = await ArticleService.checkIfUserOwnsArticle(
          userId,
          articleValidIds,
        );

        // if any articles from user id is finded
        if (!ownershipResult.success) {
          const response = ControllerResponse.notFound(ownershipResult.message);
          res.status(response.status).json(response);
          return;
        }

        articleIdsToDelete = ownershipResult.data;
        ownershipMeta = ownershipResult.meta || {};
      }

      // 3. Perform soft delete
      const deleteResult =
        await ArticleService.softManyDelete(articleIdsToDelete);

      if (!deleteResult.success) {
        const response = ControllerResponse.notFound(deleteResult.message);
        res.status(response.status).json(response);
        return;
      }

      // 4. Success response
      const finalMeta = merge(ownershipMeta, deleteResult.meta);

      const response = ControllerResponse.ok(
        deleteResult.data,
        deleteResult.message || "Articles soft-deleted successfully",
        finalMeta,
      );

      res.status(response.status).json(response);
      return;
    } catch (error) {
      next(error);
    }
  }
  private static async softDeleteByArticleId(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const articleId = req.params.articleId as UUID;
      const userId = req.user?.id as UUID;
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

      const articleMatched = articleMatchedResponse.data;
      if (!equal(articleMatched.userId, userId) && !equal(role, "admin")) {
        const response = ControllerResponse.unauthorized();
        res.status(response.status).json(response);
        return;
      }

      const { data, message, success } =
        await ArticleService.softDelete(articleId);
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
      const ids = req.body?.ids;

      // Check if IDs are in body (array)
      const isArray = Array.isArray(ids);

      if (isArray && isValid(articleId, { dataType: "uuid" })) {
        const response = ControllerResponse.badRequest(
          "Provide either articleId in URL or ids array in body, not both",
        );
        res.status(response.status).json(response);
        return;
      }

      if (isArray) {
        // Body has ids array
        return await ArticleController.hardDeleteByIds(req, res, next);
      } else if (articleId) {
        // URL param has articleId
        return await ArticleController.hardDeleteById(req, res, next);
      } else {
        // Neither provided
        const response = ControllerResponse.badRequest(
          "Either articleId in URL or ids array in body is required for hard delete",
        );
        res.status(response.status).json(response);
        return;
      }
    } catch (error) {
      next(error);
    }
  }

  private static async hardDeleteById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const articleId = req.params.articleId;

      if (!isValid(articleId, { dataType: "uuid" })) {
        const response = ControllerResponse.badRequest("Invalid Article ID");
        res.status(response.status).json(response);
        return;
      }

      const { data, message, success } =
        await ArticleService.hardDeleteById(articleId);

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

  private static async hardDeleteByIds(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const ids: string[] = req.body.ids;
      const page = parseIntSafely(req.query.page, 1);
      const limit = parseIntSafely(req.query.limit, 5);

      if (!isValid(ids, { dataType: "array" })) {
        const response = ControllerResponse.badRequest(
          "Article IDs must be an array",
        );
        res.status(response.status).json(response);
        return;
      }

      const invalidIds = ids.filter((id) => !isValid(id, { dataType: "uuid" }));
      if (invalidIds.length > 0) {
        const response = ControllerResponse.badRequest(
          `Invalid UUIDs: ${JSON.stringify(invalidIds)}`,
        );
        res.status(response.status).json(response);
        return;
      }

      const { data, message, success, meta } =
        await ArticleService.hardDeleteByIds(ids, { page, limit });

      if (!success) {
        const response = ControllerResponse.notFound(message);
        res.status(response.status).json(response);
        return;
      }

      const response = ControllerResponse.ok(data, message, meta);
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
      const role = req.user?.role as string;

      const { data, message, success } = await ArticleService.findAll({
        page,
        limit,
        role,
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

  static async getArticleById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.params.articleId as UUID;

      if (!isValid(userId, { dataType: "uuid" })) {
        const response = ControllerResponse.badRequest("Invalid User ID");
        res.status(response.status).json(response);
        return;
      }

      const { data, success, message } =
        await ArticleService.findByArticleId(userId);

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

  static async getArticleByIds(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const ids = req.body?.ids ?? [];
      const page = parseIntSafely(req.query.page, 1);
      const limit = parseIntSafely(req.query.limit, 5);

      if (!isValid(ids, { dataType: "array" })) {
        const response = ControllerResponse.badRequest(
          "Article IDs must be provided as an array",
        );
        res.status(response.status).json(response);
        return;
      }

      const incorrect = ids.filter(
        (id: string) => !isValid(id, { dataType: "uuid" }),
      );

      if (incorrect.length > 0 || !isValid(ids)) {
        const response = ControllerResponse.badRequest(
          `Article IDs is invalid
            ${JSON.stringify(incorrect)}`,
        );
        res.status(response.status).json(response.message);
        return;
      }

      const serviceResponse = await ArticleService.findManyArticlesById(ids, {
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
      return;
    } catch (error) {
      next(error);
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
      if (!serviceResponse.data || serviceResponse.data.articles.length === 0) {
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
      const articleId = req.params.articleId as UUID;
      const articleData = req.body;
      const userId = req.user?.id as UUID;
      const role = req.user?.role;

      if (
        !isValid(articleId, { dataType: "uuid" }) ||
        !isValid(userId, { dataType: "uuid" })
      ) {
        const response = ControllerResponse.badRequest(
          "Invalid Article or User ID to update",
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
      const articleMatched = articleMatchedResponse.data;
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

  static async recover(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const articleId = req.params.articleId;
      const ids = req.body?.ids;

      // Check if IDs are in body (array)
      const isArray = Array.isArray(ids);

      if (isArray && isValid(articleId, { dataType: "uuid" })) {
        const response = ControllerResponse.badRequest(
          "Provide either articleId in URL or ids array in body, not both",
        );
        res.status(response.status).json(response);
        return;
      }

      if (isArray) {
        // Body has ids array
        return await ArticleController.recoverByIds(req, res, next);
      } else if (articleId) {
        // URL param has articleId
        return await ArticleController.recoverById(req, res, next);
      } else {
        // Neither provided
        const response = ControllerResponse.badRequest(
          "Either articleId in URL or ids array in body is required",
        );
        res.status(response.status).json(response);
        return;
      }
    } catch (error) {
      next(error);
    }
  }
  private static async recoverById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const articleId = req.params.articleId as UUID;

      if (!isValid(articleId, { dataType: "uuid" })) {
        const response = ControllerResponse.badRequest("Invalid Article ID");
        res.status(response.status).json(response);
        return;
      }

      const { data, message, success } =
        await ArticleService.recoverById(articleId);

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

  private static async recoverByIds(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const ids = req.body.ids as UUID[];

      if (!isValid(ids, { dataType: "array" })) {
        const response = ControllerResponse.badRequest(
          "Article IDs must be an array",
        );
        res.status(response.status).json(response);
        return;
      }

      const invalidIds = ids.filter((id) => !isValid(id, { dataType: "uuid" }));
      if (invalidIds.length > 0) {
        const response = ControllerResponse.badRequest(
          `Invalid UUIDs: ${JSON.stringify(invalidIds)}`,
        );
        res.status(response.status).json(response);
        return;
      }

      const { data, message, success, meta } =
        await ArticleService.recoverByIds(ids);

      if (!success) {
        const response = ControllerResponse.notFound(message);
        res.status(response.status).json(response);
        return;
      }

      const response = ControllerResponse.ok(data, message, meta);
      res.status(response.status).json(response);
      return;
    } catch (error) {
      next(error);
    }
  }
}
