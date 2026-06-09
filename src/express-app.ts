// src/app.ts
import express from "express";
import authRoutes from "./routes/auth";
import goalRoutes from "./routes/goals";
import statsRoutes from "./routes/stats";
import groupRoutes from "./routes/groups";
import aiRoutes from "./routes/ai";
import freezeRoutes from "./routes/freeze";
import xpRoutes from "./routes/xp";
import { errorHandler } from "./middleware/errorHandler";
import { db } from "../server/db";

const app = express();

// Global body parser
app.use(express.json());

// Backend REST API Endpoints registration
app.use("/api/auth", authRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/freeze", freezeRoutes);
app.use("/api/xp", xpRoutes);


// Database seed utility and simple API health endpoint
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    message: "Daily Goal Tracker custom server running successfully.",
    timestamp: new Date().toISOString(),
  });
});

// Seed sample goals if database is empty for current user on first use (to make it instantly usable and enjoyable!)
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
        due_date: null,
      });
      await db.streaks.create({ user_id: userId, goal_id: g1.id });

      const g2 = await db.goals.create({
        user_id: userId,
        title: "Morning Plank exercise",
        description: "Hold standard plank for 3 minutes",
        category: "Fitness",
        target_count: 2, // 2 sessions of plank
        frequency: "daily",
        due_date: null,
      });
      await db.streaks.create({ user_id: userId, goal_id: g2.id });

      const g3 = await db.goals.create({
        user_id: userId,
        title: "Drink Water 2L",
        description: "Stay hydrated by drinking at least 8 cups",
        category: "Health",
        target_count: 1,
        frequency: "daily",
        due_date: null,
      });
      await db.streaks.create({ user_id: userId, goal_id: g3.id });

      return res.json({ success: true, seeded: true, message: "Successfully seeded initial wellness goals." });
    }

    res.json({ success: true, seeded: false, message: "Goals already initialized." });
  } catch (error) {
    next(error);
  }
});

// Global error catcher
app.use(errorHandler);

export default app;
