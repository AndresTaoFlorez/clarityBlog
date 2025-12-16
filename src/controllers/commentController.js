// backend/src/controllers/commentController.js
import { CommentService } from "../services/commentService.js";
import { db } from "../config/database.js";
import { isValid } from "../utils/validator.ts";
import { ArticleService } from "../services/ArticleService.js";

export class CommentController {
  // Crear comentario desde ruta anidada: POST /api/articles/:articleId/comments
  static async create(req, res, next) {
    try {
      // check articleId param
      const { articleId } = req.params;
      if (!isValid(articleId)) {
        return res.status(404).json({
          success: false,
          message: "Article ID is required",
        });
      }
      // check content of the comment
      const { comment } = req.body;
      if (!isValid(comment)) {
        return res.status(400).json({
          success: false,
          message: "Comment content is invalid",
        });
      }
      // check user role
      const { role } = req.user;
      const roles = ["admin", "user"];
      if (!roles.includes(role)) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const { data, error } = await CommentService.create(articleId, comment);

      if (error) {
        return res.status(404).json({
          success: false,
          message: error.message,
          data,
        });
      }

      return res.status(201).json({
        success: true,
        message: "Comment created successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCommentsByArticleId(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 5;
      const { articleId } = req.params;
      if (!isValid(articleId)) {
        return res.status(400).json({
          error: true,
          message: "Article Id invalid",
        });
      }

      const { data, error } = await CommentService.findAllByArticleId(
        articleId,
        {
          page,
          limit,
        },
      );

      if (error) {
        return res.status(409).json({
          success: false,
          message: error.message,
          data,
        });
      }

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener comentario por ID
  static async getById(req, res, next) {
    try {
      const { commentId } = req.params;
      if (!isValid(commentId)) {
        return res.status(400).json({
          success: false,
          message: "Comment ID is invalid",
        });
      }

      const { data, error } = await CommentService.findById(commentId);

      if (error) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getByUserId(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 5;
      const { userId } = req.params;
      if (!isValid(userId)) {
        return res.status(400).json({
          success: false,
          message: "User Id is invalid",
        });
      }

      const { data, error } = await CommentService.findByUserId(userId, {
        page,
        limit,
      });

      if (error) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // Actualizar comentario
  static async updateCommentByArticleId(req, res, next) {
    try {
      // check articleId param
      const { commentId } = req.params;
      if (!isValid(commentId)) {
        return res.status(404).json({
          success: false,
          message: "Comment ID is required",
        });
      }

      const { role } = req.user;
      const roles = ["admin", "user"];
      if (!roles.includes(role)) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      // check content of the comment
      const { comment } = req.body;
      if (!isValid(comment)) {
        return res.status(400).json({
          success: false,
          message: `Comment content is invalid ${JSON.stringify(comment)}`,
        });
      }

      const { data, error } = await CommentService.update(
        commentId,
        req.user,
        comment,
      );

      if (error) {
        return res.status(error?.code || 400).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(201).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // Eliminar comentario
  static async delete(req, res, next) {
    try {
      const comment = await CommentService.findById(req.params.id);

      if (!comment) {
        return res.status(404).json({
          success: false,
          message: "Comentario no encontrado",
        });
      }

      // Verificar que el usuario sea el propietario o admin
      if (comment.userId !== req.user.id && req.user.rol !== "admin") {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to delete this comment",
        });
      }

      await CommentService.delete(req.params.id);

      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
