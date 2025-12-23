import { UserService } from "../services/UserService.ts";
import { ControllerResponse, ServiceResponse } from "../utils/index.ts";
import {
  type Response,
  type Request,
  type NextFunction,
  response,
} from "express";
import { isSecurePassword, isValid, equal } from "../utils/validator.ts";

export class UserController {
  static async getAll(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const role = req.user?.role as string;

      const { data, message, success } = await UserService.findAll(
        {
          page,
          limit,
        },
        role,
      );

      if (!success) {
        const response = ControllerResponse.notFound(message);
        res.status(response.status).json(response);
        return;
      }

      const response = ControllerResponse.ok(
        data,
        "Users retrieved successfully",
      );
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
  ): Promise<void> {
    try {
      const userId = req.params.id;
      const role = req.user?.role as string;

      if (!isValid(userId, { dataType: "uuid" })) {
        const response = ControllerResponse.badRequest("User ID is invalid");
        res.status(response.status).json(response);
        return;
      }
      const { data, message, success } = await UserService.findById(
        userId,
        role,
      );

      if (!success) {
        const response = ControllerResponse.notFound(message);
        res.status(response.status).json(response);
        return;
      }

      const response = ControllerResponse.ok(
        data,
        "User retrieved successfully",
      );
      res.status(response.status).json(response);
      return;
    } catch (error) {
      next(error);
    }
  }

  static async getByEmail(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const email = req.params.email;
      const role = req.user?.role as string;
      if (!isValid(email, { dataType: "email" })) {
        const response = ControllerResponse.badRequest("User email is invalid");
        res.status(response.status).json(response);
        return;
      }
      const { data, message, success } = await UserService.findByEmail(
        email,
        role,
      );

      if (!success) {
        const response = ControllerResponse.notFound(message);
        res.status(response.status).json(response);
        return;
      }

      const response = ControllerResponse.ok(
        data,
        "User retrieved successfully",
      );
      res.status(response.status).json(response);
      return;
    } catch (error) {
      next(error);
    }
  }

  static async search(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const query = req.query.q as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!isValid(query, { dataType: "query" })) {
        const response = ControllerResponse.badRequest(
          "Search term is invalid",
        );
        res.status(response.status).json(response);
        return;
      }

      const { data, message, success } = await UserService.search(query, {
        page,
        limit,
      });

      if (!success) {
        const response = ControllerResponse.notFound(message);
        res.status(response.status).json(response);
        return;
      }

      const response = ControllerResponse.ok(
        data,
        "User retrieved successfully",
      );
      res.status(response.status).json(response);
      return;
    } catch (error) {
      next(error);
    }
  }

  static async update(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.params.id;
      const userData = req.body;
      const password = userData.password as string | undefined;
      const { errors, isValid: isPasswordValid } = isSecurePassword(password);
      const role = req.user?.role as string;
      const sessionUserId = req.user?.id as string;

      if (!isValid(userId, { dataType: "uuid" })) {
        const response = ControllerResponse.badRequest("User ID is invalid");
        res.status(response.status).json(response);
        return;
      }

      if (!equal(sessionUserId, userId) && !equal(role, "admin")) {
        const response = ControllerResponse.unauthorized();
        res.status(response.status).json(response);
        return;
      }

      if (!isPasswordValid && password) {
        const response = ControllerResponse.badRequest(errors.join(", "));
        res.status(response.status).json(response);
        return;
      }

      const { data, success, message } = await UserService.update(
        userId,
        userData,
        role
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
}
