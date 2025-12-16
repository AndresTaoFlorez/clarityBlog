// backend/src/models/Comment.js
/**
 * Modelo Comment - Mapeo bidireccional entre:
 * - Supabase (tabla: comments → campos: comment, user_id, article_id)
 * - Frontend (espera: _id, comment, userId, articleId, createdAt, autor?)
 */
export class Comment {
  /** @private */
  constructor(data) {
    this.id = data.id || null;
    this.comment = data.comment || "";
    this.userId = data.userId || data.user_id;
    this.articleId = data.articleId;
    this.authorName = data.authorName || data.name;
    this.authorAvatar = data.authorAvatar || data.avatar;
    this.authorEmail = data.authorEmail || data.email;
    this.created_at = data.created_at || new Date().toISOString();
    this.updated_at = data.updated_at || new Date().toISOString();
  }

  /** Return API payload in English (with temporary Spanish aliases for compatibility) */
  toJSON() {
    return {
      id: this.id,
      comment: this.comment,
      userId: this.userId,
      articleId: this.articleId,
      authorName: this.authorName,
      authorAvatar: this.authorAvatar,
      authorEmail: this.authorEmail,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }

  /**
   * Update
   */
  toDatabase() {
    return {
      comment: this.comment,
      user_id: this.userId,
      article_id: this.articleId,
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Create / INSERTE
   */
  toInsert() {
    return {
      comment: this.comment,
      user_id: this.userId,
      article_id: this.articleId,
    };
  }

  /**
   * Factory method - Forma recomendada de crear instancias
   * @param {Object} data
   * @returns {Comment}
   */
  static create(data) {
    return new Comment(
      Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v != null && v !== ""),
      ),
    );
  }

  /**
   * Convierte un registro directo de Supabase a instancia de Comment
   * @param {Object} dbComment - Registro desde supabase.select()
   * @param {string} [authorName=''] - Nombre del autor (opcional, para frontend)
   * @returns {Comment}
   */
  static fromDatabase(dbComment) {
    return new Comment({
      id: dbComment.id,
      comment: dbComment.comment || "",
      userId: dbComment.userId || dbComment._id,
      articleId: dbComment.articleId || dbComment.article_id,
      authorName: dbComment.authorName || dbComment.name,
      authorAvatar: dbComment.authorAvatar || dbComment.avatar,
      authorEmail: dbComment.authorEmail || dbComment.email,
      created_at: dbComment.created_at,
      updated_at: dbComment.updated_at,
    });
  }

  static fromDatabaseList(dbComments) {
    return dbComments.map((comment) => Comment.fromDatabase(comment));
  }
}
