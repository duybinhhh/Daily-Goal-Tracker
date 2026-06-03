// src/middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "./errorHandler";

export const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "daily-goal-tracker-access-secret-key-13579";
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "daily-goal-tracker-refresh-secret-key-24680";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    timezone: string;
  };
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("Authorization token missing or invalid format. Please log in.", 401);
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      throw new AppError("Access token not found in credentials.", 401);
    }

    try {
      const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as {
        id: string;
        email: string;
        name: string;
        timezone: string;
      };
      
      req.user = decoded;
      next();
    } catch (jwtErr: any) {
      if (jwtErr.name === "TokenExpiredError") {
        throw new AppError("Access token expired. Please refresh your session.", 401);
      }
      throw new AppError("Invalid or corrupted access token. Please log in again.", 401);
    }
  } catch (error) {
    next(error);
  }
};
