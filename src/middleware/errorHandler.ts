// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  public statusCode: number;
  public errors?: any;

  constructor(message: string, statusCode: number = 400, errors?: any) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Detect if an error is a Prisma/database connection or query error.
 * Returns a user-friendly message if so, or null if not a Prisma error.
 */
function getPrismaFriendlyMessage(err: any): string | null {
  const msg: string = err?.message || "";
  const code: string = err?.code || "";

  // Prisma client known error codes
  // P1xxx = connection errors, P2xxx = query errors, P5xxx = data proxy
  if (/^P[125]\d{3}$/.test(code)) {
    if (code.startsWith("P1")) {
      return "Unable to reach the database server. Please check your connection and try again later.";
    }
    if (code.startsWith("P2")) {
      return "A database operation failed. The record may not exist or a constraint was violated.";
    }
    return "Database error occurred. Please try again later.";
  }

  // Detect Prisma error message patterns even without a code
  if (
    msg.includes("prisma.") ||
    msg.includes("Can't reach database server") ||
    msg.includes("Connection refused") ||
    msg.includes("ECONNREFUSED") ||
    msg.includes("Invalid `prisma.") ||
    msg.includes("PrismaClientKnownRequestError") ||
    msg.includes("PrismaClientUnknownRequestError") ||
    msg.includes("PrismaClientInitializationError") ||
    msg.includes("PrismaClientRustPanicError") ||
    msg.includes("pooler.supabase.com") ||
    msg.includes("supabase.com") ||
    msg.includes("D:\\Download\\") ||  // Local file path leak guard
    msg.includes("server/db.ts")
  ) {
    if (msg.includes("Can't reach") || msg.includes("ECONNREFUSED") || msg.includes("Connection refused")) {
      return "Unable to reach the database server. Please check your network connection and try again.";
    }
    return "A database error occurred. Please try again later.";
  }

  return null;
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;

  // Log the real error internally for debugging
  console.error(`[Error] ${req.method} ${req.url} - Status: ${statusCode}`, err.message);

  // Check for Prisma/DB errors and sanitize
  const prismaMessage = getPrismaFriendlyMessage(err);
  if (prismaMessage) {
    res.status(503).json({
      success: false,
      message: prismaMessage,
      errors: null,
    });
    return;
  }

  // For known AppErrors (4xx) pass through message as-is (auth, validation errors)
  const message = err.message || "Internal Server Error";
  const safeMessage = statusCode >= 500 ? "Internal server error. Please try again later." : message;

  res.status(statusCode).json({
    success: false,
    message: safeMessage,
    errors: err.errors || null,
  });
};

