// backend/src/models/Comment.js
/**
 * Modelo Comment - Mapeo bidireccional entre:
 * - Supabase (tabla: comments → campos: comment, user_id, article_id)
 * - Frontend (espera: _id, contenido, userId, notaId, createdAt, autor?)
 */
export class Comment {
  /** @private */
  constructor({
    id = null,
    contenido = '',
    userId = null,
    notaId = null,
    created_at = new Date().toISOString(),
    updated_at = new Date().toISOString(),
  }) {
    this.id = id;
    this.contenido = contenido.trim();
    this.userId = userId;
    this.notaId = notaId;
    this.created_at = created_at;
    this.updated_at = updated_at;

    // Freeze en desarrollo para detectar mutaciones accidentales
    if (process.env.NODE_ENV !== 'production') {
      Object.freeze(this);
    }
  }

  /**
   * Devuelve representación para el Frontend
   */
  toJSON() {
    return {
      _id: this.id,
      contenido: this.contenido,
      userId: this.userId,
      notaId: this.notaId,
      createdAt: this.created_at,
      // Puedes incluir autor aquí si lo inyectas al crear la instancia
    };
  }

  /**
   * Datos para actualizar o insertar parcialmente en Supabase
   */
  toDatabase() {
    return {
      comment: this.contenido,
      user_id: this.userId,
      article_id: this.notaId,
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Solo los campos obligatorios para INSERT en Supabase
   */
  toInsert() {
    return {
      comment: this.contenido,
      user_id: this.userId,
      article_id: this.notaId,
    };
  }

  /**
   * Validación estricta con mensajes claros
   * @returns {{ isValid: boolean, errors: string[] }}
   */
  validate() {
    const errors = [];

    if (!this.userId || typeof this.userId !== 'string' || this.userId.trim() === '') {
      errors.push('userId es obligatorio y debe ser una cadena no vacía');
    }

    if (!this.notaId || typeof this.notaId !== 'string' || this.notaId.trim() === '') {
      errors.push('notaId es obligatorio y debe ser una cadena no vacía');
    }

    if (!this.contenido || typeof this.contenido !== 'string') {
      errors.push('contenido es obligatorio y debe ser una cadena');
    } else {
      const trimmed = this.contenido.trim();
      if (trimmed.length === 0) {
        errors.push('El comentario no puede estar vacío o ser solo espacios');
      }
      if (trimmed.length > 500) {
        errors.push('El comentario no puede exceder los 500 caracteres');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Alias simple para compatibilidad (mantiene tu API anterior)
   */
  isValid() {
    return this.validate().isValid;
  }

  /**
   * Factory method - Forma recomendada de crear instancias
   * @param {Object} data
   * @returns {Comment}
   * @throws {Error} si los datos son inválidos
   */
  static create(data) {
    const comment = new Comment({
      id: data.id ?? data._id ?? null,
      contenido: data.contenido ?? data.comment ?? '',
      userId: data.userId ?? data.user_id ?? data.user_id,
      notaId: data.notaId ?? data.article_id ?? data.nota_id,
      created_at: data.created_at ?? data.createdAt,
      updated_at: data.updated_at ?? data.updatedAt,
    });

    const validation = comment.validate();
    if (!validation.isValid) {
      throw new Error(`Comentario inválido: ${validation.errors.join('; ')}`);
    }

    return comment;
  }

  /**
   * Convierte un registro directo de Supabase a instancia de Comment
   * @param {Object} dbComment - Registro desde supabase.select()
   * @param {string} [authorName=''] - Nombre del autor (opcional, para frontend)
   * @returns {Comment}
   */
  static fromDatabase(dbComment, authorName = '') {
    return new Comment({
      id: dbComment.id,
      contenido: dbComment.comment || '',
      userId: dbComment.user_id,
      notaId: dbComment.article_id,
      created_at: dbComment.created_at,
      updated_at: dbComment.updated_at,
    });
  }
}