// backend/src/models/Comment.ts
import type { UUID } from "crypto";

/**
 * Database representation of a comment from Supabase
 */
export interface DbComment {
  id: UUID;
  comment: string;
  user_id: UUID;
  article_id: UUID;
  created_at: string;
  updated_at: string;
  // Fields from joined user data
  userId?: UUID;
  name?: string;
  avatar?: string;
  email?: string;
  authorName?: string;
  authorAvatar?: string;
  authorEmail?: string;
  _id?: UUID;
}

/**
 * Comment data for creation
 */
export interface CommentCreateData {
  id?: UUID | null;
  comment: string;
  userId: UUID | string;
  articleId: UUID | string;
  authorName?: string;
  authorAvatar?: string;
  authorEmail?: string;
  name?: string;
  avatar?: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: UUID;
  article_id?: UUID;
}

/**
 * Comment API response format
 */
export interface CommentJSON {
  id: UUID | null;
  comment: string;
  userId: UUID | string;
  articleId: UUID | string;
  authorName?: string;
  authorAvatar?: string;
  authorEmail?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Modelo Comment - Mapeo bidireccional entre:
 * - Supabase (tabla: comments → campos: comment, user_id, article_id)
 * - Frontend (espera: id, comment, userId, articleId, createdAt, autor?)
 */
export class Comment {
  id: UUID | null;
  comment: string;
  userId: UUID | string;
  articleId: UUID | string;
  authorName?: string;
  authorAvatar?: string;
  authorEmail?: string;
  created_at: string;
  updated_at: string;

  /** @private */
  private constructor(data: CommentCreateData) {
    this.id = data.id || null;
    this.comment = data.comment || "";
    this.userId = data.userId || data.user_id || "";
    this.articleId = data.articleId || data.article_id || "";
    this.authorName = data.authorName || data.name;
    this.authorAvatar = data.authorAvatar || data.avatar;
    this.authorEmail = data.authorEmail || data.email;
    this.created_at = data.created_at || new Date().toISOString();
    this.updated_at = data.updated_at || new Date().toISOString();
  }

  /** Return API payload in English */
  toJSON(): CommentJSON {
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
   * Update - Format for database UPDATE operations
   */
  toDatabase(): {
    comment: string;
    user_id: UUID | string;
    article_id: UUID | string;
    updated_at: string;
  } {
    return {
      comment: this.comment,
      user_id: this.userId,
      article_id: this.articleId,
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Create / INSERT - Format for database INSERT operations
   */
  toInsert(): {
    comment: string;
    user_id: UUID | string;
    article_id: UUID | string;
  } {
    return {
      comment: this.comment,
      user_id: this.userId,
      article_id: this.articleId,
    };
  }

  /**
   * Factory method - Recommended way to create instances
   * @param data - Comment data
   * @returns Comment instance
   */
  static create(data: CommentCreateData): Comment {
    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v != null && v !== ""),
    ) as CommentCreateData;

    return new Comment(filteredData);
  }

  /**
   * Converts a Supabase record to a Comment instance
   * @param dbComment - Record from supabase.select()
   * @returns Comment instance
   */
  static fromDatabase(dbComment: DbComment | any): Comment {
    return new Comment({
      id: dbComment.id,
      comment: dbComment.comment || "",
      userId: dbComment.userId || dbComment.user_id || dbComment._id,
      articleId: dbComment.articleId || dbComment.article_id,
      authorName: dbComment.authorName || dbComment.name,
      authorAvatar: dbComment.authorAvatar || dbComment.avatar,
      authorEmail: dbComment.authorEmail || dbComment.email,
      created_at: dbComment.created_at,
      updated_at: dbComment.updated_at,
    });
  }

  /**
   * Converts an array of Supabase records to Comment instances
   * @param dbComments - Array of records from supabase
   * @returns Array of Comment instances
   */
  static fromDatabaseList(dbComments: DbComment[] | any[]): Comment[] {
    return dbComments.map((comment) => Comment.fromDatabase(comment));
  }
}
