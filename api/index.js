// src/express-app.ts
import express from "express";

// src/routes/auth.ts
import { Router } from "express";

// src/controllers/authController.ts
import bcrypt from "bcryptjs";
import jwt2 from "jsonwebtoken";

// server/db.ts
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
var connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required. Set it in your local .env file and in Vercel Environment Variables.");
}
var pool = new pg.Pool({ connectionString });
var adapter = new PrismaPg(pool);
var prisma = new PrismaClient({ adapter });
function mapUser(u) {
  if (!u) return null;
  return {
    ...u,
    created_at: u.created_at.toISOString(),
    updated_at: u.updated_at.toISOString()
  };
}
function mapGoal(g) {
  if (!g) return null;
  return {
    ...g,
    created_at: g.created_at.toISOString(),
    updated_at: g.updated_at.toISOString(),
    due_date: g.due_date ? g.due_date.toISOString() : null
  };
}
function mapGoalLog(l) {
  if (!l) return null;
  return {
    ...l,
    completed_at: l.completed_at.toISOString(),
    created_at: l.created_at.toISOString()
  };
}
function mapStreak(s) {
  if (!s) return null;
  return {
    ...s,
    last_completed_at: s.last_completed_at ? s.last_completed_at.toISOString() : null
  };
}
function mapNotification(n) {
  if (!n) return null;
  return {
    ...n,
    created_at: n.created_at.toISOString()
  };
}
function getCurrentMonthYear() {
  const now = /* @__PURE__ */ new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
function mapFreeze(f) {
  return {
    id: f.id,
    user_id: f.user_id,
    goal_id: f.goal_id,
    frozen_date: f.frozen_date,
    created_at: f.created_at.toISOString()
  };
}
var PrismaDB = class {
  constructor() {
    // Users Operations
    this.users = {
      findUnique: async (where) => {
        let user = null;
        if (where.email) {
          user = await prisma.user.findUnique({ where: { email: where.email } });
        } else if (where.id) {
          user = await prisma.user.findUnique({ where: { id: where.id } });
        }
        return mapUser(user);
      },
      findMany: async (where) => {
        let prismaWhere = {};
        if (where?.has_push_subscription) {
          prismaWhere.push_subscription = { not: null };
        }
        const list = await prisma.user.findMany({ where: prismaWhere });
        return list.map(mapUser);
      },
      create: async (data) => {
        const created = await prisma.user.create({
          data: {
            email: data.email,
            password_hash: data.password_hash,
            name: data.name,
            timezone: data.timezone || "UTC",
            onboarding_completed: false
          }
        });
        return mapUser(created);
      },
      update: async (id, updateData) => {
        const updated = await prisma.user.update({
          where: { id },
          data: updateData
        });
        return mapUser(updated);
      },
      delete: async (id) => {
        const deleted = await prisma.user.delete({
          where: { id }
        });
        return mapUser(deleted);
      }
    };
    // Goals CRUD Operations
    this.goals = {
      findMany: async (where) => {
        const prismaWhere = {};
        if (where) {
          if (where.user_id) prismaWhere.user_id = where.user_id;
          if (where.status) prismaWhere.status = where.status;
        }
        const goals = await prisma.goal.findMany({ where: prismaWhere });
        return goals.map(mapGoal);
      },
      findUnique: async (where) => {
        const goal = await prisma.goal.findUnique({ where: { id: where.id } });
        return mapGoal(goal);
      },
      create: async (data) => {
        const created = await prisma.goal.create({
          data: {
            user_id: data.user_id,
            title: data.title,
            description: data.description || null,
            category: data.category,
            target_count: data.target_count,
            frequency: data.frequency,
            due_date: data.due_date ? new Date(data.due_date) : null,
            current_count: 0,
            status: "active"
          }
        });
        return mapGoal(created);
      },
      update: async (id, updateData) => {
        const prismaUpdate = { ...updateData };
        if (updateData.due_date !== void 0) {
          prismaUpdate.due_date = updateData.due_date ? new Date(updateData.due_date) : null;
        }
        const updated = await prisma.goal.update({
          where: { id },
          data: prismaUpdate
        });
        return mapGoal(updated);
      },
      delete: async (id) => {
        const deleted = await prisma.goal.delete({ where: { id } });
        return mapGoal(deleted);
      }
    };
    // Goal Logs helpers
    this.logs = {
      findMany: async (where) => {
        const prismaWhere = {};
        if (where) {
          if (where.goal_id) prismaWhere.goal_id = where.goal_id;
          if (where.user_id) prismaWhere.user_id = where.user_id;
        }
        const logs = await prisma.goalLog.findMany({ where: prismaWhere });
        return logs.map(mapGoalLog);
      },
      findUnique: async (where) => {
        const log = await prisma.goalLog.findUnique({ where: { id: where.id } });
        return mapGoalLog(log);
      },
      create: async (data) => {
        const created = await prisma.goalLog.create({
          data: {
            id: data.id,
            goal_id: data.goal_id,
            user_id: data.user_id,
            completed_at: data.completed_at ? new Date(data.completed_at) : /* @__PURE__ */ new Date(),
            note: data.note || null
          }
        });
        return mapGoalLog(created);
      },
      delete: async (id) => {
        const deleted = await prisma.goalLog.delete({ where: { id } });
        return mapGoalLog(deleted);
      }
    };
    // Streaks helpers
    this.streaks = {
      findUnique: async (where) => {
        const streak = await prisma.streak.findFirst({ where: { goal_id: where.goal_id } });
        return mapStreak(streak);
      },
      findMany: async (where) => {
        const prismaWhere = {};
        if (where?.user_id) {
          prismaWhere.user_id = where.user_id;
        }
        const streaks = await prisma.streak.findMany({ where: prismaWhere });
        return streaks.map(mapStreak);
      },
      create: async (data) => {
        const created = await prisma.streak.create({
          data: {
            user_id: data.user_id,
            goal_id: data.goal_id,
            current_streak: 0,
            longest_streak: 0,
            last_completed_at: null
          }
        });
        return mapStreak(created);
      },
      update: async (id, updateData) => {
        const prismaUpdate = { ...updateData };
        if (updateData.last_completed_at !== void 0) {
          prismaUpdate.last_completed_at = updateData.last_completed_at ? new Date(updateData.last_completed_at) : null;
        }
        const updated = await prisma.streak.update({
          where: { id },
          data: prismaUpdate
        });
        return mapStreak(updated);
      },
      upsert: async (goal_id, user_id, updates) => {
        const existing = await prisma.streak.findFirst({ where: { goal_id } });
        if (!existing) {
          const created = await prisma.streak.create({
            data: {
              user_id,
              goal_id,
              current_streak: updates.current_streak ?? 1,
              longest_streak: updates.longest_streak ?? 1,
              last_completed_at: updates.last_completed_at ? new Date(updates.last_completed_at) : /* @__PURE__ */ new Date()
            }
          });
          return mapStreak(created);
        } else {
          const prismaUpdate = { ...updates };
          if (updates.last_completed_at !== void 0) {
            prismaUpdate.last_completed_at = updates.last_completed_at ? new Date(updates.last_completed_at) : null;
          }
          const updated = await prisma.streak.update({
            where: { id: existing.id },
            data: prismaUpdate
          });
          return mapStreak(updated);
        }
      }
    };
    this.freezeTokens = {
      findOrCreate: async (userId) => {
        const currentMonthYear = getCurrentMonthYear();
        const existing = await prisma.freezeToken.findUnique({ where: { user_id: userId } });
        if (!existing) {
          return prisma.freezeToken.create({
            data: { user_id: userId, tokens_left: 3, month_year: currentMonthYear }
          });
        }
        if (existing.month_year !== currentMonthYear) {
          return prisma.freezeToken.update({
            where: { user_id: userId },
            data: { tokens_left: 3, month_year: currentMonthYear }
          });
        }
        return existing;
      },
      update: async (userId, data) => {
        return prisma.freezeToken.update({ where: { user_id: userId }, data });
      }
    };
    this.streakFreezes = {
      findMany: async (where) => {
        const results = await prisma.streakFreeze.findMany({ where });
        return results.map(mapFreeze);
      },
      create: async (data) => {
        const created = await prisma.streakFreeze.create({ data });
        return mapFreeze(created);
      },
      findByDate: async (goalId, date) => {
        const found = await prisma.streakFreeze.findUnique({
          where: { goal_id_frozen_date: { goal_id: goalId, frozen_date: date } }
        });
        return found ? mapFreeze(found) : null;
      }
    };
    // Notifications Helpers
    this.notifications = {
      findMany: async (where) => {
        const prismaWhere = { user_id: where.user_id };
        if (where.is_read !== void 0) {
          prismaWhere.is_read = where.is_read;
        }
        const notifications = await prisma.notification.findMany({ where: prismaWhere });
        return notifications.map(mapNotification);
      },
      create: async (data) => {
        const created = await prisma.notification.create({
          data: {
            user_id: data.user_id,
            type: data.type,
            message: data.message,
            is_read: false
          }
        });
        return mapNotification(created);
      },
      markAllAsRead: async (user_id) => {
        await prisma.notification.updateMany({
          where: { user_id },
          data: { is_read: true }
        });
      }
    };
    // Habit Groups Helpers
    this.groups = {
      findMany: async (where) => {
        const prismaWhere = {};
        if (where?.creator_id) {
          prismaWhere.creator_id = where.creator_id;
        }
        const list = await prisma.habitGroup.findMany({
          where: prismaWhere,
          include: {
            creator: true,
            members: {
              include: {
                user: true
              }
            }
          }
        });
        return list;
      },
      findUnique: async (where) => {
        const group = await prisma.habitGroup.findUnique({
          where: { id: where.id },
          include: {
            creator: true,
            members: {
              include: {
                user: true
              }
            }
          }
        });
        return group;
      },
      create: async (data) => {
        const created = await prisma.habitGroup.create({
          data: {
            name: data.name,
            description: data.description || null,
            creator_id: data.creator_id,
            goal_title: data.goal_title,
            goal_category: data.goal_category,
            goal_target_count: data.goal_target_count,
            goal_frequency: data.goal_frequency
          }
        });
        return created;
      },
      delete: async (id) => {
        const deleted = await prisma.habitGroup.delete({ where: { id } });
        return deleted;
      }
    };
    // Group Memberships Helpers
    this.groupMembers = {
      findMany: async (where) => {
        const prismaWhere = {};
        if (where.group_id) prismaWhere.group_id = where.group_id;
        if (where.user_id) prismaWhere.user_id = where.user_id;
        const list = await prisma.habitGroupMember.findMany({
          where: prismaWhere,
          include: {
            user: true,
            group: true
          }
        });
        return list;
      },
      create: async (data) => {
        const created = await prisma.habitGroupMember.create({
          data: {
            group_id: data.group_id,
            user_id: data.user_id
          }
        });
        return created;
      },
      delete: async (where) => {
        const deleted = await prisma.habitGroupMember.deleteMany({
          where: {
            group_id: where.group_id,
            user_id: where.user_id
          }
        });
        return deleted;
      }
    };
  }
};
var db = new PrismaDB();

// src/middleware/errorHandler.ts
var AppError = class extends Error {
  constructor(message, statusCode = 400, errors) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
};
function getPrismaFriendlyMessage(err) {
  const msg = err?.message || "";
  const code = err?.code || "";
  if (/^P[125]\d{3}$/.test(code)) {
    if (code.startsWith("P1")) {
      return "Unable to reach the database server. Please check your connection and try again later.";
    }
    if (code.startsWith("P2")) {
      return "A database operation failed. The record may not exist or a constraint was violated.";
    }
    return "Database error occurred. Please try again later.";
  }
  if (msg.includes("prisma.") || msg.includes("Can't reach database server") || msg.includes("Connection refused") || msg.includes("ECONNREFUSED") || msg.includes("Invalid `prisma.") || msg.includes("PrismaClientKnownRequestError") || msg.includes("PrismaClientUnknownRequestError") || msg.includes("PrismaClientInitializationError") || msg.includes("PrismaClientRustPanicError") || msg.includes("pooler.supabase.com") || msg.includes("supabase.com") || msg.includes("D:\\Download\\") || // Local file path leak guard
  msg.includes("server/db.ts")) {
    if (msg.includes("Can't reach") || msg.includes("ECONNREFUSED") || msg.includes("Connection refused")) {
      return "Unable to reach the database server. Please check your network connection and try again.";
    }
    return "A database error occurred. Please try again later.";
  }
  return null;
}
var errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.error(`[Error] ${req.method} ${req.url} - Status: ${statusCode}`, err.message);
  const prismaMessage = getPrismaFriendlyMessage(err);
  if (prismaMessage) {
    res.status(503).json({
      success: false,
      message: prismaMessage,
      errors: null
    });
    return;
  }
  const message = err.message || "Internal Server Error";
  const safeMessage = statusCode >= 500 ? "Internal server error. Please try again later." : message;
  res.status(statusCode).json({
    success: false,
    message: safeMessage,
    errors: err.errors || null
  });
};

// src/middleware/auth.ts
import jwt from "jsonwebtoken";
var JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "daily-goal-tracker-access-secret-key-13579";
var JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "daily-goal-tracker-refresh-secret-key-24680";
var authMiddleware = (req, res, next) => {
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
      const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
      req.user = decoded;
      next();
    } catch (jwtErr) {
      if (jwtErr.name === "TokenExpiredError") {
        throw new AppError("Access token expired. Please refresh your session.", 401);
      }
      throw new AppError("Invalid or corrupted access token. Please log in again.", 401);
    }
  } catch (error) {
    next(error);
  }
};

// src/controllers/authController.ts
var generateAccessToken = (user) => {
  return jwt2.sign(
    { id: user.id, email: user.email, name: user.name, timezone: user.timezone },
    JWT_ACCESS_SECRET,
    { expiresIn: "15m" }
  );
};
var generateRefreshToken = (user) => {
  return jwt2.sign(
    { id: user.id, email: user.email },
    JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );
};
var register = async (req, res, next) => {
  try {
    const { email, password, name, timezone } = req.body;
    if (!email || !password || !name) {
      throw new AppError("Email, password, and name are required field parameters.", 400);
    }
    if (password.length < 6) {
      throw new AppError("Password must be at least 6 characters long.", 400);
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new AppError("Please provide a valid email address.", 400);
    }
    const existingUser = await db.users.findUnique({ email });
    if (existingUser) {
      throw new AppError("An account with this email already exists.", 409);
    }
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const newUser = await db.users.create({
      email,
      password_hash,
      name,
      timezone: timezone || "UTC"
    });
    await db.notifications.create({
      user_id: newUser.id,
      type: "welcome",
      message: `Welcome ${newUser.name}! Start defining your daily goals and build consistent habits.`
    });
    const accessToken = generateAccessToken(newUser);
    const refreshToken2 = generateRefreshToken(newUser);
    res.status(201).json({
      success: true,
      message: "Registration successful",
      accessToken,
      refreshToken: refreshToken2,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        timezone: newUser.timezone,
        created_at: newUser.created_at,
        onboarding_completed: newUser.onboarding_completed
      }
    });
  } catch (error) {
    next(error);
  }
};
var login = async (req, res, next) => {
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
    const refreshToken2 = generateRefreshToken(user);
    res.status(200).json({
      success: true,
      message: "Login successful",
      accessToken,
      refreshToken: refreshToken2,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        timezone: user.timezone,
        created_at: user.created_at,
        onboarding_completed: user.onboarding_completed
      }
    });
  } catch (error) {
    next(error);
  }
};
var refreshToken = async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      throw new AppError("Refresh token is required.", 400);
    }
    try {
      const decoded = jwt2.verify(refresh_token, JWT_REFRESH_SECRET);
      const user = await db.users.findUnique({ id: decoded.id });
      if (!user) {
        throw new AppError("User associated with this token does not exist.", 404);
      }
      const accessToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user);
      res.status(200).json({
        success: true,
        accessToken,
        refreshToken: newRefreshToken
      });
    } catch (err) {
      throw new AppError("Refresh token has expired or is invalid. Please log in again.", 401);
    }
  } catch (error) {
    next(error);
  }
};
var logout = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: "Successfully logged out."
    });
  } catch (error) {
    next(error);
  }
};
var updateProfile = async (req, res, next) => {
  try {
    const authReq = req;
    if (!authReq.user) {
      throw new AppError("Unauthenticated request", 401);
    }
    const { name, email, timezone, onboarding_completed } = req.body;
    const userId = authReq.user.id;
    if (onboarding_completed !== void 0) {
      const updatedUser2 = await db.users.update(userId, {
        onboarding_completed: !!onboarding_completed
      });
      const accessToken2 = generateAccessToken(updatedUser2);
      res.status(200).json({
        success: true,
        message: "Profile updated successfully.",
        user: {
          id: updatedUser2.id,
          email: updatedUser2.email,
          name: updatedUser2.name,
          timezone: updatedUser2.timezone,
          created_at: updatedUser2.created_at,
          onboarding_completed: updatedUser2.onboarding_completed
        },
        accessToken: accessToken2
      });
      return;
    }
    if (!name || !email) {
      throw new AppError("Name and email are required.", 400);
    }
    if (email !== authReq.user.email) {
      const existingUser = await db.users.findUnique({ email });
      if (existingUser) {
        throw new AppError("An account with this email already exists.", 409);
      }
    }
    const updatedUser = await db.users.update(userId, {
      name,
      email,
      timezone: timezone || authReq.user.timezone
    });
    const accessToken = generateAccessToken(updatedUser);
    res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        timezone: updatedUser.timezone,
        created_at: updatedUser.created_at,
        onboarding_completed: updatedUser.onboarding_completed
      },
      accessToken
    });
  } catch (error) {
    next(error);
  }
};
var deleteAccount = async (req, res, next) => {
  try {
    const authReq = req;
    if (!authReq.user) {
      throw new AppError("Unauthenticated request", 401);
    }
    const userId = authReq.user.id;
    await db.users.delete(userId);
    res.status(200).json({
      success: true,
      message: "Account deleted successfully."
    });
  } catch (error) {
    next(error);
  }
};
var updatePushSubscription = async (req, res, next) => {
  try {
    const authReq = req;
    if (!authReq.user) {
      throw new AppError("Unauthenticated request", 401);
    }
    const userId = authReq.user.id;
    const { push_subscription } = req.body;
    const subscriptionString = push_subscription ? JSON.stringify(push_subscription) : null;
    await db.users.update(userId, {
      push_subscription: subscriptionString
    });
    res.status(200).json({
      success: true,
      message: push_subscription ? "Push subscription registered." : "Push subscription removed."
    });
  } catch (error) {
    next(error);
  }
};
var getVapidPublicKey = async (req, res, next) => {
  try {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    if (!publicKey) {
      throw new AppError("VAPID keys not configured on server.", 500);
    }
    res.status(200).json({
      success: true,
      publicKey
    });
  } catch (error) {
    next(error);
  }
};

// src/routes/auth.ts
var router = Router();
router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refreshToken);
router.post("/logout", logout);
router.put("/profile", authMiddleware, updateProfile);
router.delete("/profile", authMiddleware, deleteAccount);
router.put("/push-subscription", authMiddleware, updatePushSubscription);
router.get("/vapid-public-key", getVapidPublicKey);
var auth_default = router;

// src/routes/goals.ts
import { Router as Router2 } from "express";

// src/controllers/goalController.ts
var getLocalDateParts = (date, timezone) => {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    const parts = formatter.formatToParts(date);
    const year = parseInt(parts.find((p) => p.type === "year").value, 10);
    const month = parseInt(parts.find((p) => p.type === "month").value, 10) - 1;
    const day = parseInt(parts.find((p) => p.type === "day").value, 10);
    return { year, month, day };
  } catch (e) {
    return {
      year: date.getUTCFullYear(),
      month: date.getUTCMonth(),
      day: date.getUTCDate()
    };
  }
};
var getCalendarDaysDiffTimezone = (dateStr1, dateStr2, timezone) => {
  const hasTimeComponent1 = dateStr1.includes("T") || dateStr1.includes(" ");
  const hasTimeComponent2 = dateStr2.includes("T") || dateStr2.includes(" ");
  const localDateStr1 = hasTimeComponent1 ? getLocalDateString(new Date(dateStr1), timezone) : dateStr1;
  const localDateStr2 = hasTimeComponent2 ? getLocalDateString(new Date(dateStr2), timezone) : dateStr2;
  const [y1, m1, d1] = localDateStr1.split("-").map(Number);
  const [y2, m2, d2] = localDateStr2.split("-").map(Number);
  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);
  const msPerDay = 1e3 * 60 * 60 * 24;
  return Math.floor((utc2 - utc1) / msPerDay);
};
var isSameLocalWeek = (d1, d2, timezone) => {
  const p1 = getLocalDateParts(d1, timezone);
  const p2 = getLocalDateParts(d2, timezone);
  const date1 = new Date(p1.year, p1.month, p1.day);
  const date2 = new Date(p2.year, p2.month, p2.day);
  const getMondayOfDate = (d) => {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.getFullYear(), d.getMonth(), diff);
  };
  const monday1 = getMondayOfDate(date1);
  const monday2 = getMondayOfDate(date2);
  return monday1.getFullYear() === monday2.getFullYear() && monday1.getMonth() === monday2.getMonth() && monday1.getDate() === monday2.getDate();
};
var isSameLocalMonth = (d1, d2, timezone) => {
  const p1 = getLocalDateParts(d1, timezone);
  const p2 = getLocalDateParts(d2, timezone);
  return p1.year === p2.year && p1.month === p2.month;
};
var syncAndResetGoalProgress = async (goal, timezone) => {
  const logs = await db.logs.findMany({ goal_id: goal.id });
  const now = /* @__PURE__ */ new Date();
  const currentCycleLogs = logs.filter((log) => {
    const logDate = new Date(log.completed_at);
    if (goal.frequency === "weekly") {
      return isSameLocalWeek(logDate, now, timezone);
    } else if (goal.frequency === "monthly") {
      return isSameLocalMonth(logDate, now, timezone);
    } else {
      const p1 = getLocalDateParts(logDate, timezone);
      const p2 = getLocalDateParts(now, timezone);
      return p1.year === p2.year && p1.month === p2.month && p1.day === p2.day;
    }
  });
  const correctCount = currentCycleLogs.length;
  const isCompleted = correctCount >= goal.target_count;
  const correctStatus = isCompleted ? "completed" : "active";
  if (goal.current_count !== correctCount || goal.status !== correctStatus) {
    const updated = await db.goals.update(goal.id, {
      current_count: correctCount,
      status: correctStatus
    });
    return updated;
  }
  return goal;
};
var getGoals = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized access.", 401);
    const user = await db.users.findUnique({ id: userId });
    const timezone = user?.timezone || "UTC";
    const goals = await db.goals.findMany({ user_id: userId });
    const goalsWithStreaks = await Promise.all(
      goals.map(async (goal) => {
        const syncedGoal = await syncAndResetGoalProgress(goal, timezone);
        const streak = await db.streaks.findUnique({ goal_id: goal.id });
        return {
          ...syncedGoal,
          streak: streak || { current_streak: 0, longest_streak: 0, last_completed_at: null }
        };
      })
    );
    res.status(200).json({
      success: true,
      goals: goalsWithStreaks
    });
  } catch (error) {
    next(error);
  }
};
var createGoal = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized access.", 401);
    const { title, description, category, target_count, frequency, due_date } = req.body;
    if (!title || !category) {
      throw new AppError("Goal title and category fields are required properties.", 400);
    }
    const goalTarget = target_count ? parseInt(target_count, 10) : 1;
    if (isNaN(goalTarget) || goalTarget <= 0) {
      throw new AppError("Target count must be a positive integer greater than zero.", 400);
    }
    const newGoal = await db.goals.create({
      user_id: userId,
      title,
      description: description || null,
      category,
      target_count: goalTarget,
      frequency: frequency || "daily",
      due_date: due_date || null
    });
    const newStreak = await db.streaks.create({
      user_id: userId,
      goal_id: newGoal.id
    });
    res.status(201).json({
      success: true,
      goal: {
        ...newGoal,
        streak: newStreak
      }
    });
  } catch (error) {
    next(error);
  }
};
var getGoalById = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) throw new AppError("Unauthorized access.", 401);
    const goal = await db.goals.findUnique({ id });
    if (!goal || goal.user_id !== userId) {
      throw new AppError("Goal not found or access denied.", 404);
    }
    const user = await db.users.findUnique({ id: userId });
    const timezone = user?.timezone || "UTC";
    const syncedGoal = await syncAndResetGoalProgress(goal, timezone);
    const streak = await db.streaks.findUnique({ goal_id: syncedGoal.id });
    const logs = await db.logs.findMany({ goal_id: syncedGoal.id });
    res.status(200).json({
      success: true,
      goal: {
        ...syncedGoal,
        streak: streak || { current_streak: 0, longest_streak: 0, last_completed_at: null },
        logs
      }
    });
  } catch (error) {
    next(error);
  }
};
var updateGoal = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) throw new AppError("Unauthorized access.", 401);
    const goal = await db.goals.findUnique({ id });
    if (!goal || goal.user_id !== userId) {
      throw new AppError("Goal not found or access denied.", 404);
    }
    const { title, description, category, target_count, current_count, frequency, status, due_date } = req.body;
    const updates = {};
    if (title !== void 0) updates.title = title;
    if (description !== void 0) updates.description = description;
    if (category !== void 0) updates.category = category;
    if (frequency !== void 0) updates.frequency = frequency;
    if (status !== void 0) updates.status = status;
    if (due_date !== void 0) updates.due_date = due_date;
    if (target_count !== void 0) {
      const parsed = parseInt(target_count, 10);
      if (isNaN(parsed) || parsed <= 0) throw new AppError("Target count must be a positive number.", 400);
      updates.target_count = parsed;
    }
    if (current_count !== void 0) {
      const parsed = parseInt(current_count, 10);
      if (isNaN(parsed) || parsed < 0) throw new AppError("Current progress cannot be negative.", 400);
      updates.current_count = parsed;
    }
    const updatedGoal = await db.goals.update(id, updates);
    const user = await db.users.findUnique({ id: userId });
    const timezone = user?.timezone || "UTC";
    const syncedGoal = await syncAndResetGoalProgress(updatedGoal, timezone);
    const streak = await db.streaks.findUnique({ goal_id: goal.id });
    res.status(200).json({
      success: true,
      goal: {
        ...syncedGoal,
        streak: streak || { current_streak: 0, longest_streak: 0, last_completed_at: null }
      }
    });
  } catch (error) {
    next(error);
  }
};
var deleteGoal = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) throw new AppError("Unauthorized access.", 401);
    const goal = await db.goals.findUnique({ id });
    if (!goal || goal.user_id !== userId) {
      throw new AppError("Goal not found or access denied.", 404);
    }
    await db.goals.delete(id);
    res.status(200).json({
      success: true,
      message: "Goal successfully deleted."
    });
  } catch (error) {
    next(error);
  }
};
var completeGoal = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { note, completed_at, log_id } = req.body;
    if (!userId) throw new AppError("Unauthorized access.", 401);
    const goal = await db.goals.findUnique({ id });
    if (!goal || goal.user_id !== userId) {
      throw new AppError("Goal not found.", 404);
    }
    const user = await db.users.findUnique({ id: userId });
    const timezone = user?.timezone || "UTC";
    const syncedGoal = await syncAndResetGoalProgress(goal, timezone);
    if (log_id) {
      const existingLog = await db.logs.findUnique({ id: log_id });
      if (existingLog) {
        console.log(`[Goal Controller] Duplicate check-in detected for log_id: ${log_id}. Returning existing log.`);
        const currentStreak = await db.streaks.findUnique({ goal_id: syncedGoal.id });
        res.status(200).json({
          success: true,
          message: "Progress already logged.",
          goal: {
            ...syncedGoal,
            streak: currentStreak || { current_streak: 0, longest_streak: 0, last_completed_at: null }
          },
          log: existingLog
        });
        return;
      }
    }
    const todayStr = completed_at || (/* @__PURE__ */ new Date()).toISOString();
    const newLog = await db.logs.create({
      id: log_id || void 0,
      goal_id: syncedGoal.id,
      user_id: userId,
      completed_at: todayStr,
      note: note || null
    });
    const updatedCount = syncedGoal.current_count + 1;
    const totalTarget = syncedGoal.target_count;
    let isFullyCompletedToday = updatedCount >= totalTarget;
    const updatedGoal = await db.goals.update(syncedGoal.id, {
      current_count: updatedCount,
      status: isFullyCompletedToday ? "completed" : "active"
    });
    let streak = await db.streaks.findUnique({ goal_id: syncedGoal.id });
    if (!streak) {
      streak = await db.streaks.create({ user_id: userId, goal_id: syncedGoal.id });
    }
    let isStreakUpdated = false;
    let newCurrentStreak = streak.current_streak;
    let newLongestStreak = streak.longest_streak;
    if (isFullyCompletedToday) {
      if (!streak.last_completed_at) {
        newCurrentStreak = 1;
        newLongestStreak = 1;
        isStreakUpdated = true;
      } else {
        const daysDiff = getCalendarDaysDiffTimezone(streak.last_completed_at, todayStr, timezone);
        if (daysDiff === 1) {
          newCurrentStreak = streak.current_streak + 1;
          newLongestStreak = Math.max(newLongestStreak, newCurrentStreak);
          isStreakUpdated = true;
        } else if (daysDiff > 1) {
          const missingDates = [];
          const baseDate = new Date(streak.last_completed_at);
          for (let d = 1; d < daysDiff; d++) {
            const missing = new Date(baseDate);
            missing.setDate(missing.getDate() + d);
            missingDates.push(getLocalDateString(missing, timezone));
          }
          if (missingDates.length > 0) {
            const freezes = await db.streakFreezes.findMany({ goal_id: syncedGoal.id });
            const frozenSet = new Set(freezes.map((f) => f.frozen_date));
            const allFrozen = missingDates.every((date) => frozenSet.has(date));
            if (allFrozen) {
              newCurrentStreak = streak.current_streak + missingDates.length + 1;
              newLongestStreak = Math.max(newLongestStreak, newCurrentStreak);
              isStreakUpdated = true;
            } else {
              newCurrentStreak = 1;
              isStreakUpdated = true;
            }
          } else {
            newCurrentStreak = 1;
            isStreakUpdated = true;
          }
        } else if (daysDiff <= 0) {
          isStreakUpdated = false;
        }
      }
    }
    const updatedStreak = await db.streaks.upsert(syncedGoal.id, userId, {
      current_streak: newCurrentStreak,
      longest_streak: newLongestStreak,
      last_completed_at: isFullyCompletedToday ? todayStr : streak.last_completed_at
    });
    if (isStreakUpdated && newCurrentStreak > 0) {
      const milestoneStreaks = [3, 7, 14, 30, 100];
      if (milestoneStreaks.includes(newCurrentStreak)) {
        await db.notifications.create({
          user_id: userId,
          type: "milestone",
          message: `\u{1F525} Amazing! You've reached a ${newCurrentStreak}-day streak for goal: "${syncedGoal.title}"! Keep it up!`
        });
      }
    }
    res.status(200).json({
      success: true,
      message: isFullyCompletedToday ? "Goal target reached today!" : "Progress logged successfully.",
      goal: {
        ...updatedGoal,
        streak: updatedStreak
      },
      log: newLog
    });
  } catch (error) {
    next(error);
  }
};
var getLocalDateString = (date, timezone) => {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    const parts = formatter.formatToParts(date);
    const year = parts.find((p) => p.type === "year")?.value;
    const month = parts.find((p) => p.type === "month")?.value;
    const day = parts.find((p) => p.type === "day")?.value;
    return `${year}-${month}-${day}`;
  } catch (e) {
    return date.toISOString().split("T")[0];
  }
};
var recalculateStreak = async (goalId, userId) => {
  const goal = await db.goals.findUnique({ id: goalId });
  if (!goal) return null;
  const user = await db.users.findUnique({ id: userId });
  const timezone = user?.timezone || "UTC";
  const logs = await db.logs.findMany({ goal_id: goalId });
  const logsByDate = {};
  for (const log of logs) {
    const dateStr = getLocalDateString(new Date(log.completed_at), timezone);
    logsByDate[dateStr] = (logsByDate[dateStr] || 0) + 1;
  }
  const completedDates = Object.keys(logsByDate).filter((dateStr) => logsByDate[dateStr] >= goal.target_count).sort();
  let longestStreak = 0;
  let currentStreakSegment = 0;
  let prevDateStr = null;
  for (const dateStr of completedDates) {
    if (prevDateStr === null) {
      currentStreakSegment = 1;
    } else {
      const diff = getCalendarDaysDiffTimezone(prevDateStr, dateStr, timezone);
      if (diff === 1) {
        currentStreakSegment += 1;
      } else if (diff > 1) {
        currentStreakSegment = 1;
      }
    }
    longestStreak = Math.max(longestStreak, currentStreakSegment);
    prevDateStr = dateStr;
  }
  let currentStreak = 0;
  let lastCompletedAtStr = null;
  if (completedDates.length > 0) {
    const lastCompletedDateStr = completedDates[completedDates.length - 1];
    lastCompletedAtStr = lastCompletedDateStr;
    const todayLocalStr = getLocalDateString(/* @__PURE__ */ new Date(), timezone);
    const diff = getCalendarDaysDiffTimezone(lastCompletedDateStr, todayLocalStr, timezone);
    if (diff <= 1) {
      currentStreak = currentStreakSegment;
    } else {
      currentStreak = 0;
    }
  }
  const lastCompletedAtDate = lastCompletedAtStr ? new Date(lastCompletedAtStr).toISOString() : null;
  const updatedStreak = await db.streaks.upsert(goalId, userId, {
    current_streak: currentStreak,
    longest_streak: longestStreak,
    last_completed_at: lastCompletedAtDate
  });
  return updatedStreak;
};
var deleteLog = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { logId } = req.params;
    if (!userId) throw new AppError("Unauthorized access.", 401);
    const log = await db.logs.findUnique({ id: logId });
    if (!log || log.user_id !== userId) {
      throw new AppError("Log not found or access denied.", 404);
    }
    const goal = await db.goals.findUnique({ id: log.goal_id });
    if (!goal || goal.user_id !== userId) {
      throw new AppError("Goal not found.", 404);
    }
    await db.logs.delete(logId);
    const updatedCount = Math.max(0, goal.current_count - 1);
    const totalTarget = goal.target_count;
    const isCompleted = updatedCount >= totalTarget;
    const updatedGoal = await db.goals.update(goal.id, {
      current_count: updatedCount,
      status: isCompleted ? "completed" : "active"
    });
    const user = await db.users.findUnique({ id: userId });
    const timezone = user?.timezone || "UTC";
    const syncedGoal = await syncAndResetGoalProgress(updatedGoal, timezone);
    const updatedStreak = await recalculateStreak(goal.id, userId);
    res.status(200).json({
      success: true,
      message: "Progress log deleted and goal progress updated.",
      goal: {
        ...syncedGoal,
        streak: updatedStreak || { current_streak: 0, longest_streak: 0, last_completed_at: null }
      }
    });
  } catch (error) {
    next(error);
  }
};

// src/routes/goals.ts
var router2 = Router2();
router2.use(authMiddleware);
router2.get("/", getGoals);
router2.post("/", createGoal);
router2.get("/:id", getGoalById);
router2.put("/:id", updateGoal);
router2.delete("/:id", deleteGoal);
router2.post("/:id/complete", completeGoal);
router2.delete("/logs/:logId", deleteLog);
var goals_default = router2;

// src/routes/stats.ts
import { Router as Router3 } from "express";

// src/controllers/statsController.ts
function getLogDedupeKey(log) {
  return [
    log.goal_id,
    log.completed_at,
    (log.note || "").trim()
  ].join("|");
}
var getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized access.", 401);
    const user = await db.users.findUnique({ id: userId });
    const timezone = user?.timezone || "UTC";
    const rawGoals = await db.goals.findMany({ user_id: userId });
    const goals = await Promise.all(
      rawGoals.map((goal) => syncAndResetGoalProgress(goal, timezone))
    );
    const streaks = await db.streaks.findMany({ user_id: userId });
    const totalGoals = goals.length;
    const activeGoals = goals.filter((g) => g.status !== "paused").length;
    const completedGoalsToday = goals.filter((g) => g.current_count >= g.target_count).length;
    let overallCompletionRate = 0;
    const activeGoalsList = goals.filter((g) => g.status !== "paused");
    if (activeGoalsList.length > 0) {
      const totalProgress = activeGoalsList.reduce((acc, g) => acc + g.current_count, 0);
      const totalTargets = activeGoalsList.reduce((acc, g) => acc + g.target_count, 0);
      overallCompletionRate = totalTargets > 0 ? Math.round(totalProgress / totalTargets * 100) : 0;
    }
    const bestCurrentStreak = streaks.length > 0 ? Math.max(...streaks.map((s) => s.current_streak)) : 0;
    const bestLongestStreak = streaks.length > 0 ? Math.max(...streaks.map((s) => s.longest_streak)) : 0;
    res.status(200).json({
      success: true,
      stats: {
        totalGoals,
        activeGoals,
        completedGoalsToday,
        overallCompletionRate,
        bestCurrentStreak,
        bestLongestStreak
      }
    });
  } catch (error) {
    next(error);
  }
};
var getHistory = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized access.", 401);
    const { from, to } = req.query;
    const fromDate = from ? new Date(from) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1e3);
    const toDate = to ? new Date(to) : /* @__PURE__ */ new Date();
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);
    const logs = await db.logs.findMany({ user_id: userId });
    const filteredLogs = logs.filter((log) => {
      const logDate = new Date(log.completed_at);
      return logDate >= fromDate && logDate <= toDate;
    });
    const seenLogIds = /* @__PURE__ */ new Set();
    const seenLogKeys = /* @__PURE__ */ new Set();
    const uniqueLogs = filteredLogs.filter((log) => {
      const key = getLogDedupeKey(log);
      if (seenLogIds.has(log.id) || seenLogKeys.has(key)) {
        return false;
      }
      seenLogIds.add(log.id);
      seenLogKeys.add(key);
      return true;
    });
    const historyMap = {};
    const loopDate = new Date(fromDate);
    while (loopDate <= toDate) {
      const dayStr = loopDate.toISOString().split("T")[0];
      historyMap[dayStr] = [];
      loopDate.setDate(loopDate.getDate() + 1);
    }
    uniqueLogs.forEach((log) => {
      const dayKey = log.completed_at.split("T")[0];
      if (historyMap[dayKey]) {
        historyMap[dayKey].push(log);
      } else {
        historyMap[dayKey] = [log];
      }
    });
    const historyList = Object.keys(historyMap).sort().map((dateStr) => {
      return {
        date: dateStr,
        count: historyMap[dateStr].length,
        logs: historyMap[dateStr]
      };
    });
    res.status(200).json({
      success: true,
      history: historyList
    });
  } catch (error) {
    next(error);
  }
};

// src/routes/stats.ts
var router3 = Router3();
router3.use(authMiddleware);
router3.get("/dashboard", getDashboardStats);
router3.get("/history", getHistory);
var stats_default = router3;

// src/routes/groups.ts
import { Router as Router4 } from "express";

// src/controllers/groupController.ts
var getGroups = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized access.", 401);
    const groups = await db.groups.findMany();
    const formattedGroups = groups.map((group) => ({
      id: group.id,
      name: group.name,
      description: group.description,
      creator_id: group.creator_id,
      goal_title: group.goal_title,
      goal_category: group.goal_category,
      goal_target_count: group.goal_target_count,
      goal_frequency: group.goal_frequency,
      created_at: group.created_at,
      memberCount: group.members.length,
      isJoined: group.members.some((m) => m.user_id === userId)
    }));
    res.status(200).json({
      success: true,
      groups: formattedGroups
    });
  } catch (error) {
    next(error);
  }
};
var createGroup = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized access.", 401);
    const { name, description, goal_title, goal_category, goal_target_count, goal_frequency } = req.body;
    if (!name || !goal_title || !goal_category) {
      throw new AppError("Group name, goal title, and category are required.", 400);
    }
    const targetCount = goal_target_count ? parseInt(goal_target_count, 10) : 1;
    if (isNaN(targetCount) || targetCount <= 0) {
      throw new AppError("Target count must be a positive integer.", 400);
    }
    const group = await db.groups.create({
      name,
      description: description || null,
      creator_id: userId,
      goal_title,
      goal_category,
      goal_target_count: targetCount,
      goal_frequency: goal_frequency || "daily"
    });
    await db.groupMembers.create({
      group_id: group.id,
      user_id: userId
    });
    const goal = await db.goals.create({
      user_id: userId,
      title: goal_title,
      description: description ? `Group Habit: ${description}` : `Habit Group Goal: ${name}`,
      category: goal_category,
      target_count: targetCount,
      frequency: goal_frequency || "daily",
      due_date: null
    });
    await db.goals.update(goal.id, { group_id: group.id });
    await db.streaks.create({
      user_id: userId,
      goal_id: goal.id
    });
    res.status(201).json({
      success: true,
      group
    });
  } catch (error) {
    next(error);
  }
};
var getGroupById = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) throw new AppError("Unauthorized access.", 401);
    const group = await db.groups.findUnique({ id });
    if (!group) {
      throw new AppError("Group not found.", 404);
    }
    const goals = await db.goals.findMany();
    const groupGoals = goals.filter((g) => g.group_id === group.id);
    const membersProgress = await Promise.all(
      group.members.map(async (m) => {
        const memberUser = m.user;
        const memberGoal = groupGoals.find((g) => g.user_id === memberUser.id);
        let current_count = 0;
        let target_count = group.goal_target_count;
        let streak = { current_streak: 0, longest_streak: 0 };
        let status = "active";
        if (memberGoal) {
          const syncedGoal = await syncAndResetGoalProgress(memberGoal, memberUser.timezone || "UTC");
          current_count = syncedGoal.current_count;
          target_count = syncedGoal.target_count;
          status = syncedGoal.status;
          const memberStreak = await db.streaks.findUnique({ goal_id: syncedGoal.id });
          if (memberStreak) {
            streak = {
              current_streak: memberStreak.current_streak,
              longest_streak: memberStreak.longest_streak
            };
          }
        }
        return {
          user_id: memberUser.id,
          name: memberUser.name,
          email: memberUser.email,
          current_count,
          target_count,
          streak,
          status
        };
      })
    );
    const isJoined = group.members.some((m) => m.user_id === userId);
    res.status(200).json({
      success: true,
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        creator_id: group.creator_id,
        creator_name: group.creator.name,
        goal_title: group.goal_title,
        goal_category: group.goal_category,
        goal_target_count: group.goal_target_count,
        goal_frequency: group.goal_frequency,
        created_at: group.created_at,
        isJoined,
        members: membersProgress
      }
    });
  } catch (error) {
    next(error);
  }
};
var joinGroup = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) throw new AppError("Unauthorized access.", 401);
    const group = await db.groups.findUnique({ id });
    if (!group) {
      throw new AppError("Group not found.", 404);
    }
    const isMember = group.members.some((m) => m.user_id === userId);
    if (isMember) {
      throw new AppError("You are already a member of this group.", 400);
    }
    await db.groupMembers.create({
      group_id: group.id,
      user_id: userId
    });
    const goal = await db.goals.create({
      user_id: userId,
      title: group.goal_title,
      description: group.description ? `Group Habit: ${group.description}` : `Habit Group Goal: ${group.name}`,
      category: group.goal_category,
      target_count: group.goal_target_count,
      frequency: group.goal_frequency,
      due_date: null
    });
    await db.goals.update(goal.id, { group_id: group.id });
    await db.streaks.create({
      user_id: userId,
      goal_id: goal.id
    });
    res.status(200).json({
      success: true,
      message: "Successfully joined the habit group."
    });
  } catch (error) {
    next(error);
  }
};
var leaveGroup = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) throw new AppError("Unauthorized access.", 401);
    const group = await db.groups.findUnique({ id });
    if (!group) {
      throw new AppError("Group not found.", 404);
    }
    const isMember = group.members.some((m) => m.user_id === userId);
    if (!isMember) {
      throw new AppError("You are not a member of this group.", 400);
    }
    await db.groupMembers.delete({
      group_id: group.id,
      user_id: userId
    });
    const goals = await db.goals.findMany();
    const groupGoal = goals.find((g) => g.group_id === group.id && g.user_id === userId);
    if (groupGoal) {
      await db.goals.delete(groupGoal.id);
    }
    res.status(200).json({
      success: true,
      message: "Successfully left the habit group."
    });
  } catch (error) {
    next(error);
  }
};
var deleteGroup = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) throw new AppError("Unauthorized access.", 401);
    const group = await db.groups.findUnique({ id });
    if (!group) {
      throw new AppError("Group not found.", 404);
    }
    if (group.creator_id !== userId) {
      throw new AppError("Only the group creator can delete this group.", 403);
    }
    await db.groups.delete(id);
    res.status(200).json({
      success: true,
      message: "Group successfully deleted."
    });
  } catch (error) {
    next(error);
  }
};

// src/routes/groups.ts
var router4 = Router4();
router4.use(authMiddleware);
router4.get("/", getGroups);
router4.post("/", createGroup);
router4.get("/:id", getGroupById);
router4.post("/:id/join", joinGroup);
router4.post("/:id/leave", leaveGroup);
router4.delete("/:id", deleteGroup);
var groups_default = router4;

// src/routes/ai.ts
import { Router as Router5 } from "express";

// src/controllers/aiController.ts
import { GoogleGenAI } from "@google/genai";
var MODEL = "gemini-2.0-flash";
var AI_TIMEOUT_MS = 14e3;
var systemPrompt = [
  "B\u1EA1n l\xE0 AI Habit Coach th\xE2n thi\u1EC7n, h\u1ED7 tr\u1EE3 ng\u01B0\u1EDDi d\xF9ng theo d\xF5i th\xF3i quen v\xE0 m\u1EE5c ti\xEAu c\xE1 nh\xE2n.",
  "Ph\u1EA3n h\u1ED3i b\u1EB1ng ti\u1EBFng Vi\u1EC7t, ng\u1EAFn g\u1ECDn, t\xEDch c\u1EF1c v\xE0 th\u1EF1c t\u1EBF.",
  "Kh\xF4ng h\u1ECFi th\xF4ng tin c\xE1 nh\xE2n nh\u01B0 email hay m\u1EADt kh\u1EA9u.",
  "Ch\u1EC9 d\u1EF1a tr\xEAn d\u1EEF li\u1EC7u th\xF3i quen \u0111\u01B0\u1EE3c cung c\u1EA5p trong context."
].join("\n");
function getAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}
function withTimeout(promise, timeoutMs = AI_TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error("AI_TIMEOUT")), timeoutMs);
    })
  ]);
}
function extractJson(text) {
  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return JSON.parse(cleaned.slice(start, end + 1));
  }
  return JSON.parse(cleaned);
}
function buildStats(goals) {
  const activeGoals = goals.filter((g) => g.status !== "paused");
  const totalTargets = activeGoals.reduce((sum, goal) => sum + goal.target_count, 0);
  const totalProgress = activeGoals.reduce((sum, goal) => sum + Math.min(goal.current_count, goal.target_count), 0);
  return {
    totalGoals: goals.length,
    activeGoals: activeGoals.length,
    completedGoalsToday: goals.filter((g) => g.current_count >= g.target_count).length,
    overallCompletionRate: totalTargets > 0 ? Math.round(totalProgress / totalTargets * 100) : 0,
    bestCurrentStreak: goals.length ? Math.max(...goals.map((g) => g.current_streak)) : 0,
    bestLongestStreak: goals.length ? Math.max(...goals.map((g) => g.longest_streak)) : 0
  };
}
async function buildCoachContext(userId) {
  const user = await db.users.findUnique({ id: userId });
  const timezone = user?.timezone || "UTC";
  const rawGoals = await db.goals.findMany({ user_id: userId });
  const goals = await Promise.all(
    rawGoals.map(async (goal) => {
      const syncedGoal = await syncAndResetGoalProgress(goal, timezone);
      const streak = await db.streaks.findUnique({ goal_id: goal.id });
      return {
        title: syncedGoal.title,
        category: syncedGoal.category,
        frequency: syncedGoal.frequency,
        status: syncedGoal.status,
        current_count: syncedGoal.current_count,
        target_count: syncedGoal.target_count,
        current_streak: streak?.current_streak || 0,
        longest_streak: streak?.longest_streak || 0
      };
    })
  );
  return {
    timezone,
    today: (/* @__PURE__ */ new Date()).toLocaleDateString("en-CA", { timeZone: timezone }),
    goals,
    stats: buildStats(goals)
  };
}
function buildContextString(context) {
  return JSON.stringify(
    {
      today: context.today,
      timezone: context.timezone,
      completionRate: context.stats.overallCompletionRate,
      bestCurrentStreak: context.stats.bestCurrentStreak,
      goals: context.goals
    },
    null,
    2
  );
}
function fallbackReport(context) {
  const ranked = [...context.goals].map((goal) => ({
    ...goal,
    completionRate: goal.target_count > 0 ? Math.round(Math.min(goal.current_count, goal.target_count) / goal.target_count * 100) : 0
  }));
  const strongHabits = [...ranked].sort((a, b) => b.completionRate - a.completionRate || b.current_streak - a.current_streak).slice(0, 3).map((goal) => ({
    title: goal.title,
    completionRate: goal.completionRate,
    currentStreak: goal.current_streak
  }));
  const weakHabits = [...ranked].sort((a, b) => a.completionRate - b.completionRate || b.current_streak - a.current_streak).slice(0, 3).map((goal) => ({
    title: goal.title,
    completionRate: goal.completionRate,
    daysMissed: goal.completionRate >= 100 ? 0 : 1
  }));
  const weakest = weakHabits[0];
  const strongest = strongHabits[0];
  return {
    weeklyCompletionRate: context.stats.overallCompletionRate,
    strongHabits,
    weakHabits,
    suggestions: [
      weakest ? `H\xE3y \u01B0u ti\xEAn ho\xE0n th\xE0nh "${weakest.title}" h\xF4m nay v\xEC ti\u1EBFn \u0111\u1ED9 hi\u1EC7n t\u1EA1i m\u1EDBi \u0111\u1EA1t ${weakest.completionRate}%.` : "H\xE3y t\u1EA1o m\u1ED9t th\xF3i quen nh\u1ECF c\xF3 th\u1EC3 ho\xE0n th\xE0nh trong 5 ph\xFAt \u0111\u1EC3 b\u1EAFt \u0111\u1EA7u \u0111\u1EC1u \u0111\u1EB7n h\u01A1n.",
      strongest ? `Gi\u1EEF nh\u1ECBp cho "${strongest.title}" v\xEC streak hi\u1EC7n t\u1EA1i \u0111ang l\xE0 ${strongest.currentStreak} ng\xE0y.` : "\u0110\u1EB7t m\u1ED9t khung gi\u1EDD c\u1ED1 \u0111\u1ECBnh m\u1ED7i ng\xE0y \u0111\u1EC3 check-in d\u1EC5 h\u01A1n."
    ],
    motivationalMessage: "B\u1EA1n \u0111ang x\xE2y nh\u1ECBp ti\u1EBFn b\u1ED9 t\u1EEBng ng\xE0y. H\xE3y ch\u1ECDn m\u1ED9t h\xE0nh \u0111\u1ED9ng nh\u1ECF v\xE0 l\xE0m ngay h\xF4m nay."
  };
}
async function callGemini(prompt, responseMimeType) {
  const ai = getAIClient();
  if (!ai) return null;
  const response = await withTimeout(
    ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        temperature: 0.4,
        responseMimeType
      }
    })
  );
  return response.text || "";
}
var getAIReport = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized access.", 401);
    const context = await buildCoachContext(userId);
    const fallback = fallbackReport(context);
    const prompt = [
      systemPrompt,
      "D\u01B0\u1EDBi \u0111\xE2y l\xE0 context th\xF3i quen \u0111\xE3 \u0111\u01B0\u1EE3c l\u1ECDc, kh\xF4ng ch\u1EE9a email/id/token:",
      buildContextString(context),
      "H\xE3y tr\u1EA3 v\u1EC1 JSON thu\u1EA7n, kh\xF4ng markdown, theo schema:",
      JSON.stringify(fallback),
      "Y\xEAu c\u1EA7u suggestions c\xF3 \xEDt nh\u1EA5t 2 h\xE0nh \u0111\u1ED9ng c\u1EE5 th\u1EC3 d\u1EF1a tr\xEAn d\u1EEF li\u1EC7u."
    ].join("\n\n");
    try {
      const text = await callGemini(prompt, "application/json");
      const report = text ? extractJson(text) : fallback;
      if (!Array.isArray(report.suggestions) || report.suggestions.length < 2) {
        report.suggestions = fallback.suggestions;
      }
      res.status(200).json({ success: true, report });
    } catch (error) {
      console.warn("AI report fallback used:", error);
      res.status(200).json({ success: true, report: fallback });
    }
  } catch (error) {
    next(error);
  }
};
var postAIChat = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized access.", 401);
    const message = String(req.body?.message || "").trim();
    if (!message) throw new AppError("Message is required.", 400);
    const context = await buildCoachContext(userId);
    const prompt = [
      systemPrompt,
      "Context th\xF3i quen \u0111\xE3 \u0111\u01B0\u1EE3c l\u1ECDc, kh\xF4ng ch\u1EE9a email/id/token:",
      buildContextString(context),
      `C\xE2u h\u1ECFi c\u1EE7a ng\u01B0\u1EDDi d\xF9ng: ${message}`,
      "Tr\u1EA3 l\u1EDDi t\u1ED1i \u0111a 4 c\xE2u, \u01B0u ti\xEAn l\u1EDDi khuy\xEAn h\xE0nh \u0111\u1ED9ng c\u1EE5 th\u1EC3."
    ].join("\n\n");
    try {
      const reply = await callGemini(prompt);
      res.status(200).json({
        success: true,
        reply: reply || "M\xECnh \u0111\xE3 xem d\u1EEF li\u1EC7u c\u1EE7a b\u1EA1n. H\xE3y ch\u1ECDn m\u1ED9t th\xF3i quen quan tr\u1ECDng nh\u1EA5t v\xE0 ho\xE0n th\xE0nh n\xF3 tr\u01B0\u1EDBc h\xF4m nay nh\xE9."
      });
    } catch (error) {
      console.warn("AI chat fallback used:", error);
      res.status(200).json({
        success: true,
        reply: "M\xECnh \u0111ang g\u1EB7p ch\xFAt kh\xF3 kh\u0103n khi k\u1EBFt n\u1ED1i AI. Tr\u01B0\u1EDBc m\u1EAFt, h\xE3y ch\u1ECDn th\xF3i quen c\xF3 streak cao nh\u1EA5t v\xE0 ho\xE0n th\xE0nh n\xF3 \u0111\u1EC3 gi\u1EEF \u0111\xE0 nh\xE9."
      });
    }
  } catch (error) {
    next(error);
  }
};

// src/routes/ai.ts
var router5 = Router5();
router5.use(authMiddleware);
router5.post("/report", getAIReport);
router5.post("/chat", postAIChat);
var ai_default = router5;

// src/routes/freeze.ts
import { Router as Router6 } from "express";

// src/controllers/freezeController.ts
function getLocalDateString2(date, timezone) {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    const parts = formatter.formatToParts(date);
    const y = parts.find((p) => p.type === "year")?.value;
    const m = parts.find((p) => p.type === "month")?.value;
    const d = parts.find((p) => p.type === "day")?.value;
    return `${y}-${m}-${d}`;
  } catch {
    return date.toISOString().split("T")[0];
  }
}
var getFreezeTokens = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized.", 401);
    const record = await db.freezeTokens.findOrCreate(userId);
    res.json({ success: true, tokens_left: record.tokens_left, month_year: record.month_year });
  } catch (err) {
    next(err);
  }
};
var activateFreeze = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized.", 401);
    const { goal_id } = req.body;
    if (!goal_id) throw new AppError("goal_id is required.", 400);
    const goals = await db.goals.findMany({ user_id: userId });
    const goal = goals.find((g) => g.id === goal_id);
    if (!goal) throw new AppError("Goal not found.", 404);
    const tokenRecord = await db.freezeTokens.findOrCreate(userId);
    if (tokenRecord.tokens_left <= 0) {
      throw new AppError("You have used all 3 Freeze Tokens this month. Tokens reset on the 1st of next month.", 400);
    }
    const user = await db.users.findUnique({ id: userId });
    const timezone = user?.timezone || "UTC";
    const todayStr = getLocalDateString2(/* @__PURE__ */ new Date(), timezone);
    const existing = await db.streakFreezes.findByDate(goal_id, todayStr);
    if (existing) throw new AppError("This goal is already frozen for today.", 400);
    if (goal.current_count >= goal.target_count) {
      throw new AppError("This goal is already completed today, so a Freeze Token is not needed.", 400);
    }
    await db.streakFreezes.create({ user_id: userId, goal_id, frozen_date: todayStr });
    await db.freezeTokens.update(userId, { tokens_left: tokenRecord.tokens_left - 1 });
    res.json({ success: true, tokens_left: tokenRecord.tokens_left - 1, frozen_date: todayStr });
  } catch (err) {
    next(err);
  }
};
var getFreezeDates = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized.", 401);
    const { goal_id, all } = req.query;
    if (all !== "true" && !goal_id) throw new AppError("goal_id is required unless all=true.", 400);
    const where = all === "true" ? { user_id: userId } : { goal_id };
    const freezes = await db.streakFreezes.findMany(where);
    res.json({ success: true, frozen_dates: freezes.map((f) => f.frozen_date) });
  } catch (err) {
    next(err);
  }
};

// src/routes/freeze.ts
var router6 = Router6();
router6.use(authMiddleware);
router6.get("/tokens", getFreezeTokens);
router6.post("/activate", activateFreeze);
router6.get("/dates", getFreezeDates);
var freeze_default = router6;

// src/express-app.ts
var app = express();
app.use(express.json());
app.use("/api/auth", auth_default);
app.use("/api/goals", goals_default);
app.use("/api/stats", stats_default);
app.use("/api/groups", groups_default);
app.use("/api/ai", ai_default);
app.use("/api/freeze", freeze_default);
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    message: "Daily Goal Tracker custom server running successfully.",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.post("/api/seed", async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: "userId is required to seed goals." });
    }
    const currentGoals = await db.goals.findMany({ user_id: userId });
    if (currentGoals.length === 0) {
      const g1 = await db.goals.create({
        user_id: userId,
        title: "Read a Tech Book",
        description: "Read 15 pages of structural architecture",
        category: "Learning",
        target_count: 1,
        frequency: "daily",
        due_date: null
      });
      await db.streaks.create({ user_id: userId, goal_id: g1.id });
      const g2 = await db.goals.create({
        user_id: userId,
        title: "Morning Plank exercise",
        description: "Hold standard plank for 3 minutes",
        category: "Fitness",
        target_count: 2,
        // 2 sessions of plank
        frequency: "daily",
        due_date: null
      });
      await db.streaks.create({ user_id: userId, goal_id: g2.id });
      const g3 = await db.goals.create({
        user_id: userId,
        title: "Drink Water 2L",
        description: "Stay hydrated by drinking at least 8 cups",
        category: "Health",
        target_count: 1,
        frequency: "daily",
        due_date: null
      });
      await db.streaks.create({ user_id: userId, goal_id: g3.id });
      return res.json({ success: true, seeded: true, message: "Successfully seeded initial wellness goals." });
    }
    res.json({ success: true, seeded: false, message: "Goals already initialized." });
  } catch (error) {
    next(error);
  }
});
app.use(errorHandler);
var express_app_default = app;

// server/api-entry.ts
var api_entry_default = express_app_default;
export {
  api_entry_default as default
};
