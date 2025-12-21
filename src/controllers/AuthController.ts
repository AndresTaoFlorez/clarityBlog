// backend/src/controllers/authController.ts
import type { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/authService.ts";
import { User } from "../models/User.ts";
import { UserService } from "../services/UserService.ts";
import { ControllerResponse } from "../utils/ControllerResponse.ts";

// Extend Express Request to include user property
interface AuthRequest extends Request {
  user?: User;
}

export class AuthController {
  /**
   * Register a new user
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  static async register(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const email = req.body.email;
      const userResponse = await UserService.findByEmail(email);

      if (userResponse.success) {
        const response = ControllerResponse.conflict(
          `User already exist with email: ${email}`,
        );
        res.status(response.status).json(response);
        return;
      }

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
        token: result.token,
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
      const { data: result, error } = await AuthService.login(req.body);

      if (error) {
        return res.status(400).json({
          success: false,
          message: typeof error === "object" ? error.message : "Login failed",
        });
      }

      if (!result) {
        return res.status(500).json({
          success: false,
          message: "No data returned from login",
        });
      }

      return res.status(200).json({
        success: true,
        token: result.token,
        user: result.user,
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

      return res.status(200).json({
        success: true,
        user: req.user.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  }
}
