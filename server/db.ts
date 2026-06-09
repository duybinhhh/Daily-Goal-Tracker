// server/db.ts
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required. Set it in your local .env file and in Vercel Environment Variables.");
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
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
    reminder_time: g.reminder_time ?? null,
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

function getCurrentMonthYear(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function mapFreeze(f: any) {
  return {
    id: f.id,
    user_id: f.user_id,
    goal_id: f.goal_id,
    frozen_date: f.frozen_date,
    created_at: f.created_at.toISOString(),
  };
}

type StreakFreezeRecord = ReturnType<typeof mapFreeze>;

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
    findMany: async (where?: { has_push_subscription?: boolean }) => {
      let prismaWhere: any = {};
      if (where?.has_push_subscription) {
        prismaWhere.push_subscription = { not: null };
      }
      const list = await prisma.user.findMany({ where: prismaWhere });
      return list.map(mapUser);
    },
    create: async (data: { email: string; password_hash: string; name: string; timezone?: string }) => {
      const created = await prisma.user.create({
        data: {
          email: data.email,
          password_hash: data.password_hash,
          name: data.name,
          timezone: data.timezone || "UTC",
          onboarding_completed: false,
        },
      });
      return mapUser(created);
    },
    update: async (
      id: string,
      updateData: {
        email?: string;
        password_hash?: string;
        name?: string;
        timezone?: string;
        push_subscription?: string | null;
        last_reminder_sent_date?: string | null;
        last_freeze_reminder_date?: string | null;
        onboarding_completed?: boolean;
        total_xp?: number;
        level?: number;
      }
    ) => {
      const prismaUpdate: any = { ...updateData };
      const updated = await prisma.user.update({
        where: { id },
        data: prismaUpdate,
      });
      return mapUser(updated);
    },
    delete: async (id: string) => {
      const deleted = await prisma.user.delete({
        where: { id },
      });
      return mapUser(deleted);
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
      reminder_time?: string | null;
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
          reminder_time: data.reminder_time || null,
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
      reminder_time?: string | null;
    }) => {
      const prismaUpdate: any = { ...updateData };
      if (updateData.due_date !== undefined) {
        prismaUpdate.due_date = updateData.due_date ? new Date(updateData.due_date) : null;
      }
      if (updateData.reminder_time !== undefined) {
        prismaUpdate.reminder_time = updateData.reminder_time || null;
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
    findUnique: async (where: { id: string }) => {
      const log = await prisma.goalLog.findUnique({ where: { id: where.id } });
      return mapGoalLog(log);
    },
    create: async (data: { id?: string; goal_id: string; user_id: string; completed_at?: string; note?: string | null }) => {
      const created = await prisma.goalLog.create({
        data: {
          id: data.id,
          goal_id: data.goal_id,
          user_id: data.user_id,
          completed_at: data.completed_at ? new Date(data.completed_at) : new Date(),
          note: data.note || null,
        },
      });
      return mapGoalLog(created);
    },
    delete: async (id: string) => {
      const deleted = await prisma.goalLog.delete({ where: { id } });
      return mapGoalLog(deleted);
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

  public freezeTokens = {
    findOrCreate: async (userId: string): Promise<{ id: string; user_id: string; tokens_left: number; month_year: string }> => {
      const currentMonthYear = getCurrentMonthYear();
      const existing = await prisma.freezeToken.findUnique({ where: { user_id: userId } });

      if (!existing) {
        return prisma.freezeToken.create({
          data: { user_id: userId, tokens_left: 3, month_year: currentMonthYear },
        });
      }

      if (existing.month_year !== currentMonthYear) {
        return prisma.freezeToken.update({
          where: { user_id: userId },
          data: { tokens_left: 3, month_year: currentMonthYear },
        });
      }

      return existing;
    },
    update: async (userId: string, data: { tokens_left?: number; month_year?: string }) => {
      return prisma.freezeToken.update({ where: { user_id: userId }, data });
    },
  };

  public streakFreezes = {
    findMany: async (where: { user_id?: string; goal_id?: string }): Promise<StreakFreezeRecord[]> => {
      const results = await prisma.streakFreeze.findMany({ where });
      return results.map(mapFreeze);
    },
    create: async (data: { user_id: string; goal_id: string; frozen_date: string }) => {
      const created = await prisma.streakFreeze.create({ data });
      return mapFreeze(created);
    },
    findByDate: async (goalId: string, date: string) => {
      const found = await prisma.streakFreeze.findUnique({
        where: { goal_id_frozen_date: { goal_id: goalId, frozen_date: date } },
      });
      return found ? mapFreeze(found) : null;
    },
  };

  // Notifications Helpers
  public notifications = {
    findMany: async (where?: { user_id?: string; is_read?: boolean }) => {
      const prismaWhere: any = {};
      if (where) {
        if (where.user_id) prismaWhere.user_id = where.user_id;
        if (where.is_read !== undefined) {
          prismaWhere.is_read = where.is_read;
        }
      }
      const notifications = await prisma.notification.findMany({ 
        where: prismaWhere,
        orderBy: { created_at: "desc" },
        take: 100
      });
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

  // Habit Groups Helpers
  public groups = {
    findMany: async (where?: { creator_id?: string }) => {
      const prismaWhere: any = {};
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
    findUnique: async (where: { id: string }) => {
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
    create: async (data: {
      name: string;
      description?: string | null;
      creator_id: string;
      goal_title: string;
      goal_category: string;
      goal_target_count: number;
      goal_frequency: string;
    }) => {
      const created = await prisma.habitGroup.create({
        data: {
          name: data.name,
          description: data.description || null,
          creator_id: data.creator_id,
          goal_title: data.goal_title,
          goal_category: data.goal_category,
          goal_target_count: data.goal_target_count,
          goal_frequency: data.goal_frequency,
        },
      });
      return created;
    },
    delete: async (id: string) => {
      const deleted = await prisma.habitGroup.delete({ where: { id } });
      return deleted;
    }
  };

  // Group Memberships Helpers
  public groupMembers = {
    findMany: async (where: { group_id?: string; user_id?: string }) => {
      const prismaWhere: any = {};
      if (where.group_id) prismaWhere.group_id = where.group_id;
      if (where.user_id) prismaWhere.user_id = where.user_id;
      const list = await prisma.habitGroupMember.findMany({
        where: prismaWhere,
        include: {
          user: true,
          group: true,
        }
      });
      return list;
    },
    create: async (data: { group_id: string; user_id: string }) => {
      const created = await prisma.habitGroupMember.create({
        data: {
          group_id: data.group_id,
          user_id: data.user_id,
        },
      });
      return created;
    },
    delete: async (where: { group_id: string; user_id: string }) => {
      const deleted = await prisma.habitGroupMember.deleteMany({
        where: {
          group_id: where.group_id,
          user_id: where.user_id,
        }
      });
      return deleted;
    }
  };
}

export const db = new PrismaDB();

