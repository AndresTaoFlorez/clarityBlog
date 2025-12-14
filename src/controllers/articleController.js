// backend/src/controllers/noteController.js
import { ArticleService } from "../services/ArticleService.js";
import { isValid } from "../utils/validator.ts";

export class ArticleController {
  // Create article
  static async create(req, res, next) {
    try {
      const noteData = {
        ...req.body,
        userId: req.user.id,
      };

      const note = await ArticleService.create(noteData);

      res.status(201).json({
        success: true,
        message: "Article created successfully",
        data: note.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  }

  // Get all articles with pagination
  static async getAll(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 5;

      const result = await ArticleService.findAll({
        page,
        limit,
      });

      if (!isValid(result, { dataType: "object" })) {
        return res.status(404).json({
          success: false,
          message: "No articles found",
        });
      }

      return res.status(200).json({
        success: true,
        data: result,
        pagination: {
          total: result.total,
          page: result.page,
          pages: result.pages,
          limit,
          hasMore: result.page < result.pages,
          nextPage: result.page < result.pages ? result.page + 1 : null,
          prevPage: result.page > 1 ? result.page - 1 : null,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Get article by ID with comments
  static async getById(req, res, next) {
    try {
      const articleId = req.params.id;
      if (!isValid(articleId)) {
        return res.status(404).json({
          success: false,
          message: "Article id is required",
        });
      }
      const article = await ArticleService.findById(articleId);

      if (!isValid(article)) {
        return res.status(404).json({
          success: false,
          message: "Article not found",
        });
      }

      res.status(200).json({
        success: true,
        data: article,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getByUserId(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 5;
      const userId = req.params.userId;
      if (!isValid(userId)) {
        return res.status(404).json({
          success: false,
          message: "User id is required",
        });
      }
      const article = await ArticleService.findByUserId(userId, {
        page,
        limit,
      });

      if (!isValid(article)) {
        return res.status(404).json({
          success: false,
          message: "Article not found",
        });
      }

      res.status(200).json({
        success: true,
        data: article,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search articles by query with role-based access control
   * - Regular users: search only their own articles
   * - Admins: search all articles or filter by userId
   *
   * @param {Object} req - Express request object
   * @param {Object} req.query - Query parameters
   * @param {string} req.query.q - Search term (required)
   * @param {string} [req.query.userId] - User ID filter (admin only)
   * @param {number} [req.query.page=1] - Page number for pagination
   * @param {number} [req.query.limit=5] - Items per page
   * @param {Object} req.user - Authenticated user
   * @param {string} req.user.id - User ID
   * @param {string} req.user.rol - User role (admin/user)
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware
   * @returns {Promise<void>}
   */
  static async search(req, res, next) {
    try {
      const { q, userId, page = 1, limit = 5 } = req.query;

      if (!isValid(q)) {
        return res.status(400).json({
          success: false,
          message: "Search query is required",
        });
      }

      // Enforce role-based scoping
      let scopedUserId = null;
      if (req.user?.rol !== "admin") {
        // Non-admins can only search their own articles
        scopedUserId = req.user.id;
      } else if (userId) {
        // Admins can optionally filter by userId
        scopedUserId = userId;
      }

      const result = await ArticleService.search(q, scopedUserId, {
        page: parseInt(page),
        limit: parseInt(limit),
      });

      res.status(200).json({
        success: true,
        data: result.articles.map((article) => article.toJSON()),
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

  // Update article
  static async update(req, res, next) {
    try {
      const article = await ArticleService.findById(req.params.id);

      if (!article) {
        return res.status(404).json({
          success: false,
          message: "Article not found",
        });
      }

      // Verificar que el user sea el propietario
      if (article.userId !== req.user.id && req.user.rol !== "admin") {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to update this article",
        });
      }

      const updatedArticle = await ArticleService.update(
        req.params.id,
        req.body,
      );

      res.status(200).json({
        success: true,
        message: "Article updated successfully",
        data: updatedArticle.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete article
  static async delete(req, res, next) {
    try {
      const article = await ArticleService.findById(req.params.id);

      if (!article) {
        return res.status(404).json({
          success: false,
          message: "Article not found",
        });
      }

      // Verificar que el user sea el propietario
      if (article.userId !== req.user.id && req.user.rol !== "admin") {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to delete this article",
        });
      }

      await ArticleService.delete(req.params.id);

      res.status(200).json({
        success: true,
        message: "Article deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}
