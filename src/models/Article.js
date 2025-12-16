// backend/src/models/Note.js
// Modelo de Nota/Artículo que mapea entre Supabase (articles) y Frontend
export class Article {
  constructor(data) {
    // Map from DB (Supabase uses: title, description, user_id)
    // API expects: id, title, content, categoryId, userId, author, avatar
    this.id = data.id || data._id || null;
    this.title = data.title || "";
    this.content = data.content || "";
    this.categories = data.categories || [];
    this.userId = data.userId || data.user_id || null;
    this.authorName = data.authorName || "john doe";
    this.authorAvatar = data.authorAvatar || "🫥";
    this.authorEmail = data.authorEmail || "";
    this.deleted_at = data.deleted_at || null;
    this.created_at =
      data.created_at || data.createdAt || new Date().toISOString();
    this.updated_at =
      data.updated_at || data.updatedAt || new Date().toISOString();
  }

  // Return API payload in English only
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      content: this.content,
      userId: this.userId,
      authorName: this.authorName,
      authorAvatar: this.authorAvatar,
      authorEmail: this.authorEmail,
      categories: this.categories,
      deleted_at: this.deleted_at,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }

  // Prepare data for Supabase (articles table)
  toDatabase() {
    return {
      title: this.title,
      description: this.content,
      updated_at: new Date().toISOString(),
    };
  }

  // Insert payload for Supabase
  toInsert() {
    return {
      title: this.title,
      description: this.content,
      user_id: this.userId,
      // categories is managed via junction table outside of this model
    };
  }

  // Model validation
  isValid() {
    return (
      this.title &&
      this.content &&
      this.userId &&
      this.title.trim().length >= 5 &&
      this.content.trim().length >= 10
    );
  }

  static create(article) {
    return new Article(
      Object.fromEntries(
        Object.entries(article).filter(([_, v]) => v != null && v !== ""),
      ),
    );
  }

  // Map from Supabase record to Article
  static fromDatabase(dbArticle) {
    return new Article({
      id: dbArticle.id,
      title: dbArticle.title,
      content: dbArticle.description || dbArticle.content,
      categories: dbArticle.categories,
      userId: dbArticle.user_id,
      authorName: dbArticle.user_name || dbArticle.name || dbArticle.authorName,
      authorAvatar:
        dbArticle.user_avatar || dbArticle.avatar || dbArticle.authorAvatar,
      authorEmail:
        dbArticle.user_email || dbArticle.email || dbArticle.authorEmail,
      deleted_at: dbArticle.deleted_at,
      categories: dbArticle.categories,
      created_at: dbArticle.created_at,
      updated_at: dbArticle.updated_at,
    });
  }

  static fromDatabaseCleaned(dbArticle) {
    return new Article({
      id: dbArticle.id,
      title: dbArticle.title,
      content: dbArticle.description,
      userId: dbArticle.user_id,
      categories: dbArticle.categories,
      deleted_at: dbArticle.deleted_at,
      created_at: dbArticle.created_at,
      updated_at: dbArticle.updated_at,
    });
  }
  static fromDatabaseList(dbArticles) {
    return dbArticles.map((article) => Article.fromDatabase(article));
  }
}
