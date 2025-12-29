import { ControllerResponse } from "@/utils";
import { CommentService } from "../services/CommentService";
import { isValid } from "../utils/validator";
import { Request, Response, NextFunction } from "express";
import { User } from "@/models/User";
import { UserRole, UserRoles } from "@/models/value-objects/UserRole";
import { UUID } from "crypto";

export class CommentController {
  static async create(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const articleId = req.params?.articleId as UUID;
      const role = req.user?.role;
      const comment = req.body?.comment;

      if (!isValid(articleId) || !isValid(role)) {
        const response = isValid(articleId, { dataType: "uuid" })
          ? ControllerResponse.unauthorized()
          : ControllerResponse.badRequest("Article Id is required");
        res.status(response.status).json(response);
        return;
      }

      if (!isValid(comment)) {
        const response = ControllerResponse.badRequest(
          "Comment content is invalid",
        );
        res.status(response.status).json(response);
        return;
      }

      const { data, success, message } = await CommentService.create(
        articleId,
        comment,
      );

      if (!success) {
        const response = ControllerResponse.notFound(message);
        res.status(response.status).json(response);
        return;
      }

      const response = ControllerResponse.ok(data, message);
      res.status(response.status).json(response);
      return;
    } catch (error) {
      next(error);
    }
  }

  static async getCommentsByArticleId(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 5;
      const articleId = req.params?.articleId as UUID;

      if (!isValid(articleId)) {
        const response = ControllerResponse.badRequest("Article ID is invalid");
        res.status(response.status).json(response);
        return;
      }

      const { data, success, message } =
        await CommentService.findAllByArticleId(articleId, {
          page,
          limit,
        });

      if (!success) {
        const response = ControllerResponse.notFound(message);
        res.status(response.status).json(response);
        return;
      }

      const response = ControllerResponse.ok(data, message);
      res.status(response.status).json(response);
      return;
    } catch (error) {
      next(error);
    }
  }

  static async getById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const commentId = req.params?.commentId as UUID;

      if (!isValid(commentId, { dataType: "uuid" })) {
        const response = ControllerResponse.badRequest("Comment ID is invalid");
        return res.status(response.status).json(response);
      }

      const { data, success, message } =
        await CommentService.findById(commentId);

      if (!success) {
        const response = ControllerResponse.notFound(message);
        res.status(response.status).json(response);
        return;
      }

      const response = ControllerResponse.ok(data, message);
      res.status(response.status).json(response);
      return;
    } catch (error) {
      next(error);
    }
  }

  static async getByUserId(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 5;
      const userId = req.params?.userId as UUID;

      if (!isValid(userId, { dataType: "uuid" })) {
        const response = ControllerResponse.badRequest("User ID is invalid");
        res.status(response.status).json(response);
        return;
      }

      const { data, success, message } = await CommentService.findByUserId(
        userId,
        {
          page,
          limit,
        },
      );

      if (!success) {
        const response = ControllerResponse.notFound(message);
        res.status(response.status).json(response);
        return;
      }

      const response = ControllerResponse.ok(data, message);
      res.status(response.status).json(response);
      return;
    } catch (error) {
      next(error);
    }
  }

  static async updateCommentByArticleId(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const commentId = req.params?.commentId as UUID;
      const comment = req.body;
      const user = req.user as User;

      if (!isValid(commentId, { dataType: "uuid" }) || !isValid(comment)) {
        const response = ControllerResponse.badRequest(
          isValid(comment) ? "Comment ID is required" : "Comment is invalid",
        );
        res.status(response.status).json(response);
        return;
      }

      const { data, success, message } = await CommentService.update(
        commentId,
        user,
        comment,
      );

      if (!success) {
        const response = ControllerResponse.notFound(message);
        return res.status(response.status).json(response);
      }

      const response = ControllerResponse.ok(data, message);
      res.status(response.status).json(response);
      return;
    } catch (error) {
      next(error);
    }
  }

  static async delete(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const commentId = req.params?.commentId as UUID;

      if (!isValid(commentId, { dataType: "uuid" })) {
        const response = ControllerResponse.badRequest("Invalid Comment ID");
        res.status(response.status).json(response);
        return;
      }

      const {
        data: commentData,
        message: commentMessage,
        success: commentSuccess,
      } = await CommentService.findById(commentId);

      if (!commentSuccess) {
        const response = ControllerResponse.notFound(commentMessage);
        res.status(response.status).json(response);
        return;
      }

      const userId = commentData.userId;

      if (userId !== req.user!.id && req.user!.role !== "admin") {
        const response = ControllerResponse.unauthorized();
        res.status(response.status).json(response);
        return;
      }

      const { data, success, message } = await CommentService.delete(commentId);

      if (!success) {
        const response = ControllerResponse.notFound(message);
        res.status(response.status).json(response);
        return;
      }

      const response = ControllerResponse.ok(data, message);
      res.status(response.status).json(response);
      return;
    } catch (error) {
      next(error);
    }
  }
}
