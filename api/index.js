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
      create: async (data) => {
        const created = await prisma.user.create({
          data: {
            email: data.email,
            password_hash: data.password_hash,
            name: data.name,
            timezone: data.timezone || "UTC"
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
var errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  console.error(`[Error] ${req.method} ${req.url} - Status: ${statusCode} - Message: ${message}`, err.stack);
  res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || null,
    stack: process.env.NODE_ENV === "development" ? err.stack : void 0
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
        timezone: newUser.timezone
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
        timezone: user.timezone
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
    const { name, email, timezone } = req.body;
    const userId = authReq.user.id;
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
        timezone: updatedUser.timezone
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

// src/routes/auth.ts
var router = Router();
router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refreshToken);
router.post("/logout", logout);
router.put("/profile", authMiddleware, updateProfile);
router.delete("/profile", authMiddleware, deleteAccount);
var auth_default = router;

// src/routes/goals.ts
import { Router as Router2 } from "express";

// src/controllers/goalController.ts
var getCalendarDaysDiff = (dateStr1, dateStr2) => {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
  const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
  const msPerDay = 1e3 * 60 * 60 * 24;
  return Math.floor((utc2 - utc1) / msPerDay);
};
var getGoals = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized access.", 401);
    const goals = await db.goals.findMany({ user_id: userId });
    const goalsWithStreaks = await Promise.all(
      goals.map(async (goal) => {
        const streak = await db.streaks.findUnique({ goal_id: goal.id });
        return {
          ...goal,
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
    const streak = await db.streaks.findUnique({ goal_id: goal.id });
    const logs = await db.logs.findMany({ goal_id: goal.id });
    res.status(200).json({
      success: true,
      goal: {
        ...goal,
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
    const streak = await db.streaks.findUnique({ goal_id: goal.id });
    res.status(200).json({
      success: true,
      goal: {
        ...updatedGoal,
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
    const { note } = req.body;
    if (!userId) throw new AppError("Unauthorized access.", 401);
    const goal = await db.goals.findUnique({ id });
    if (!goal || goal.user_id !== userId) {
      throw new AppError("Goal not found.", 404);
    }
    const todayStr = (/* @__PURE__ */ new Date()).toISOString();
    const newLog = await db.logs.create({
      goal_id: goal.id,
      user_id: userId,
      completed_at: todayStr,
      note: note || null
    });
    const updatedCount = goal.current_count + 1;
    const totalTarget = goal.target_count;
    let isFullyCompletedToday = updatedCount >= totalTarget;
    const updatedGoal = await db.goals.update(goal.id, {
      current_count: updatedCount,
      status: isFullyCompletedToday ? "completed" : "active"
    });
    let streak = await db.streaks.findUnique({ goal_id: goal.id });
    if (!streak) {
      streak = await db.streaks.create({ user_id: userId, goal_id: goal.id });
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
        const daysDiff = getCalendarDaysDiff(streak.last_completed_at, todayStr);
        if (daysDiff === 1) {
          newCurrentStreak = streak.current_streak + 1;
          newLongestStreak = Math.max(newLongestStreak, newCurrentStreak);
          isStreakUpdated = true;
        } else if (daysDiff > 1) {
          newCurrentStreak = 1;
          isStreakUpdated = true;
        } else if (daysDiff <= 0) {
          isStreakUpdated = false;
        }
      }
    }
    const updatedStreak = await db.streaks.upsert(goal.id, userId, {
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
          message: `\u{1F525} Amazing! You've reached a ${newCurrentStreak}-day streak for goal: "${goal.title}"! Keep it up!`
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
      const diff = getCalendarDaysDiff(prevDateStr, dateStr);
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
    const diff = getCalendarDaysDiff(lastCompletedDateStr, todayLocalStr);
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
    const updatedStreak = await recalculateStreak(goal.id, userId);
    res.status(200).json({
      success: true,
      message: "Progress log deleted and goal progress updated.",
      goal: {
        ...updatedGoal,
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
var getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized access.", 401);
    const goals = await db.goals.findMany({ user_id: userId });
    const streaks = await db.streaks.findMany({ user_id: userId });
    const totalGoals = goals.length;
    const activeGoals = goals.filter((g) => g.status === "active").length;
    const completedGoalsToday = goals.filter((g) => g.current_count >= g.target_count).length;
    let overallCompletionRate = 0;
    if (goals.length > 0) {
      const totalProgress = goals.reduce((acc, g) => acc + g.current_count, 0);
      const totalTargets = goals.reduce((acc, g) => acc + g.target_count, 0);
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
    const historyMap = {};
    const loopDate = new Date(fromDate);
    while (loopDate <= toDate) {
      const dayStr = loopDate.toISOString().split("T")[0];
      historyMap[dayStr] = [];
      loopDate.setDate(loopDate.getDate() + 1);
    }
    filteredLogs.forEach((log) => {
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

// src/express-app.ts
var app = express();
app.use(express.json());
app.use("/api/auth", auth_default);
app.use("/api/goals", goals_default);
app.use("/api/stats", stats_default);
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
