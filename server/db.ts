// server/db.ts
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import fs from "fs";
import path from "path";

let dbUrl = "file:./dev.db";

if (process.env.VERCEL) {
  const srcPath = path.join(process.cwd(), "dev.db");
  const destPath = "/tmp/dev.db";
  
  try {
    if (!fs.existsSync(destPath)) {
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log("Successfully copied dev.db to /tmp/dev.db");
      } else {
        console.log("Source dev.db not found at", srcPath);
      }
    }
    dbUrl = `file:${destPath}`;
  } catch (error) {
    console.error("Failed to copy database to /tmp:", error);
  }
}

// Create SQLite adapter
const adapter = new PrismaBetterSqlite3({
  url: dbUrl,
});
const prisma = new PrismaClient({ adapter });


// Helper mappers to match the previous local DB model representation (which used string dates)
function mapUser(u: any) {
  if (!u) return null;
  return {
    ...u,
    created_at: u.created_at.toISOString(),
    updated_at: u.updated_at.toISOString(),
  };
}

function mapGoal(g: any) {
  if (!g) return null;
  return {
    ...g,
    created_at: g.created_at.toISOString(),
    updated_at: g.updated_at.toISOString(),
    due_date: g.due_date ? g.due_date.toISOString() : null,
  };
}

function mapGoalLog(l: any) {
  if (!l) return null;
  return {
    ...l,
    completed_at: l.completed_at.toISOString(),
    created_at: l.created_at.toISOString(),
  };
}

function mapStreak(s: any) {
  if (!s) return null;
  return {
    ...s,
    last_completed_at: s.last_completed_at ? s.last_completed_at.toISOString() : null,
  };
}

function mapNotification(n: any) {
  if (!n) return null;
  return {
    ...n,
    created_at: n.created_at.toISOString(),
  };
}

class PrismaDB {
  // Users Operations
  public users = {
    findUnique: async (where: { email?: string; id?: string }) => {
      let user = null;
      if (where.email) {
        user = await prisma.user.findUnique({ where: { email: where.email } });
      } else if (where.id) {
        user = await prisma.user.findUnique({ where: { id: where.id } });
      }
      return mapUser(user);
    },
    create: async (data: { email: string; password_hash: string; name: string; timezone?: string }) => {
      const created = await prisma.user.create({
        data: {
          email: data.email,
          password_hash: data.password_hash,
          name: data.name,
          timezone: data.timezone || "UTC",
        },
      });
      return mapUser(created);
    },
    update: async (id: string, updateData: { email?: string; password_hash?: string; name?: string; timezone?: string }) => {
      const updated = await prisma.user.update({
        where: { id },
        data: updateData,
      });
      return mapUser(updated);
    },
  };

  // Goals CRUD Operations
  public goals = {
    findMany: async (where?: { user_id?: string; status?: string }) => {
      const prismaWhere: any = {};
      if (where) {
        if (where.user_id) prismaWhere.user_id = where.user_id;
        if (where.status) prismaWhere.status = where.status;
      }
      const goals = await prisma.goal.findMany({ where: prismaWhere });
      return goals.map(mapGoal);
    },
    findUnique: async (where: { id: string }) => {
      const goal = await prisma.goal.findUnique({ where: { id: where.id } });
      return mapGoal(goal);
    },
    create: async (data: {
      user_id: string;
      title: string;
      description?: string | null;
      category: string;
      target_count: number;
      frequency: string;
      due_date?: string | null;
    }) => {
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
          status: "active",
        },
      });
      return mapGoal(created);
    },
    update: async (id: string, updateData: {
      title?: string;
      description?: string | null;
      category?: string;
      target_count?: number;
      current_count?: number;
      frequency?: string;
      status?: string;
      due_date?: string | null;
    }) => {
      const prismaUpdate: any = { ...updateData };
      if (updateData.due_date !== undefined) {
        prismaUpdate.due_date = updateData.due_date ? new Date(updateData.due_date) : null;
      }
      const updated = await prisma.goal.update({
        where: { id },
        data: prismaUpdate,
      });
      return mapGoal(updated);
    },
    delete: async (id: string) => {
      // cascade deletion handles streaks and logs via schema definition
      const deleted = await prisma.goal.delete({ where: { id } });
      return mapGoal(deleted);
    },
  };

  // Goal Logs helpers
  public logs = {
    findMany: async (where?: { goal_id?: string; user_id?: string }) => {
      const prismaWhere: any = {};
      if (where) {
        if (where.goal_id) prismaWhere.goal_id = where.goal_id;
        if (where.user_id) prismaWhere.user_id = where.user_id;
      }
      const logs = await prisma.goalLog.findMany({ where: prismaWhere });
      return logs.map(mapGoalLog);
    },
    create: async (data: { goal_id: string; user_id: string; completed_at?: string; note?: string | null }) => {
      const created = await prisma.goalLog.create({
        data: {
          goal_id: data.goal_id,
          user_id: data.user_id,
          completed_at: data.completed_at ? new Date(data.completed_at) : new Date(),
          note: data.note || null,
        },
      });
      return mapGoalLog(created);
    },
  };

  // Streaks helpers
  public streaks = {
    findUnique: async (where: { goal_id: string }) => {
      const streak = await prisma.streak.findFirst({ where: { goal_id: where.goal_id } });
      return mapStreak(streak);
    },
    findMany: async (where?: { user_id: string }) => {
      const prismaWhere: any = {};
      if (where?.user_id) {
        prismaWhere.user_id = where.user_id;
      }
      const streaks = await prisma.streak.findMany({ where: prismaWhere });
      return streaks.map(mapStreak);
    },
    create: async (data: { user_id: string; goal_id: string }) => {
      const created = await prisma.streak.create({
        data: {
          user_id: data.user_id,
          goal_id: data.goal_id,
          current_streak: 0,
          longest_streak: 0,
          last_completed_at: null,
        },
      });
      return mapStreak(created);
    },
    update: async (id: string, updateData: { current_streak?: number; longest_streak?: number; last_completed_at?: string | null }) => {
      const prismaUpdate: any = { ...updateData };
      if (updateData.last_completed_at !== undefined) {
        prismaUpdate.last_completed_at = updateData.last_completed_at ? new Date(updateData.last_completed_at) : null;
      }
      const updated = await prisma.streak.update({
        where: { id },
        data: prismaUpdate,
      });
      return mapStreak(updated);
    },
    upsert: async (goal_id: string, user_id: string, updates: { current_streak?: number; longest_streak?: number; last_completed_at?: string | null }) => {
      const existing = await prisma.streak.findFirst({ where: { goal_id } });
      if (!existing) {
        const created = await prisma.streak.create({
          data: {
            user_id,
            goal_id,
            current_streak: updates.current_streak ?? 1,
            longest_streak: updates.longest_streak ?? 1,
            last_completed_at: updates.last_completed_at ? new Date(updates.last_completed_at) : new Date(),
          },
        });
        return mapStreak(created);
      } else {
        const prismaUpdate: any = { ...updates };
        if (updates.last_completed_at !== undefined) {
          prismaUpdate.last_completed_at = updates.last_completed_at ? new Date(updates.last_completed_at) : null;
        }
        const updated = await prisma.streak.update({
          where: { id: existing.id },
          data: prismaUpdate,
        });
        return mapStreak(updated);
      }
    },
  };

  // Notifications Helpers
  public notifications = {
    findMany: async (where: { user_id: string; is_read?: boolean }) => {
      const prismaWhere: any = { user_id: where.user_id };
      if (where.is_read !== undefined) {
        prismaWhere.is_read = where.is_read;
      }
      const notifications = await prisma.notification.findMany({ where: prismaWhere });
      return notifications.map(mapNotification);
    },
    create: async (data: { user_id: string; type: string; message: string }) => {
      const created = await prisma.notification.create({
        data: {
          user_id: data.user_id,
          type: data.type,
          message: data.message,
          is_read: false,
        },
      });
      return mapNotification(created);
    },
    markAllAsRead: async (user_id: string) => {
      await prisma.notification.updateMany({
        where: { user_id },
        data: { is_read: true },
      });
    },
  };
}

export const db = new PrismaDB();
