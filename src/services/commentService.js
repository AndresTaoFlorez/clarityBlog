// backend/src/services/commentService.js
import { db } from '../config/database.js';
import { Comment } from '../models/Comment.js';

export class CommentService {
  // Crear comentario
  static async create(commentData) {
    try {
      const comment = Comment.create(commentData);
      
      if (!comment.isValid()) {
        throw new Error(`Datos de comentario inválidos.`);
      }

      // Insertar en tabla 'comments' de Supabase
      const { data: newComment, error } = await db
        .from('comments')
        .insert([comment.toInsert()])
        .select()
        .single();

      if (error) throw error;

      // Obtener nombre del autor
      const { data: userData } = await db
        .from('users')
        .select('name')
        .eq('id', newComment.user_id)
        .single();

      return Comment.fromDatabase(newComment, userData?.name || '');
    } catch (error) {
      throw new Error(`Error al crear comentario: ${error.message}`);
    }
  }

  // Obtener comentario por ID
  static async findById(id) {
    try {
      const { data: commentData, error } = await db
        .from('comments')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!commentData) return null;

      // Obtener nombre del autor
      const { data: userData } = await db
        .from('users')
        .select('name')
        .eq('id', commentData.user_id)
        .single();

      return Comment.fromDatabase(commentData, userData?.name || '');
    } catch (error) {
      throw new Error(`Error al buscar comentario: ${error.message}`);
    }
  }

  // Obtener comentarios de un artículo
  static async findByArticleId(params) {
    try {
      // Backward compatibility: accept either a string (articleId) or an options object
      let articleId;
      let limit = 10;
      let before;
      let after;

      if (typeof params === 'string') {
        articleId = params;
      } else if (params && typeof params === 'object') {
        ({ articleId, limit = 10, before, after } = params);
      }

      // Normalizar si articleId llegó como objeto
      if (articleId && typeof articleId === 'object') {
        articleId = articleId.id || articleId._id || articleId.articleId || null;
      }

      // Validación básica del articleId
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[CommentService.findByArticleId] articleId typeof:', typeof articleId, 'value:', articleId);
      }
      if (!articleId || typeof articleId !== 'string' || articleId === '[object Object]') {
        throw new Error('articleId inválido: se esperaba una cadena UUID');
      }

      const pageSize = Math.min(parseInt(limit) || 10, 50);

      // Construir consulta con filtros opcionales
      let query = db
        .from('comments')
        .select('*')
        .eq('article_id', articleId);

      if (before) query = query.lt('created_at', before);
      if (after) query = query.gt('created_at', after);

      const { data: commentsData, error } = await query
        .order('created_at', { ascending: true })
        .limit(pageSize);

      if (error) throw error;

      // Obtener nombres de autores para cada comentario
      const commentsWithAuthors = await Promise.all(
        (commentsData || []).map(async (comment) => {
          const { data: userData } = await db
            .from('users')
            .select('name')
            .eq('id', comment.user_id)
            .single();

          return Comment.fromDatabase(comment, userData?.name || '');
        })
      );

      return commentsWithAuthors;
    } catch (error) {
      throw new Error(`Error al obtener comentarios: ${error.message}`);
    }
  }

  // Obtener comentarios de un usuario
  static async findByUserId(userId) {
    try {
      const { data: commentsData, error } = await db
        .from('comments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Obtener nombre del autor (será el mismo para todos)
      const { data: userData } = await db
        .from('users')
        .select('name')
        .eq('id', userId)
        .single();

      return commentsData.map(comment =>
        Comment.fromDatabase(comment, userData?.name || '')
      );
    } catch (error) {
      throw new Error(`Error al obtener comentarios del usuario: ${error.message}`);
    }
  }

  // Actualizar comentario
  static async update(id, commentData) {
    try {
      const updateData = {};

      if (commentData.contenido) updateData.comment = commentData.contenido;

      updateData.updated_at = new Date().toISOString();

      const { data: updatedComment, error } = await db
        .from('comments')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Obtener nombre del autor
      const { data: userData } = await db
        .from('users')
        .select('name')
        .eq('id', updatedComment.user_id)
        .single();

      return Comment.fromDatabase(updatedComment, userData?.name || '');
    } catch (error) {
      throw new Error(`Error al actualizar comentario: ${error.message}`);
    }
  }

  // Eliminar comentario
  static async delete(id) {
    try {
      const { error } = await db
        .from('comments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return true;
    } catch (error) {
      throw new Error(`Error al eliminar comentario: ${error.message}`);
    }
  }
}
