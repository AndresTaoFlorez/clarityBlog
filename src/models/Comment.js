// backend/src/models/Comment.js
// Modelo de Comentario que mapea entre Supabase (comments) y Frontend

export class Comment {
  constructor(data) {
    // Mapear desde DB (Supabase usa: comment, user_id, article_id)
    // Frontend espera: contenido, usuario, notaId, autor
    this.id = data.id || null;
    this.contenido = data.contenido || data.comment || '';
    this.usuario = data.usuario || data.user_id || null;
    this.notaId = data.notaId || data.article_id || null;
    this.autor = data.autor || data.author_name || '';
    this.created_at = data.created_at || data.createdAt || new Date().toISOString();
    this.updated_at = data.updated_at || data.updatedAt || new Date().toISOString();
  }

  // Método para obtener el comentario en formato para el FRONTEND
  // Frontend espera: _id, contenido, usuario, notaId, autor, createdAt
  toJSON() {
    return {
      _id: this.id,
      contenido: this.contenido,
      usuario: this.usuario,
      notaId: this.notaId,
      autor: this.autor,
      createdAt: this.created_at
    };
  }

  // Método para preparar datos para SUPABASE (tabla comments)
  // Supabase usa: comment, user_id, article_id
  toDatabase() {
    return {
      comment: this.contenido,
      user_id: this.usuario,
      article_id: this.notaId,
      updated_at: new Date().toISOString()
    };
  }

  // Método para preparar datos de inserción en Supabase
  toInsert() {
    return {
      comment: this.contenido,
      user_id: this.usuario,
      article_id: this.notaId
    };
  }

  // Validación del modelo
  isValid() {
    return this.contenido &&
           this.usuario &&
           this.notaId &&
           this.contenido.trim().length >= 1 &&
           this.contenido.trim().length <= 500;
  }

  // Mapear desde resultado de Supabase a modelo Comment
  static fromDatabase(dbComment, authorName = '') {
    return new Comment({
      id: dbComment.id,
      comment: dbComment.comment,
      user_id: dbComment.user_id,
      article_id: dbComment.article_id,
      author_name: authorName,
      created_at: dbComment.created_at,
      updated_at: dbComment.updated_at
    });
  }
}
