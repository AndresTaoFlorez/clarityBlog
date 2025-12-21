// backend/src/models/Article.ts
import type { Database } from "../types/database.types";

type DbArticle = Database["public"]["Tables"]["articles"]["Row"];

export class Article {
  id: string | null = null;
  title: string = "";
  content: string = ""; // maps to DB "description"
  userId: string | null = null; // maps to DB "user_id"
  created_at: string = new Date().toISOString();
  updated_at: string = new Date().toISOString();
  deleted_at: string | null = null;

  // Frontend-only fields (not in DB table)
  categories: any[] = [];
  authorName: string = "john doe";
  authorAvatar: string = "🫥";
  authorEmail: string = "";

  constructor(data: Partial<any> = {}) {
    this.id = data.id ?? null;
    this.title = data.title ?? "";
    this.content = data.content ?? data.description ?? "";
    this.userId = data.userId ?? data.user_id ?? null;
    this.created_at = data.created_at ?? new Date().toISOString();
    this.updated_at = data.updated_at ?? new Date().toISOString();
    this.deleted_at = data.deleted_at ?? null;

    this.categories = data.categories ?? [];
    this.authorName =
      data.authorName ??
      data.user_name ??
      data.name ??
      data.author_name ??
      "john doe";
    this.authorAvatar =
      data.authorAvatar ??
      data.user_avatar ??
      data.avatar ??
      data.author_avatar ??
      "🫥";
    this.authorEmail =
      data.authorEmail ??
      data.user_email ??
      data.email ??
      data.author_email ??
      "";
  }

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
      created_at: this.created_at,
      updated_at: this.updated_at,
      deleted_at: this.deleted_at,
    };
  }

  // update
  toDatabase() {
    return {
      title: this.title,
      description: this.content,
      updated_at: new Date().toISOString(),
    };
  }

  // create
  toInsert() {
    return {
      title: this.title,
      description: this.content,
      user_id: this.userId,
    };
  }

  isValid() {
    return (
      !!this.title &&
      !!this.content &&
      !!this.userId &&
      this.title.trim().length >= 5 &&
      this.content.trim().length >= 10
    );
  }

  static fromDatabase(db: DbArticle) {
    return new Article(db);
  }

  static fromDatabaseList(list: DbArticle[]) {
    return list.map(Article.fromDatabase);
  }
}
