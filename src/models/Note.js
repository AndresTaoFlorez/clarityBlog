// backend/src/models/Note.js
// Modelo de Nota/Artículo que mapea entre Supabase (articles) y Frontend

export class Note {
  constructor(data) {
    // Mapear desde DB (Supabase usa: title, description, user_id, category)
    // Frontend espera: titulo, contenido, usuario, categoria, autor, avatar
    this.id = data.id || null;
    this.titulo = data.titulo || data.title || '';
    this.contenido = data.contenido || data.description || '';
    this.categoria = data.categoria || data.category || 'general';
    this.usuario = data.usuario || data.user_id || null;
    this.autor = data.autor || data.author_name || '';
    this.autor_avatar = data.autor_avatar || data.author_avatar || data.avatar || '😊';
    this.created_at = data.created_at || data.createdAt || new Date().toISOString();
    this.updated_at = data.updated_at || data.updatedAt || new Date().toISOString();
  }

  // Método para obtener la nota en formato para el FRONTEND
  // Frontend espera: _id, titulo, contenido, categoria, usuario, autor, createdAt, updatedAt
  toJSON() {
    return {
      _id: this.id,
      titulo: this.titulo,
      contenido: this.contenido,
      categoria: this.categoria,
      usuario: this.usuario,
      autor: this.autor,
      avatar: this.autor_avatar,
      createdAt: this.created_at,
      updatedAt: this.updated_at
    };
  }

  // Método para preparar datos para SUPABASE (tabla articles)
  // Supabase usa: title, description, user_id
  toDatabase() {
    return {
      title: this.titulo,
      description: this.contenido,
      user_id: this.usuario,
      updated_at: new Date().toISOString()
    };
  }

  // Método para preparar datos de inserción en Supabase
  toInsert() {
    return {
      title: this.titulo,
      description: this.contenido,
      user_id: this.usuario
    };
  }

  // Validación del modelo
  isValid() {
    return this.titulo &&
           this.contenido &&
           this.usuario &&
           this.titulo.trim().length >= 5 &&
           this.contenido.trim().length >= 10;
  }

  // Mapear desde resultado de Supabase a modelo Note
  static fromDatabase(dbArticle, authorName = '') {
    return new Note({
      id: dbArticle.id,
      title: dbArticle.title,
      description: dbArticle.description,
      user_id: dbArticle.user_id,
      author_name: authorName,
      created_at: dbArticle.created_at,
      updated_at: dbArticle.updated_at
    });
  }
}
