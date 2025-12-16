// backend/src/services/commentService.js
import { db } from "../config/database.js";
import { Comment } from "../models/Comment.js";
import { User } from "../models/User.js";
import { equal, isValid, merge } from "../utils/validator.ts";
import { UserService } from "./userService.js";

export class CommentService {
  // Crear comentario
  static async create(articleId, commentData) {
    try {
      // Get article
      const { data: dbArticle, count } = await db
        .from("articles")
        .select("*", { count: "exact" })
        .eq("id", articleId)
        .single();

      if (count === 0 || !count) {
        return {
          error: { message: `Article ${articleId} to comment on not found` },
        };
      }

      // Get user
      const { data: user, error: userError } = await db
        .from("users")
        .select("userId:id, name, email, avatar")
        .eq("id", dbArticle.user_id)
        .single();

      if (userError) {
        return { error: { message: JSON.stringify(userError) } };
      }

      const incomingComment = { articleId, comment: commentData, ...user };
      const comment = Comment.create(incomingComment);

      // 'comments' table insert
      const { data: dbComment, error: commentError } = await db
        .from("comments")
        .insert(comment.toInsert())
        .select("*")
        .single();

      const commentResponse = Comment.fromDatabase(merge(comment, dbComment));

      if (commentError) {
        return { error: { message: JSON.stringify(commentError) } };
      }

      return {
        error: false,
        data: commentResponse,
      };
    } catch (error) {
      throw new Error(`Creating comment error: ${error.message}`);
    }
  }

  static async findAllByArticleId(articleId, { page = 1, limit = 5 } = {}) {
    try {
      const offset = (page - 1) * limit;

      const {
        data: dbComments,
        error: dbCommentsError,
        count,
      } = await db
        .from("comments")
        .select(
          `*,
          users!inner (
          userId:id,
          name,
          avatar,
          email)`,
          { count: "exact" },
        )
        .eq("article_id", articleId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (count === 0 || !isValid(count)) {
        return {
          error: {
            message: `Comments not found: ${JSON.stringify(dbCommentsError)}`,
          },
        };
      }

      const comments = Comment.fromDatabaseList(
        dbComments.map((comment) => ({
          ...merge(comment, User.fromDatabaseToArticle(comment.users)),
          users: undefined,
        })),
      );

      return {
        error: false,
        data: {
          comments,
          total: count,
          page,
          pages: Math.ceil(count / limit),
        },
      };
    } catch (error) {
      throw new Error(`Error retrieving comments: ${error.message}`);
    }
  }

  // Obtener comentario por ID
  static async findById(id) {
    try {
      const { data: dbComments, error: dbCommentsError } = await db
        .from("comments")
        .select(
          `*,
          user:users!inner (
          userId:id,
          name,
          avatar,
          email)
          `,
        )
        .eq("id", id)
        .single();

      if (dbCommentsError) {
        return {
          error: {
            message: JSON.stringify(dbCommentsError),
          },
        };
      }

      const user = dbComments.user;
      const comment = Comment.fromDatabase(merge(user, dbComments));

      return {
        error: false,
        data: comment,
      };
    } catch (error) {
      throw new Error(`Error retrieving comments: ${error.message}`);
    }
  }

  // Obtener comentarios de un usuario
  static async findByUserId(userId, { page, limit } = {}) {
    try {
      const offset = (page - 1) * limit;
      const {
        data: dbComments,
        error: dbCommentsError,
        count,
      } = await db
        .from("comments")
        .select(
          `*,
          user:users!inner (
          userId:id,
          name,
          avatar,
          email)
          `,
          { count: "exact" },
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (dbCommentsError) {
        return {
          error: {
            message: JSON.stringify(dbCommentsError),
          },
        };
      }

      const comments = Comment.fromDatabaseList(
        dbComments.map((comment) => merge(comment, comment.user)),
      );

      return {
        error: false,
        data: {
          comments,
          total: count,
          page,
          pages: Math.ceil(count / limit),
        },
      };
    } catch (error) {
      throw new Error(
        `Error al obtener comentarios del usuario: ${error.message}`,
      );
    }
  }

  static async update(commentId, reqUser, incomingComment) {
    try {
      // get user
      const { id: reqUserId, role: reqUserRole } = reqUser;

      const { data: dbCommentCheck, error: _dbCommentError } =
        await CommentService.findById(commentId);

      if (_dbCommentError) {
        return {
          error: {
            message: "Comment not found",
            code: 404,
          },
        };
      }

      const userId = isValid(dbCommentCheck?.userId) && dbCommentCheck.userId;
      const { category_id: articleId } = dbCommentCheck;

      if (!equal(userId, reqUserId) && reqUserRole !== "admin") {
        return {
          error: {
            message: "Unauthorized, current user isn't author",
            code: 403,
          },
        };
      }

      const { data: dbComment, error: dbCommentError } = await db
        .from("comments")
        .update({ comment: incomingComment })
        .select("*")
        .eq("id", commentId)
        .single();

      const { data: dbUser, error: dbUserError } =
        await UserService.findById(userId);

      if (dbCommentError || dbUserError) {
        return {
          error: {
            message: JSON.stringify(dbUserError),
            code: 404,
          },
        };
      }

      const user = User.fromDatabaseToArticle(dbUser);
      const merged = merge(dbComment, user, { articleId });

      const comment = Comment.fromDatabase(merged);

      return {
        error: false,
        data: comment,
      };
    } catch (error) {
      throw new Error(`Updating comment error: ${error.message}`);
    }
  }

  // Eliminar comentario
  static async delete(id) {
    try {
      const { error } = await db.from("comments").delete().eq("id", id);

      if (error) throw error;

      return true;
    } catch (error) {
      throw new Error(`Error al eliminar comentario: ${error.message}`);
    }
  }
}
