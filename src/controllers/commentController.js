// backend/src/controllers/commentController.js
import { CommentService } from '../services/commentService.js';

export class CommentController {
  // Crear comentario
  static async create(req, res, next) {
    try {
      const { articleId } = req.params;
      const { contenido } = req.body;

      const commentData = {
        contenido,
        userId: req.user.id,
        notaId: articleId,
      };

      const comment = await CommentService.create(commentData);

      res.status(201).json({
        success: true,
        message: 'Comentario creado exitosamente',
        data: comment.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener comentarios de un artículo
  static async getCommentsByArticle(req, res, next) {
    try {
      const { articleId } = req.params;
      const { limit = 10, before, after } = req.query;

      // Validaciones básicas
      const pageSize = Math.min(parseInt(limit) || 10, 50); // máximo 50

      const comments = await CommentService.findByArticleIdPaginated({
        articleId,
        limit: pageSize,
        before,   // ISO string o undefined
        after,    // ISO string o undefined
      });

      // Obtener el siguiente cursor si hay más resultados
      const hasMore = comments.length === pageSize;
      const lastComment = comments[comments.length - 1];

      res.status(200).json({
        success: true,
        data: comments.map(c => c.toJSON()),
        pagination: {
          limit: pageSize,
          hasMore,
          // Si queremos cargar más antiguos → pasamos la fecha del último comentario
          nextCursor: hasMore ? lastComment.created_at : null,
          // Opcional: para ir hacia arriba (más nuevos)
          previousCursor: comments[0]?.created_at || null,
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener comentario por ID
  static async getById(req, res, next) {
    try {
      const comment = await CommentService.findById(req.params.id);

      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comentario no encontrado'
        });
      }

      res.status(200).json({
        success: true,
        data: comment.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }

  // Actualizar comentario
  static async update(req, res, next) {
    try {
      const comment = await CommentService.findById(req.params.id);

      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comentario no encontrado'
        });
      }

      // Verificar que el usuario sea el propietario
      if (comment.usuario !== req.user.id && req.user.rol !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para actualizar este comentario'
        });
      }

      const updatedComment = await CommentService.update(req.params.id, req.body);

      res.status(200).json({
        success: true,
        message: 'Comentario actualizado exitosamente',
        data: updatedComment.toJSON()
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
          message: 'Comentario no encontrado'
        });
      }

      // Verificar que el usuario sea el propietario o admin
      if (comment.usuario !== req.user.id && req.user.rol !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para eliminar este comentario'
        });
      }

      await CommentService.delete(req.params.id);

      res.status(200).json({
        success: true,
        message: 'Comentario eliminado correctamente'
      });
    } catch (error) {
      next(error);
    }
  }
}
