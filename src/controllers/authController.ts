// src/controllers/authController.ts
import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../../server/db";
import { AppError } from "../middleware/errorHandler";
import { JWT_ACCESS_SECRET, JWT_REFRESH_SECRET } from "../middleware/auth";

// Helpers to sign tokens
const generateAccessToken = (user: { id: string; email: string; name: string; timezone: string }): string => {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, timezone: user.timezone },
    JWT_ACCESS_SECRET,
    { expiresIn: "15m" }
  );
};

const generateRefreshToken = (user: { id: string; email: string }): string => {
  return jwt.sign(
    { id: user.id, email: user.email },
    JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, name, timezone } = req.body;

    // Strict input validation
    if (!email || !password || !name) {
      throw new AppError("Email, password, and name are required field parameters.", 400);
    }

    if (password.length < 6) {
      throw new AppError("Password must be at least 6 characters long.", 400);
    }

    // Verify email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new AppError("Please provide a valid email address.", 400);
    }

    // Check pre-existence
    const existingUser = await db.users.findUnique({ email });
    if (existingUser) {
      throw new AppError("An account with this email already exists.", 409);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Save of User
    const newUser = await db.users.create({
      email,
      password_hash,
      name,
      timezone: timezone || "UTC",
    });

    // Create a default welcome notification
    await db.notifications.create({
      user_id: newUser.id,
      type: "welcome",
      message: `Welcome ${newUser.name}! Start defining your daily goals and build consistent habits.`,
    });

    const accessToken = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    res.status(201).json({
      success: true,
      message: "Registration successful",
      accessToken,
      refreshToken,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        timezone: newUser.timezone,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError("Both email and password fields are required.", 400);
    }

    const user = await db.users.findUnique({ email });
    if (!user) {
      throw new AppError("Invalid email or password credentials.", 401);
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new AppError("Invalid email or password credentials.", 401);
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.status(200).json({
      success: true,
      message: "Login successful",
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        timezone: user.timezone,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      throw new AppError("Refresh token is required.", 400);
    }

    try {
      const decoded = jwt.verify(refresh_token, JWT_REFRESH_SECRET) as { id: string; email: string };
      const user = await db.users.findUnique({ id: decoded.id });
      
      if (!user) {
        throw new AppError("User associated with this token does not exist.", 404);
      }

      // Generate a brand new access and optionally rotate refresh token
      const accessToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user);

      res.status(200).json({
        success: true,
        accessToken,
        refreshToken: newRefreshToken,
      });
    } catch (err: any) {
      throw new AppError("Refresh token has expired or is invalid. Please log in again.", 401);
    }
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // In stateless JWT auth, logout is primarily clean cleanup client-side.
    // We send a success acknowledgement.
    res.status(200).json({
      success: true,
      message: "Successfully logged out.",
    });
  } catch (error) {
    next(error);
  }
};
