// backend/src/middlewares/authMiddleware.ts
import { AuthService } from "../services/AuthService";
import { UserService } from "../services/UserService";
import { User } from "../models/User";
import { merge } from "../utils/validator";
import { TokenBlacklist } from "../services/redis-client";
import type { Request, Response, NextFunction } from "express";
import { UUID } from "node:crypto";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // 1. Extract token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Token not provided",
      });
    }

    const token = authHeader.substring(7);

    // 2. Check if token is blacklisted (recent logout)
    const isBlacklisted = await TokenBlacklist.isBlacklisted(token);
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        message: "Token has been revoked",
      });
    }

    // 3. Verify token signature and expiration
    const decoded = AuthService.verifyToken(token);

    // 4. Fetch user and verify token version
    const userResponse = await UserService.findById(decoded.id as UUID);

    if (!userResponse.success) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    const dbUser = userResponse.data;

    // 5. Check if token version matches
    if (dbUser.tokenVersion !== decoded.tokenVersion) {
      return res.status(401).json({
        success: false,
        message: "Token has been invalidated. Please login again.",
      });
    }

    // 6. Attach user to request
    const user = User.create(
      merge(decoded, { token, tokenVersion: dbUser.tokenVersion }),
    );
    req.user = user;

    next();
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      message: error.message || "Invalid or expired token",
    });
  }
};

export const authorizeAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Administrator permissions are required.",
    });
  }
  next();
};
