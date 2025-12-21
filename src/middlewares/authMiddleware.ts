// backend/src/middlewares/authMiddleware.js
import { AuthService } from "../services/authService.ts";
import { User } from "../models/User.ts";
import { merge } from "../utils/validator.ts";
import type { Request, Response, NextFunction } from "express";

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Token not provided",
      });
    }

    const token = authHeader.substring(7);
    const decoded = AuthService.verifyToken(token);

    const user = User.create(merge(decoded, { token }));
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
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
