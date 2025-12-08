// backend/src/controllers/commentController.js
import { CommentService } from '../services/commentService.js';

export class CommentController {
  // Crear comentario
  static async create(req, res, next) {
    try {
      const { notaId } = req.params;
      const { contenido } = req.body;

      const commentData = {
        contenido,
        usuario: req.user.id,
        notaId: notaId
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
      const { notaId } = req.params;

      const comments = await CommentService.findByArticleId(notaId);

      res.status(200).json({
        success: true,
        data: comments.map(comment => comment.toJSON())
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
