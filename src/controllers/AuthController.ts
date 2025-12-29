// backend/src/controllers/authController
import type { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/AuthService";
import { User } from "../models/User";
import { UserService } from "../services/UserService";
import { ControllerResponse } from "../utils/ControllerResponse";
import { equal, isSecurePassword, isValid, merge } from "../utils/validator";
import { UUID } from "node:crypto";
import { UserRoles, type UserRole } from "@/models/value-objects/UserRole";
// Extend Express Request to include user property
interface AuthRequest extends Request {
  user?: User;
  token?: string;
}

export class AuthController {
  /**
   * Register a new user
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */ static async register(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const content = isValid(req.body, { dataType: "object" }) && req.body;

      if (!content) {
        const response = ControllerResponse.badRequest("Invalid data");
        res.status(response.status).json(response);
        return;
      }

      // Register new user
      const { data, success, message } = await AuthService.register(content);

      if (!success) {
        const response = ControllerResponse.conflict(message);
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

  /**
   * Login user with credentials
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  static async login(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const { email, password } = req.body;

      if (!isValid(email, { dataType: "email" }) || !isValid(password)) {
        const response = ControllerResponse.badRequest(
          "Email or password is invalid",
        );
        res.status(response.status).json(response);
        return;
      }

      const { data, success, message } = await AuthService.login({
        email,
        password,
      });

      if (!success) {
        const response = ControllerResponse.unauthorized("Invalid credentials");
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

  /**
   * Logout user from current device (blacklist current token)
   * @param req - Express request object with token
   * @param res - Express response object
   * @param next - Express next function
   */ static async logout(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const token = req?.token as string;

      if (!isValid(token)) {
        const response = ControllerResponse.badRequest("No token provided");
        res.status(response.status).json(response);
        return;
      }

      const { message, success, data } = await AuthService.logout(token);

      if (!success) {
        const response = ControllerResponse.serverError(message);
        res.status(response.status).json(message);
        return;
      }

      const response = ControllerResponse.ok(data, message);
      res.status(response.status).json(response);
      return;
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user from all devices (invalidate all tokens)
   * @param req - Express request object with user
   * @param res - Express response object
   * @param next - Express next function
   */
  static async logoutAll(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const sessionUserId = req.user?.id as UUID;
      const userId = (req.params.userId as UUID) ?? sessionUserId;
      const role = req.user?.role as UserRole;

      if (
        !equal(userId, sessionUserId) &&
        UserRoles.hasPermission(role, "admin")
      ) {
        const response = ControllerResponse.notFound(
          "Unauthorized to logout all devices for this user",
        );
        res.status(response.status).json(response);
        return;
      }

      if (!isValid(sessionUserId)) {
        const response = ControllerResponse.unauthorized(
          "User not authenticated",
        );
        res.status(response.status).json(response);
        return;
      }

      const { data, message, success } =
        await AuthService.logoutAllDevices(userId);

      if (!success) {
        const response = ControllerResponse.serverError(message);
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

  /**
   * Verify JWT token and return user data
   */
  static async verifyToken(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const userId = req.user?.id as UUID;
      const token = req.user?.token as string;

      if (!isValid(userId)) {
        const response = ControllerResponse.unauthorized(
          "User not authenticated",
        );
        res.status(response.status).json(response);
        return;
      }

      const { data, success, message } = await UserService.findById(userId);

      if (!success) {
        const response = ControllerResponse.notFound(message);
        res.status(response.status).json(response);
        return;
      }

      const response = ControllerResponse.ok(
        merge(data, { token }),
        "Token is valid",
      );
      res.status(response.status).json(response);
      return;
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const userId = req.user?.id as UUID;

      if (!isValid(userId)) {
        const response = ControllerResponse.unauthorized(
          "User not authenticated",
        );
        res.status(response.status).json(response);
        return;
      }

      const { data, success, message } = await UserService.findById(userId);

      if (!success) {
        const response = ControllerResponse.notFound(message);
        res.status(response.status).json(response);
        return;
      }

      const transformedData = AuthService.translateToGenerateToken(data);
      const { token: newToken, expiresIn } =
        AuthService.generateToken(transformedData);

      const response = ControllerResponse.ok(
        { token: newToken, expiresIn },
        "Token refreshed successfully",
      );
      res.status(response.status).json(response);
      return;
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current authenticated user profile
   */
  static async getProfile(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const userId = req.user?.id as UUID;

      if (!isValid(userId)) {
        const response = ControllerResponse.unauthorized(
          "User not authenticated",
        );
        res.status(response.status).json(response);
        return;
      }

      const { data, success, message } = await UserService.findById(userId);

      if (!success) {
        const response = ControllerResponse.notFound(message);
        res.status(response.status).json(response);
        return;
      }

      const response = ControllerResponse.ok(
        data.toJSON(),
        "Profile retrieved successfully",
      );
      res.status(response.status).json(response);
      return;
    } catch (error) {
      next(error);
    }
  }
}
