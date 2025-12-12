// backend/src/controllers/noteController.js
import { ArticleService } from '../services/ArticleService.js';
import { CommentService } from '../services/commentService.js';

export class ArticleController {
  // Crear nota/artículo
  static async create(req, res, next) {
    try {
      const noteData = {
        ...req.body,
        usuario: req.user.id
      };

      const note = await ArticleService.create(noteData);

      res.status(201).json({
        success: true,
        message: 'Nota creada exitosamente',
        data: note.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener todas las notas con paginación
  static async getAll(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const userId = req.query.userId;

      const result = await ArticleService.findAll({ page, limit, userId });

      res.status(200).json({
        success: true,
        data: result.articles.map(note => note.toJSON()),
        pagination: {
          total: result.total,
          page: result.page,
          pages: result.pages
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener nota por ID con comentarios
  static async getById(req, res, next) {
    try {
      const note = await ArticleService.findById(req.params.id);

      if (!note) {
        return res.status(404).json({
          success: false,
          message: 'Nota no encontrada'
        });
      }

      // Obtener comentarios de la nota
      const comments = await CommentService.findByArticleId(req.params.id);

      const noteData = note.toJSON();
      noteData.comentarios = comments.map(comment => comment.toJSON());

      res.status(200).json({
        success: true,
        data: noteData
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener notas por usuario
  static async getByUserId(req, res, next) {
    try {
      const notes = await ArticleService.findByUserId(req.params.userId);

      res.status(200).json({
        success: true,
        data: notes.map(note => note.toJSON())
      });
    } catch (error) {
      next(error);
    }
  }

  // Buscar notas
  static async search(req, res, next) {
    try {
      const { q } = req.query;

      if (!q) {
        return res.status(400).json({
          success: false,
          message: 'Query de búsqueda es requerido'
        });
      }

      const notes = await ArticleService.search(q);

      res.status(200).json({
        success: true,
        data: notes.map(note => note.toJSON())
      });
    } catch (error) {
      next(error);
    }
  }

  // Actualizar nota
  static async update(req, res, next) {
    try {
      const note = await ArticleService.findById(req.params.id);

      if (!note) {
        return res.status(404).json({
          success: false,
          message: 'Nota no encontrada'
        });
      }

      // Verificar que el usuario sea el propietario
      if (note.usuario !== req.user.id && req.user.rol !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para actualizar esta nota'
        });
      }

      const updatedNote = await ArticleService.update(req.params.id, req.body);

      res.status(200).json({
        success: true,
        message: 'Nota actualizada exitosamente',
        data: updatedNote.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }

  // Eliminar nota
  static async delete(req, res, next) {
    try {
      const note = await ArticleService.findById(req.params.id);

      if (!note) {
        return res.status(404).json({
          success: false,
          message: 'Nota no encontrada'
        });
      }

      // Verificar que el usuario sea el propietario
      if (note.usuario !== req.user.id && req.user.rol !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para eliminar esta nota'
        });
      }

      await ArticleService.delete(req.params.id);

      res.status(200).json({
        success: true,
        message: 'Nota eliminada exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }
}
