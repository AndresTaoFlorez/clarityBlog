// /backend/src/services/commentService.ts
import { db } from "../config/database";
import { Comment } from "../models/Comment";
import { User } from "../models/User";
import { equal, isValid, merge } from "../utils/validator";
import { UserService } from "./UserService";
import { ServiceResponse } from "../utils/index";
import { UUID } from "node:crypto";

interface PaginationParams {
  page?: number;
  limit?: number;
}

interface PaginatedComments {
  comments: Comment[];
  total: number;
  page: number;
  pages: number;
}

export class CommentService {
  // Create comment
  static async create(
    articleId: UUID,
    commentData: string,
  ): Promise<ServiceResponse<Comment>> {
    try {
      // Get article
      const { data: dbArticle, count } = await db
        .from("articles")
        .select("*", { count: "exact" })
        .eq("id", articleId)
        .single();

      if (count === 0 || !count) {
        return ServiceResponse.error(
          {} as Comment,
          `Article ${articleId} to comment on not found`,
        );
      }

      // Get user
      const { data: user, error: userError } = await db
        .from("users")
        .select("userId:id, name, email, avatar")
        .eq("id", dbArticle.user_id)
        .single();

      if (userError) {
        return ServiceResponse.error(
          {} as Comment,
          `User error: ${userError.message}`,
        );
      }

      const incomingComment = {
        articleId,
        comment: commentData,
        ...user,
      };
      const comment = Comment.create(incomingComment);

      // Insert into comments table
      const { data: dbComment, error: commentError } = await db
        .from("comments")
        .insert(comment.toInsert())
        .select("*")
        .single();

      if (commentError) {
        return ServiceResponse.error(
          {} as Comment,
          `Comment creation failed: ${commentError.message}`,
        );
      }

      const commentResponse = Comment.fromDatabase(merge(comment, dbComment));

      return ServiceResponse.ok(
        commentResponse,
        "Comment created successfully",
      );
    } catch (error) {
      return ServiceResponse.error(
        {} as Comment,
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while creating comment",
      );
    }
  }

  static async findAllByArticleId(
    articleId: UUID,
    { page = 1, limit = 5 }: PaginationParams = {},
  ): Promise<ServiceResponse<PaginatedComments>> {
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
            email
          )`,
          { count: "exact" },
        )
        .eq("article_id", articleId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      const isData = !isValid(count) || count === 0;

      if (dbCommentsError || isData) {
        return ServiceResponse.error(
          {} as PaginatedComments,
          isData
            ? "Comments not found"
            : `Failed to fetch comments: ${dbCommentsError?.message}`,
        );
      }

      const comments = Comment.fromDatabaseList(
        (dbComments || []).map((comment: any) => ({
          ...merge(comment, User.fromDatabaseList(comment.users)),
          users: undefined,
        })),
      );

      const paginatedResult: PaginatedComments = {
        comments,
        total: count || 0,
        page,
        pages: Math.ceil((count || 0) / limit),
      };

      return ServiceResponse.ok(
        paginatedResult,
        "Comments retrieved successfully",
      );
    } catch (error) {
      return ServiceResponse.error(
        {} as PaginatedComments,
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while retrieving comments",
      );
    }
  }

  // Get comment by ID
  static async findById(id: UUID): Promise<ServiceResponse<Comment>> {
    try {
      const { data: dbComments, error: dbCommentsError } = await db
        .from("comments")
        .select(
          `*,
          user:users!inner (
            userId:id,
            name,
            avatar,
            email
          )`,
        )
        .eq("id", id)
        .single();

      if (dbCommentsError) {
        return ServiceResponse.error(
          {} as Comment,
          `Comment not found: ${dbCommentsError.message}`,
        );
      }

      const user = dbComments.user as User;
      const comment = Comment.fromDatabase(merge(user, dbComments));

      return ServiceResponse.ok(comment, "Comment retrieved successfully");
    } catch (error) {
      return ServiceResponse.error(
        {} as Comment,
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while retrieving comment",
      );
    }
  }

  // Get comments by user ID
  static async findByUserId(
    userId: UUID,
    { page = 1, limit = 5 }: PaginationParams = {},
  ): Promise<ServiceResponse<PaginatedComments>> {
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
            email
          )`,
          { count: "exact" },
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (dbCommentsError) {
        return ServiceResponse.error(
          {} as PaginatedComments,
          `Failed to fetch user comments: ${dbCommentsError.message}`,
        );
      }

      const comments = Comment.fromDatabaseList(
        (dbComments || []).map((comment: any) => merge(comment, comment.user)),
      );

      const paginatedResult: PaginatedComments = {
        comments,
        total: count || 0,
        page,
        pages: Math.ceil((count || 0) / limit),
      };

      return ServiceResponse.ok(
        paginatedResult,
        "User comments retrieved successfully",
      );
    } catch (error) {
      return ServiceResponse.error(
        {} as PaginatedComments,
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while fetching user comments",
      );
    }
  }

  static async update(
    commentId: UUID,
    reqUser: User,
    incomingComment: string,
  ): Promise<ServiceResponse<Comment>> {
    try {
      const { id: reqUserId, role: reqUserRole } = reqUser;

      const { data: dbCommentCheck, success: _dbCommentError } =
        await CommentService.findById(commentId);

      if (!_dbCommentError) {
        return ServiceResponse.error({} as Comment, "Comment not found", {
          code: 404,
        });
      }

      const userId = dbCommentCheck.userId as UUID;
      const articleId = dbCommentCheck?.articleId;

      if (!equal(userId, reqUserId as UUID) && reqUserRole !== "admin") {
        return ServiceResponse.error(
          {} as Comment,
          "Unauthorized, current user isn't author",
        );
      }

      const { data: dbComment, error: dbCommentError } = await db
        .from("comments")
        .update({ comment: incomingComment })
        .select("*")
        .eq("id", commentId)
        .single();

      if (dbCommentError) {
        return ServiceResponse.error(
          {} as Comment,
          `Failed to update comment: ${dbCommentError.message}`,
        );
      }

      const { data: dbUser, success: dbUserError } =
        await UserService.findById(userId);

      if (!dbUserError) {
        return ServiceResponse.error(
          {} as Comment,
          `User not found: ${dbUserError}`,
        );
      }

      const user = User.fromDatabase(dbUser);
      const merged = merge(dbComment, user, { articleId });

      const comment = Comment.fromDatabase(merged);

      return ServiceResponse.ok(comment, "Comment updated successfully");
    } catch (error) {
      return ServiceResponse.error(
        {} as Comment,
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while updating comment",
      );
    }
  }

  // Delete comment
  static async delete(id: UUID): Promise<ServiceResponse<Comment>> {
    try {
      const { data, error } = await db
        .from("comments")
        .delete()
        .select("*")
        .eq("id", id);

      if (error || !data) {
        return ServiceResponse.error(
          {} as Comment,
          `Failed to delete comment: ${error.message}`,
        );
      }

      const comment = Comment.fromDatabase(data);
      return ServiceResponse.ok(comment, "Comment deleted successfully");
    } catch (error) {
      return ServiceResponse.error(
        {} as Comment,
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while deleting comment",
      );
    }
  }
}
