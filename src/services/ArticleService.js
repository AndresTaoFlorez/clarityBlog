// backend/src/services/noteService.js
import { db } from '../config/database.js';
import { Note } from '../models/Note.js';

export class ArticleService {
  // Crear artículo/nota
  static async create(noteData) {
    try {
      const note = new Note(noteData);

      if (!note.isValid()) {
        throw new Error('Datos de nota inválidos');
      }

      // Insertar en tabla 'articles' de Supabase
      const { data: newArticle, error } = await db
        .from('articles')
        .insert([note.toInsert()])
        .select()
        .single();

      if (error) throw error;

      // Obtener nombre del autor
      const { data: userData } = await db
        .from('users')
        .select('name')
        .eq('id', newArticle.user_id)
        .single();

      return Note.fromDatabase(newArticle, userData?.name || '');
    } catch (error) {
      throw new Error(`Error al crear nota: ${error.message}`);
    }
  }

  // Obtener artículo/nota por ID con el nombre del autor
  static async findById(id) {
    try {
      const { data: articleData, error } = await db
        .from('articles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!articleData) return null;

      // Obtener nombre del autor
      const { data: userData } = await db
        .from('users')
        .select('name')
        .eq('id', articleData.user_id)
        .single();

      return Note.fromDatabase(articleData, userData?.name || '');
    } catch (error) {
      throw new Error(`Error al buscar nota: ${error.message}`);
    }
  }

  // Obtener todos los artículos/notas con paginación y filtros
  static async findAll({ page = 1, limit = 10, userId } = {}) {
    try {
      const offset = (page - 1) * limit;

      let query = db
        .from('articles')
        .select('*', { count: 'exact' });

      // Aplicar filtros
      if (userId) {
        query = query.eq('user_id', userId);
      }

      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data: articlesData, error, count } = await query;

      if (error) throw error;

      // Obtener nombres de autores para todos los artículos
      const articlesWithAuthors = await Promise.all(
        articlesData.map(async (article) => {
          const { data: userData } = await db
            .from('users')
            .select('name')
            .eq('id', article.user_id)
            .single();

          return Note.fromDatabase(article, userData?.name || '');
        })
      );

      return {
        articles: articlesWithAuthors,
        total: count,
        page,
        pages: Math.ceil(count / limit)
      };
    } catch (error) {
      throw new Error(`Error al obtener notas: ${error.message}`);
    }
  }

  // Obtener artículos/notas por usuario
  static async findByUserId(userId) {
    try {
      const { data: articlesData, error } = await db
        .from('articles')
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

      return articlesData.map(article =>
        Note.fromDatabase(article, userData?.name || '')
      );
    } catch (error) {
      throw new Error(`Error al obtener notas del usuario: ${error.message}`);
    }
  }

  // Buscar artículos por query
  static async search(query) {
    try {
      const { data: articlesData, error } = await db
        .from('articles')
        .select('*')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Obtener nombres de autores
      const articlesWithAuthors = await Promise.all(
        articlesData.map(async (article) => {
          const { data: userData } = await db
            .from('users')
            .select('name')
            .eq('id', article.user_id)
            .single();

          return Note.fromDatabase(article, userData?.name || '');
        })
      );

      return articlesWithAuthors;
    } catch (error) {
      throw new Error(`Error al buscar notas: ${error.message}`);
    }
  }

  // Actualizar artículo/nota
  static async update(id, noteData) {
    try {
      const updateData = {};

      if (noteData.titulo) updateData.title = noteData.titulo;
      if (noteData.contenido) updateData.description = noteData.contenido;

      updateData.updated_at = new Date().toISOString();

      const { data: updatedArticle, error } = await db
        .from('articles')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Obtener nombre del autor
      const { data: userData } = await db
        .from('users')
        .select('name')
        .eq('id', updatedArticle.user_id)
        .single();

      return Note.fromDatabase(updatedArticle, userData?.name || '');
    } catch (error) {
      throw new Error(`Error al actualizar nota: ${error.message}`);
    }
  }

  // Eliminar artículo/nota (CASCADE eliminará comments relacionados)
  static async delete(id) {
    try {
      const { error } = await db
        .from('articles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return true;
    } catch (error) {
      throw new Error(`Error al eliminar nota: ${error.message}`);
    }
  }
}
