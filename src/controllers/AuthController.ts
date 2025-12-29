// backend/src/controllers/authController.ts
import type { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/AuthService.ts";
import { User } from "../models/User.ts";
import { UserService } from "../services/UserService.ts";
import { ControllerResponse } from "../utils/ControllerResponse.ts";
import { equal, merge } from "../utils/validator.ts";

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
      const email = req.body.email;

      // Check if user already exists
      const userResponse = await UserService.findByEmail(email);
      if (userResponse.success) {
        const response = ControllerResponse.conflict(
          `User already exists with email: ${email}`,
        );
        return res.status(response.status).json(response);
      }

      // Register new user
      const { data: result, error } = await AuthService.register(req.body);

      if (error) {
        return res.status(409).json({
          success: false,
          message:
            typeof error === "object" ? error.message : "Registration failed",
        });
      }

      if (!result) {
        return res.status(500).json({
          success: false,
          message: "No data returned from registration",
        });
      }

      return res.status(201).json({
        success: true,
        message: "User registered successfully",
        token: result.token,
        expiresIn: result.expiresIn,
        user: result.user,
      });
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
      const { data, error } = await AuthService.login({ email, password });

      if (error) {
        return res.status(401).json({
          success: false,
          message:
            typeof error === "object" ? error.message : "Invalid credentials",
        });
      }

      if (!data) {
        return res.status(500).json({
          success: false,
          message: "No data returned from login",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Login successful",
        token: data.token,
        expiresIn: data.expiresIn,
        user: data.user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user from current device (blacklist current token)
   * @param req - Express request object with token
   * @param res - Express response object
   * @param next - Express next function
   */
  static async logout(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      if (!req.token) {
        return res.status(401).json({
          success: false,
          message: "No token provided",
        });
      }

      const result = await AuthService.logout(req.token);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: result.message,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
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
      const sessionUserId = req.user?.id as string;
      const userId = req.params.userId ?? sessionUserId;
      const role = req.user?.role as string;

      if (!equal(userId, sessionUserId) && !equal(role, "admin")) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized to logout all devices for this user",
        });
      }

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const result = await AuthService.logoutAllDevices(userId);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: result.message,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Logged out from all devices successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify JWT token and return user data
   * @param req - Express request object with user attached
   * @param res - Express response object
   * @param next - Express next function
   */
  static async verifyToken(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const userId = req.user.id as string;
      const token = req.user.token as string;
      const { data: userFinded } = await UserService.findById(userId);
      const data = userFinded;
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
   * Refresh access token (optional - for implementing refresh tokens)
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  static async refreshToken(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      // Generate new token with current user data
      const transformedData = AuthService.translateToGenerateToken(req.user);
      const newToken = AuthService.generateToken(transformedData);

      return res.status(200).json({
        success: true,
        message: "Token refreshed successfully",
        token: newToken,
        expiresIn: "15m",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current authenticated user profile
   * @param req - Express request object with user
   * @param res - Express response object
   * @param next - Express next function
   */
  static async getProfile(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      return res.status(200).json({
        success: true,
        user: req.user.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  }
}
