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
      const { articleId: rawArticleId } = req.params;
      const { limit: rawLimit = 10, before: rawBefore, after: rawAfter } = req.query;

      // Forzar logs aquí para ver valor real que llega de Express
      console.log('DEBUG params typeof:', typeof req.params.articleId, 'value:', req.params.articleId);
      console.log('DEBUG route params object:', req.params);

      if (process.env.NODE_ENV !== 'production') {
        console.debug('[CommentController.getCommentsByArticle] params:', req.params, 'query:', req.query);
      }

      // Normalizar articleId en caso de recibir un objeto en lugar de string
      let articleId = rawArticleId;
      if (rawArticleId && typeof rawArticleId === 'object') {
        articleId = rawArticleId.id || rawArticleId._id || rawArticleId.articleId || rawArticleId.toString?.();
      }

      const articleIdStr = String(articleId);
      const uuidLike = /^[0-9a-fA-F-]{36}$/;
      if (!articleIdStr || articleIdStr === '[object Object]' || !uuidLike.test(articleIdStr)) {
        return res.status(400).json({
          success: false,
          message: 'Parámetro articleId inválido. Debe ser un UUID',
        });
      }

      // Normalización robusta de query params
      const pickFirst = (v) => Array.isArray(v) ? v[0] : v;
      const toNumber = (v, def) => {
        const n = Number(pickFirst(v));
        return Number.isFinite(n) ? n : def;
      };
      const toStringOpt = (v) => {
        const val = pickFirst(v);
        return typeof val === 'string' ? val : undefined;
      };

      let pageSize = toNumber(rawLimit, 10);
      pageSize = Math.min(Math.max(1, pageSize), 50); // rango 1..50
      const before = toStringOpt(rawBefore);
      const after = toStringOpt(rawAfter);

      const comments = await CommentService.findByArticleId(
        articleIdStr,
        { limit: pageSize, before, after }
      );

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
