import type { Request, Response, NextFunction } from "express";
import type { ErrorRequestHandler } from "express";
import { HttpStatus } from "@/utils/ControllerResponse";

// backend/src/middlewares/errorHandler.js
export const errorHandler = (
  err: Partial<Error> & { statusCode: HttpStatus },
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error("Error:", err);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Server internal error";

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
