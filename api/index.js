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
    updated_at: u.updated_at.toISOString(),
    show_activity_in_feed: u.show_activity_in_feed ?? true
  };
}
function mapGoal(g) {
  if (!g) return null;
  return {
    ...g,
    created_at: g.created_at.toISOString(),
    updated_at: g.updated_at.toISOString(),
    due_date: g.due_date ? g.due_date.toISOString() : null,
    reminder_time: g.reminder_time ?? null
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
function mapGroupMessage(m) {
  if (!m) return null;
  return {
    ...m,
    created_at: m.created_at.toISOString(),
    updated_at: m.updated_at.toISOString(),
    sender: m.sender ? {
      id: m.sender.id,
      name: m.sender.name,
      avatarInitials: m.sender.name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2)
    } : null,
    reactions: m.reactions || []
  };
}
function mapDisciplineRoom(r) {
  if (!r) return null;
  return {
    ...r,
    started_at: r.started_at ? r.started_at.toISOString() : null,
    ended_at: r.ended_at ? r.ended_at.toISOString() : null,
    expires_at: r.expires_at ? r.expires_at.toISOString() : null,
    created_at: r.created_at.toISOString(),
    updated_at: r.updated_at.toISOString(),
    participants: r.participants ? r.participants.map(mapRoomParticipant) : []
  };
}
function mapRoomParticipant(p) {
  if (!p) return null;
  return {
    ...p,
    joined_at: p.joined_at.toISOString(),
    left_at: p.left_at ? p.left_at.toISOString() : null,
    ready_at: p.ready_at ? p.ready_at.toISOString() : null,
    user: p.user ? {
      id: p.user.id,
      name: p.user.name,
      email: p.user.email
    } : null
  };
}
function mapSessionReport(r) {
  if (!r) return null;
  return {
    ...r,
    created_at: r.created_at.toISOString(),
    metadata: r.metadata ? typeof r.metadata === "string" ? JSON.parse(r.metadata) : r.metadata : null
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
        const prismaUpdate = { ...updateData };
        const updated = await prisma.user.update({
          where: { id },
          data: prismaUpdate
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
    this.friends = {
      search: async (currentUserId, query) => {
        const users = await prisma.user.findMany({
          where: {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } }
            ],
            id: { not: currentUserId }
          },
          select: {
            id: true,
            name: true,
            email: true,
            level: true,
            total_xp: true,
            followers: {
              where: { follower_id: currentUserId }
            },
            goals: {
              select: {
                streaks: {
                  select: {
                    current_streak: true,
                    longest_streak: true
                  }
                }
              }
            }
          },
          take: 20
        });
        return users.map((u) => {
          let maxStreak = 0;
          u.goals.forEach((g) => {
            g.streaks.forEach((s) => {
              if (s.current_streak > maxStreak) maxStreak = s.current_streak;
            });
          });
          return {
            id: u.id,
            name: u.name,
            email: u.email,
            level: u.level,
            streak: maxStreak,
            isFollowing: u.followers.length > 0,
            avatarInitials: u.name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2)
          };
        });
      },
      follow: async (followerId, followingId) => {
        if (followerId === followingId) throw new Error("You cannot follow yourself.");
        return await prisma.follow.upsert({
          where: {
            follower_id_following_id: {
              follower_id: followerId,
              following_id: followingId
            }
          },
          update: {},
          create: {
            follower_id: followerId,
            following_id: followingId
          }
        });
      },
      unfollow: async (followerId, followingId) => {
        return await prisma.follow.deleteMany({
          where: {
            follower_id: followerId,
            following_id: followingId
          }
        });
      },
      getFeed: async (userId) => {
        const following = await prisma.follow.findMany({
          where: { follower_id: userId },
          select: { following_id: true }
        });
        const followingIds = following.map((f) => f.following_id);
        const logs = await prisma.goalLog.findMany({
          where: {
            user_id: { in: followingIds },
            user: { show_activity_in_feed: true }
          },
          include: {
            user: true,
            goal: true
          },
          orderBy: { completed_at: "desc" },
          take: 5
        });
        return logs.map((l) => ({
          id: l.id,
          userId: l.user_id,
          userName: l.user.name,
          goalTitle: l.goal.title,
          type: "checkin",
          createdAt: l.completed_at.toISOString(),
          avatarInitials: l.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2)
        }));
      },
      getStats: async (userId) => {
        const [followingCount, followersCount] = await Promise.all([
          prisma.follow.count({ where: { follower_id: userId } }),
          prisma.follow.count({ where: { following_id: userId } })
        ]);
        return { followingCount, followersCount };
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
            reminder_time: data.reminder_time || null,
            group_id: data.group_id || null,
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
        if (updateData.archived_at !== void 0) {
          prismaUpdate.archived_at = updateData.archived_at ? new Date(updateData.archived_at) : null;
        }
        if (updateData.reminder_time !== void 0) {
          prismaUpdate.reminder_time = updateData.reminder_time || null;
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
        const prismaWhere = {};
        if (where) {
          if (where.user_id) prismaWhere.user_id = where.user_id;
          if (where.is_read !== void 0) {
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
      findByInviteCode: async (inviteCode) => {
        const group = await prisma.habitGroup.findUnique({
          where: { invite_code: inviteCode },
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
            goal_frequency: data.goal_frequency,
            max_members: data.max_members ?? 20
          }
        });
        return created;
      },
      update: async (id, data) => {
        const updated = await prisma.habitGroup.update({
          where: { id },
          data
        });
        return updated;
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
    this.groupMessages = {
      findMany: async (where, take = 30) => {
        const messages = await prisma.groupMessage.findMany({
          where: { group_id: where.group_id },
          include: {
            sender: true,
            reactions: {
              include: {
                user: true
              }
            }
          },
          orderBy: { created_at: "desc" },
          take
        });
        return messages.reverse().map(mapGroupMessage);
      },
      findUnique: async (id) => {
        const msg = await prisma.groupMessage.findUnique({
          where: { id },
          include: {
            sender: true,
            reactions: true
          }
        });
        return mapGroupMessage(msg);
      },
      create: async (data) => {
        const created = await prisma.groupMessage.create({
          data: {
            group_id: data.group_id,
            sender_id: data.sender_id,
            content: data.content
          },
          include: {
            sender: true,
            reactions: true
          }
        });
        return mapGroupMessage(created);
      },
      delete: async (id) => {
        return await prisma.groupMessage.delete({ where: { id } });
      }
    };
    this.messageReactions = {
      findUnique: async (where) => {
        return await prisma.messageReaction.findUnique({
          where: {
            message_id_user_id_emoji: {
              message_id: where.message_id,
              user_id: where.user_id,
              emoji: where.emoji
            }
          }
        });
      },
      create: async (data) => {
        return await prisma.messageReaction.create({
          data: {
            message_id: data.message_id,
            user_id: data.user_id,
            emoji: data.emoji
          }
        });
      },
      delete: async (id) => {
        return await prisma.messageReaction.delete({ where: { id } });
      },
      toggle: async (message_id, user_id, emoji) => {
        const existing = await prisma.messageReaction.findUnique({
          where: {
            message_id_user_id_emoji: {
              message_id,
              user_id,
              emoji
            }
          }
        });
        if (existing) {
          await prisma.messageReaction.delete({ where: { id: existing.id } });
          return { action: "removed" };
        } else {
          await prisma.messageReaction.create({
            data: { message_id, user_id, emoji }
          });
          return { action: "added" };
        }
      }
    };
    this.groupChatNotificationLogs = {
      countToday: async (user_id) => {
        const today = /* @__PURE__ */ new Date();
        today.setHours(0, 0, 0, 0);
        return await prisma.groupChatNotificationLog.count({
          where: {
            user_id,
            created_at: {
              gte: today
            }
          }
        });
      },
      create: async (user_id, group_id) => {
        return await prisma.groupChatNotificationLog.create({
          data: { user_id, group_id }
        });
      }
    };
    this.disciplineRooms = {
      findUnique: async (id) => {
        const room = await prisma.disciplineRoom.findUnique({
          where: { id },
          include: { participants: { include: { user: true } } }
        });
        return mapDisciplineRoom(room);
      },
      findByInviteCode: async (inviteCode) => {
        const room = await prisma.disciplineRoom.findUnique({
          where: { invite_code: inviteCode },
          include: { participants: { include: { user: true } } }
        });
        return mapDisciplineRoom(room);
      },
      findWaitingPublic: async () => {
        const now = /* @__PURE__ */ new Date();
        const rooms = await prisma.disciplineRoom.findMany({
          where: {
            status: "WAITING_PARTNER",
            is_public: true,
            OR: [
              { expires_at: null },
              { expires_at: { gt: now } }
            ]
          },
          include: {
            participants: { include: { user: true } },
            creator: {
              select: {
                id: true,
                name: true,
                level: true,
                total_xp: true
              }
            }
          },
          orderBy: { created_at: "desc" }
        });
        return rooms.map(mapDisciplineRoom);
      },
      create: async (data) => {
        const prismaData = { ...data };
        if (data.expires_at) prismaData.expires_at = new Date(data.expires_at);
        const created = await prisma.disciplineRoom.create({
          data: prismaData,
          include: { participants: { include: { user: true } } }
        });
        return mapDisciplineRoom(created);
      },
      update: async (id, data) => {
        const prismaData = { ...data };
        if (data.started_at) prismaData.started_at = new Date(data.started_at);
        if (data.ended_at) prismaData.ended_at = new Date(data.ended_at);
        const updated = await prisma.disciplineRoom.update({
          where: { id },
          data: prismaData
        });
        return mapDisciplineRoom(updated);
      }
    };
    this.roomParticipants = {
      findManyByRoomId: async (roomId) => {
        const participants = await prisma.roomParticipant.findMany({
          where: { room_id: roomId },
          include: { user: true }
        });
        return participants.map(mapRoomParticipant);
      },
      create: async (data) => {
        const created = await prisma.roomParticipant.create({ data });
        return mapRoomParticipant(created);
      },
      updateByRoomAndUser: async (roomId, userId, data) => {
        const prismaData = { ...data };
        if (data.left_at) prismaData.left_at = new Date(data.left_at);
        if (data.ready_at) prismaData.ready_at = new Date(data.ready_at);
        const updated = await prisma.roomParticipant.update({
          where: { room_id_user_id: { room_id: roomId, user_id: userId } },
          data: prismaData
        });
        return mapRoomParticipant(updated);
      },
      deleteByRoomAndUser: async (roomId, userId) => {
        const deleted = await prisma.roomParticipant.delete({
          where: { room_id_user_id: { room_id: roomId, user_id: userId } }
        });
        return mapRoomParticipant(deleted);
      }
    };
    this.roomMessages = {
      findManyByRoomId: async (roomId, afterDate) => {
        let whereClause = { room_id: roomId };
        if (afterDate) {
          whereClause.created_at = { gt: new Date(afterDate) };
        }
        const messages = await prisma.roomMessage.findMany({
          where: whereClause,
          orderBy: { created_at: "asc" },
          include: { sender: { select: { id: true, name: true } } }
        });
        return messages.map((m) => ({
          ...m,
          created_at: m.created_at.toISOString(),
          senderName: m.sender?.name || null
        }));
      },
      create: async (data) => {
        const created = await prisma.roomMessage.create({
          data,
          include: { sender: { select: { id: true, name: true } } }
        });
        return {
          ...created,
          created_at: created.created_at.toISOString(),
          senderName: created.sender?.name || null
        };
      }
    };
    this.sessionReports = {
      create: async (data) => {
        const created = await prisma.sessionReport.create({ data });
        return mapSessionReport(created);
      },
      findByRoomAndUser: async (roomId, userId) => {
        const report = await prisma.sessionReport.findFirst({
          where: { room_id: roomId, user_id: userId }
        });
        return mapSessionReport(report);
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
        onboarding_completed: newUser.onboarding_completed,
        total_xp: newUser.total_xp ?? 0,
        level: newUser.level ?? 1
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
        onboarding_completed: user.onboarding_completed,
        total_xp: user.total_xp ?? 0,
        level: user.level ?? 1
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
          onboarding_completed: updatedUser2.onboarding_completed,
          total_xp: updatedUser2.total_xp ?? 0,
          level: updatedUser2.level ?? 1
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
        onboarding_completed: updatedUser.onboarding_completed,
        total_xp: updatedUser.total_xp ?? 0,
        level: updatedUser.level ?? 1
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

// src/routes/friends.ts
import { Router as Router2 } from "express";

// src/controllers/friendsController.ts
var searchUsers = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized", 401);
    const query = req.query.q;
    if (!query || query.trim().length === 0) {
      return res.status(200).json({ users: [] });
    }
    const users = await db.friends.search(userId, query);
    res.status(200).json({ users });
  } catch (error) {
    next(error);
  }
};
var followUser = async (req, res, next) => {
  try {
    const followerId = req.user?.id;
    if (!followerId) throw new AppError("Unauthorized", 401);
    const { userId: followingId } = req.body;
    if (!followingId) throw new AppError("Following User ID is required", 400);
    await db.friends.follow(followerId, followingId);
    res.status(200).json({ success: true, message: "Successfully followed user." });
  } catch (error) {
    next(error);
  }
};
var unfollowUser = async (req, res, next) => {
  try {
    const followerId = req.user?.id;
    if (!followerId) throw new AppError("Unauthorized", 401);
    const { userId: followingId } = req.body;
    if (!followingId) throw new AppError("Following User ID is required", 400);
    await db.friends.unfollow(followerId, followingId);
    res.status(200).json({ success: true, message: "Successfully unfollowed user." });
  } catch (error) {
    next(error);
  }
};
var getActivityFeed = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized", 401);
    const activities = await db.friends.getFeed(userId);
    res.status(200).json({ activities });
  } catch (error) {
    next(error);
  }
};
var getFollowStats = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized", 401);
    const stats = await db.friends.getStats(userId);
    res.status(200).json({ ...stats });
  } catch (error) {
    next(error);
  }
};
var updatePrivacySetting = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized", 401);
    const { showActivityInFeed } = req.body;
    if (showActivityInFeed === void 0) {
      throw new AppError("showActivityInFeed is required", 400);
    }
    await db.users.update(userId, { show_activity_in_feed: !!showActivityInFeed });
    res.status(200).json({ success: true, message: "Privacy setting updated." });
  } catch (error) {
    next(error);
  }
};

// src/routes/friends.ts
var router2 = Router2();
router2.use(authMiddleware);
router2.get("/search", searchUsers);
router2.post("/follow", followUser);
router2.delete("/follow", unfollowUser);
router2.get("/feed", getActivityFeed);
router2.get("/stats", getFollowStats);
router2.patch("/privacy", updatePrivacySetting);
var friends_default = router2;

// src/routes/goals.ts
import { Router as Router3 } from "express";

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
  const correctStatus = goal.status === "paused" ? "paused" : isCompleted ? "completed" : "active";
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
    const { title, description, category, target_count, frequency, due_date, reminder_time } = req.body;
    if (!title || !category) {
      throw new AppError("Goal title and category fields are required properties.", 400);
    }
    const goalTarget = target_count ? parseInt(target_count, 10) : 1;
    if (isNaN(goalTarget) || goalTarget <= 0) {
      throw new AppError("Target count must be a positive integer greater than zero.", 400);
    }
    if (reminder_time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(reminder_time)) {
      throw new AppError("Reminder time must use HH:mm format.", 400);
    }
    const newGoal = await db.goals.create({
      user_id: userId,
      title,
      description: description || null,
      category,
      target_count: goalTarget,
      frequency: frequency || "daily",
      due_date: due_date || null,
      reminder_time: reminder_time || null
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
    const { title, description, category, target_count, current_count, frequency, status, is_archived, due_date, reminder_time } = req.body;
    const updates = {};
    if (title !== void 0) updates.title = title;
    if (description !== void 0) updates.description = description;
    if (category !== void 0) updates.category = category;
    if (frequency !== void 0) updates.frequency = frequency;
    if (status !== void 0) updates.status = status;
    if (is_archived !== void 0) {
      updates.is_archived = is_archived;
      updates.archived_at = is_archived ? (/* @__PURE__ */ new Date()).toISOString() : null;
    }
    if (due_date !== void 0) updates.due_date = due_date;
    if (reminder_time !== void 0) {
      if (reminder_time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(reminder_time)) {
        throw new AppError("Reminder time must use HH:mm format.", 400);
      }
      updates.reminder_time = reminder_time || null;
    }
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
var bulkArchiveGoals = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized access.", 401);
    const { goalIds } = req.body;
    if (!Array.isArray(goalIds)) throw new AppError("Invalid payload.", 400);
    const userGoals = await db.goals.findMany({ user_id: userId });
    const ownedIds = new Set(userGoals.map((g) => g.id));
    const validIds = goalIds.filter((id) => ownedIds.has(id));
    const archivedAt = (/* @__PURE__ */ new Date()).toISOString();
    await Promise.all(validIds.map((id) => db.goals.update(id, { is_archived: true, archived_at: archivedAt })));
    res.status(200).json({ success: true, message: "Goals archived successfully." });
  } catch (error) {
    next(error);
  }
};
var bulkPauseGoals = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized access.", 401);
    const { goalIds } = req.body;
    if (!Array.isArray(goalIds)) throw new AppError("Invalid payload.", 400);
    const userGoals = await db.goals.findMany({ user_id: userId });
    const ownedIds = new Set(userGoals.map((g) => g.id));
    const validIds = goalIds.filter((id) => ownedIds.has(id));
    await Promise.all(validIds.map((id) => db.goals.update(id, { status: "paused" })));
    res.status(200).json({ success: true, message: "Goals paused successfully." });
  } catch (error) {
    next(error);
  }
};
var bulkDeleteGoals = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized access.", 401);
    const { goalIds } = req.body;
    if (!Array.isArray(goalIds)) throw new AppError("Invalid payload.", 400);
    const userGoals = await db.goals.findMany({ user_id: userId });
    const ownedIds = new Set(userGoals.map((g) => g.id));
    const validIds = goalIds.filter((id) => ownedIds.has(id));
    await Promise.all(validIds.map((id) => db.goals.delete(id)));
    res.status(200).json({ success: true, message: "Goals deleted successfully." });
  } catch (error) {
    next(error);
  }
};

// src/routes/goals.ts
var router3 = Router3();
router3.use(authMiddleware);
router3.get("/", getGoals);
router3.post("/", createGoal);
router3.put("/bulk/archive", bulkArchiveGoals);
router3.put("/bulk/pause", bulkPauseGoals);
router3.post("/bulk/delete", bulkDeleteGoals);
router3.get("/:id", getGoalById);
router3.put("/:id", updateGoal);
router3.delete("/:id", deleteGoal);
router3.post("/:id/complete", completeGoal);
router3.delete("/logs/:logId", deleteLog);
var goals_default = router3;

// src/routes/stats.ts
import { Router as Router4 } from "express";

// src/controllers/statsController.ts
function getLogDedupeKey(log) {
  return [
    log.goal_id,
    log.completed_at,
    (log.note || "").trim()
  ].join("|");
}
var getLocalDateParts2 = (date, timezone) => {
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
    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3);
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
var getTrendComparison = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized access.", 401);
    const period = String(req.query.period || "");
    const goalId = typeof req.query.goalId === "string" && req.query.goalId.trim() ? req.query.goalId.trim() : void 0;
    if (!["day", "week", "month"].includes(period)) {
      throw new AppError("Invalid period. Must be day, week, or month.", 400);
    }
    const user = await db.users.findUnique({ id: userId });
    const timezone = user?.timezone || "UTC";
    const rawUserGoals = await db.goals.findMany({ user_id: userId });
    const userGoals = rawUserGoals.filter((g) => !g.is_archived);
    const selectedGoal = goalId ? userGoals.find((goal) => goal.id === goalId) : null;
    if (goalId && !selectedGoal) {
      throw new AppError("Goal not found.", 404);
    }
    const allLogs = await db.logs.findMany({ user_id: userId });
    const seenLogIds = /* @__PURE__ */ new Set();
    const seenLogKeys = /* @__PURE__ */ new Set();
    const uniqueAllLogs = allLogs.filter((log) => {
      const key = getLogDedupeKey(log);
      if (seenLogIds.has(log.id) || seenLogKeys.has(key)) {
        return false;
      }
      seenLogIds.add(log.id);
      seenLogKeys.add(key);
      return true;
    });
    const uniqueLogs = uniqueAllLogs.filter((log) => !goalId || log.goal_id === goalId);
    const formatDateStr = (year, month, day) => {
      return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    };
    const getDateKey = (date) => {
      const parts = getLocalDateParts2(date, timezone);
      return formatDateStr(parts.year, parts.month, parts.day);
    };
    const addDays = (date, days) => {
      const next2 = new Date(date);
      next2.setDate(next2.getDate() + days);
      return next2;
    };
    const sumByDateKeys = (dateKeys) => {
      const dateSet = new Set(dateKeys);
      return uniqueLogs.filter((log) => dateSet.has(getDateKey(new Date(log.completed_at)))).length;
    };
    const sumGoalByDateKeys = (targetGoalId, dateKeys) => {
      const dateSet = new Set(dateKeys);
      return uniqueAllLogs.filter((log) => {
        return log.goal_id === targetGoalId && dateSet.has(getDateKey(new Date(log.completed_at)));
      }).length;
    };
    const getGoalDateProgress = (targetGoalId, dateKey) => {
      return uniqueAllLogs.filter((log) => {
        return log.goal_id === targetGoalId && getDateKey(new Date(log.completed_at)) === dateKey;
      }).length;
    };
    const nowParts = getLocalDateParts2(/* @__PURE__ */ new Date(), timezone);
    const localToday = new Date(nowParts.year, nowParts.month, nowParts.day);
    const todayStr = formatDateStr(nowParts.year, nowParts.month, nowParts.day);
    const yesterdayDate = addDays(localToday, -1);
    const yesterdayStr = formatDateStr(yesterdayDate.getFullYear(), yesterdayDate.getMonth(), yesterdayDate.getDate());
    let currentTotal = 0;
    let previousTotal = 0;
    let currentPeriodDateKeys = [];
    let previousPeriodDateKeys = [];
    let data = [];
    let currentRangeLabel = "";
    let previousRangeLabel = "";
    if (period === "day") {
      currentPeriodDateKeys = [todayStr];
      previousPeriodDateKeys = [yesterdayStr];
      currentTotal = sumByDateKeys([todayStr]);
      previousTotal = sumByDateKeys([yesterdayStr]);
      currentRangeLabel = todayStr;
      previousRangeLabel = yesterdayStr;
      data = [
        {
          label: "Today",
          current: currentTotal,
          previous: previousTotal,
          currentPeriodLabel: todayStr,
          previousPeriodLabel: yesterdayStr
        }
      ];
    }
    if (period === "week") {
      const dayOfWeek = localToday.getDay();
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const localMondayThisWeek = new Date(localToday);
      localMondayThisWeek.setDate(localToday.getDate() + diffToMonday);
      const thisWeekDays = [];
      const lastWeekDays = [];
      for (let i = 0; i < 7; i++) {
        const dThis = new Date(localMondayThisWeek);
        dThis.setDate(localMondayThisWeek.getDate() + i);
        thisWeekDays.push(formatDateStr(dThis.getFullYear(), dThis.getMonth(), dThis.getDate()));
        const dLast = new Date(localMondayThisWeek);
        dLast.setDate(localMondayThisWeek.getDate() - 7 + i);
        lastWeekDays.push(formatDateStr(dLast.getFullYear(), dLast.getMonth(), dLast.getDate()));
      }
      const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      currentPeriodDateKeys = thisWeekDays;
      previousPeriodDateKeys = lastWeekDays;
      currentRangeLabel = `${thisWeekDays[0]} - ${thisWeekDays[6]}`;
      previousRangeLabel = `${lastWeekDays[0]} - ${lastWeekDays[6]}`;
      data = labels.map((label, index) => {
        const current = sumByDateKeys([thisWeekDays[index]]);
        const previous = sumByDateKeys([lastWeekDays[index]]);
        currentTotal += current;
        previousTotal += previous;
        return {
          label,
          current,
          previous,
          currentPeriodLabel: thisWeekDays[index],
          previousPeriodLabel: lastWeekDays[index]
        };
      });
    }
    if (period === "month") {
      const currentYear = nowParts.year;
      const currentMonth = nowParts.month;
      const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
      const prevYear = prevMonthDate.getFullYear();
      const prevMonth = prevMonthDate.getMonth();
      const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const daysInPreviousMonth = new Date(prevYear, prevMonth + 1, 0).getDate();
      const bucketStarts = [1, 8, 15, 22, 29].filter((day) => day <= Math.max(daysInCurrentMonth, daysInPreviousMonth));
      currentRangeLabel = formatDateStr(currentYear, currentMonth, 1) + " - " + formatDateStr(currentYear, currentMonth, daysInCurrentMonth);
      previousRangeLabel = formatDateStr(prevYear, prevMonth, 1) + " - " + formatDateStr(prevYear, prevMonth, daysInPreviousMonth);
      currentPeriodDateKeys = Array.from({ length: daysInCurrentMonth }, (_, index) => formatDateStr(currentYear, currentMonth, index + 1));
      previousPeriodDateKeys = Array.from({ length: daysInPreviousMonth }, (_, index) => formatDateStr(prevYear, prevMonth, index + 1));
      data = bucketStarts.map((startDay, index) => {
        const endDay = Math.min(startDay + 6, Math.max(daysInCurrentMonth, daysInPreviousMonth));
        const currentKeys = [];
        const previousKeys = [];
        for (let day = startDay; day <= endDay; day++) {
          if (day <= daysInCurrentMonth) {
            currentKeys.push(formatDateStr(currentYear, currentMonth, day));
          }
          if (day <= daysInPreviousMonth) {
            previousKeys.push(formatDateStr(prevYear, prevMonth, day));
          }
        }
        const current = sumByDateKeys(currentKeys);
        const previous = sumByDateKeys(previousKeys);
        currentTotal += current;
        previousTotal += previous;
        return {
          label: `W${index + 1}`,
          current,
          previous,
          currentPeriodLabel: `${currentKeys[0] || ""} - ${currentKeys[currentKeys.length - 1] || ""}`,
          previousPeriodLabel: `${previousKeys[0] || ""} - ${previousKeys[previousKeys.length - 1] || ""}`
        };
      });
    }
    const getChangePercent = (current, previous) => {
      if (previous > 0) {
        return Math.round((current - previous) / previous * 100);
      }
      return current > 0 ? 100 : 0;
    };
    const changePercent = getChangePercent(currentTotal, previousTotal);
    const summaryGoals = (goalId && selectedGoal ? [selectedGoal] : userGoals).filter((goal) => goal.status !== "paused");
    const todayCheckedIn = [];
    const todayNotCheckedIn = [];
    const yesterdayCheckedIn = [];
    const yesterdayNotCheckedIn = [];
    summaryGoals.forEach((goal) => {
      const targetCount = Math.max(1, Number(goal.target_count) || 1);
      const todayProgress = getGoalDateProgress(goal.id, todayStr);
      const yesterdayProgress = getGoalDateProgress(goal.id, yesterdayStr);
      const hasTodayCompletedTarget = todayProgress >= targetCount;
      const hasYesterdayCompletedTarget = yesterdayProgress >= targetCount;
      if (hasTodayCompletedTarget) {
        todayCheckedIn.push(goal.title);
      } else {
        todayNotCheckedIn.push(goal.title);
      }
      if (hasYesterdayCompletedTarget) {
        yesterdayCheckedIn.push(goal.title);
      } else {
        yesterdayNotCheckedIn.push(goal.title);
      }
    });
    const goalBreakdown = summaryGoals.map((goal) => {
      const current = sumGoalByDateKeys(goal.id, currentPeriodDateKeys);
      const previous = sumGoalByDateKeys(goal.id, previousPeriodDateKeys);
      const targetCount = Math.max(1, Number(goal.target_count) || 1);
      const todayCheckedIn2 = getGoalDateProgress(goal.id, todayStr) >= targetCount;
      const yesterdayCheckedIn2 = getGoalDateProgress(goal.id, yesterdayStr) >= targetCount;
      return {
        goalId: goal.id,
        title: goal.title,
        category: goal.category,
        status: goal.status,
        current,
        previous,
        changePercent: getChangePercent(current, previous),
        todayCheckedIn: todayCheckedIn2,
        yesterdayCheckedIn: yesterdayCheckedIn2
      };
    });
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({
      success: true,
      period,
      goalId: goalId || void 0,
      goalTitle: selectedGoal?.title,
      generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      currentRangeLabel,
      previousRangeLabel,
      currentTotal,
      previousTotal,
      changePercent,
      data,
      goalBreakdown,
      dailySummary: {
        today: {
          checkedInCount: todayCheckedIn.length,
          notCheckedInCount: todayNotCheckedIn.length,
          checkedInGoals: todayCheckedIn,
          notCheckedInGoals: todayNotCheckedIn,
          date: todayStr
        },
        yesterday: {
          checkedInCount: yesterdayCheckedIn.length,
          notCheckedInCount: yesterdayNotCheckedIn.length,
          checkedInGoals: yesterdayCheckedIn,
          notCheckedInGoals: yesterdayNotCheckedIn,
          date: yesterdayStr
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// src/routes/stats.ts
var router4 = Router4();
router4.use(authMiddleware);
router4.get("/dashboard", getDashboardStats);
router4.get("/history", getHistory);
router4.get("/trend", getTrendComparison);
var stats_default = router4;

// src/routes/groups.ts
import { Router as Router5 } from "express";

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
      invite_code: group.invite_code,
      invite_expires_at: group.invite_expires_at,
      max_members: group.max_members,
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
      due_date: null,
      group_id: group.id
    });
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
        invite_code: group.invite_code,
        invite_expires_at: group.invite_expires_at,
        max_members: group.max_members,
        created_at: group.created_at,
        isJoined,
        members: membersProgress
      }
    });
  } catch (error) {
    next(error);
  }
};
function generateInviteCode(length = 8) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}
var createInviteCode = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) throw new AppError("Unauthorized access.", 401);
    const group = await db.groups.findUnique({ id });
    if (!group) {
      throw new AppError("Group not found.", 404);
    }
    if (group.creator_id !== userId) {
      throw new AppError("Only the group creator can generate invite links.", 403);
    }
    if (group.members.length >= group.max_members) {
      throw new AppError(`Nh\xF3m \u0111\xE3 \u0111\u1EE7 ${group.max_members} th\xE0nh vi\xEAn, kh\xF4ng th\u1EC3 t\u1EA1o link m\u1EDDi.`, 400);
    }
    let inviteCode = generateInviteCode();
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      const existing = await db.groups.findByInviteCode(inviteCode);
      if (!existing) {
        isUnique = true;
      } else {
        inviteCode = generateInviteCode();
        attempts++;
      }
    }
    if (!isUnique) {
      throw new AppError("Could not generate a unique invite code. Please try again.", 500);
    }
    const expiresAt = /* @__PURE__ */ new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await db.groups.update(id, {
      invite_code: inviteCode,
      invite_expires_at: expiresAt
    });
    res.status(200).json({
      success: true,
      inviteCode,
      expiresAt: expiresAt.toISOString()
    });
  } catch (error) {
    next(error);
  }
};
var getGroupByInviteCode = async (req, res, next) => {
  try {
    const { inviteCode } = req.params;
    const group = await db.groups.findByInviteCode(inviteCode);
    if (!group) {
      throw new AppError("Link m\u1EDDi kh\xF4ng h\u1EE3p l\u1EC7.", 404);
    }
    const now = /* @__PURE__ */ new Date();
    if (group.invite_expires_at && new Date(group.invite_expires_at) < now) {
      return res.status(200).json({
        success: true,
        status: "expired",
        message: "Link m\u1EDDi \u0111\xE3 h\u1EBFt h\u1EA1n."
      });
    }
    if (group.members.length >= group.max_members) {
      return res.status(200).json({
        success: true,
        status: "full",
        message: "Nh\xF3m \u0111\xE3 \u0111\u1EA7y."
      });
    }
    res.status(200).json({
      success: true,
      status: "valid",
      group: {
        id: group.id,
        name: group.name,
        memberCount: group.members.length,
        maxMembers: group.max_members
      },
      expiresAt: group.invite_expires_at
    });
  } catch (error) {
    next(error);
  }
};
var joinGroupByInviteCode = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { inviteCode } = req.params;
    if (!userId) throw new AppError("Unauthorized access.", 401);
    const group = await db.groups.findByInviteCode(inviteCode);
    if (!group) {
      throw new AppError("Link m\u1EDDi kh\xF4ng h\u1EE3p l\u1EC7.", 404);
    }
    const now = /* @__PURE__ */ new Date();
    if (group.invite_expires_at && new Date(group.invite_expires_at) < now) {
      throw new AppError("Link m\u1EDDi \u0111\xE3 h\u1EBFt h\u1EA1n.", 400);
    }
    if (group.members.length >= group.max_members) {
      throw new AppError("Nh\xF3m \u0111\xE3 \u0111\u1EA7y.", 400);
    }
    const isMember = group.members.some((m) => m.user_id === userId);
    if (isMember) {
      return res.status(200).json({
        success: true,
        alreadyMember: true,
        groupId: group.id,
        message: "B\u1EA1n \u0111\xE3 l\xE0 th\xE0nh vi\xEAn c\u1EE7a nh\xF3m n\xE0y."
      });
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
      due_date: null,
      group_id: group.id
    });
    await db.streaks.create({
      user_id: userId,
      goal_id: goal.id
    });
    res.status(200).json({
      success: true,
      groupId: group.id,
      message: "\u0110\xE3 tham gia nh\xF3m!"
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
    if (group.members.length >= group.max_members) {
      throw new AppError("Nh\xF3m \u0111\xE3 \u0111\u1EA7y.", 400);
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
      due_date: null,
      group_id: group.id
    });
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
var removeMember = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { id, userId: targetUserId } = req.params;
    if (!userId) throw new AppError("Unauthorized access.", 401);
    const group = await db.groups.findUnique({ id });
    if (!group) {
      throw new AppError("Group not found.", 404);
    }
    if (group.creator_id !== userId) {
      throw new AppError("Only the group creator can remove members.", 403);
    }
    if (targetUserId === userId) {
      throw new AppError("You cannot remove yourself. Use 'Leave Group' instead.", 400);
    }
    const isMember = group.members.some((m) => m.user_id === targetUserId);
    if (!isMember) {
      throw new AppError("User is not a member of this group.", 400);
    }
    await db.groupMembers.delete({
      group_id: group.id,
      user_id: targetUserId
    });
    const goals = await db.goals.findMany();
    const groupGoal = goals.find((g) => g.group_id === group.id && g.user_id === targetUserId);
    if (groupGoal) {
      await db.goals.delete(groupGoal.id);
    }
    res.status(200).json({
      success: true,
      message: "Member successfully removed from the group."
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

// src/controllers/groupChatController.ts
import webpush from "web-push";
var getGroupMessages = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { groupId } = req.params;
    if (!userId) throw new AppError("Unauthorized.", 401);
    const membership = await db.groupMembers.findMany({ group_id: groupId, user_id: userId });
    if (membership.length === 0) {
      throw new AppError("You are not a member of this group.", 403);
    }
    const group = await db.groups.findUnique({ id: groupId });
    if (!group) throw new AppError("Group not found.", 404);
    const messages = await db.groupMessages.findMany({ group_id: groupId });
    const formattedMessages = messages.map((msg) => {
      const reactionCounts = {
        "\u{1F525}": 0,
        "\u{1F4AA}": 0,
        "\u{1F44F}": 0,
        "\u2764\uFE0F": 0,
        "\u{1F602}": 0
      };
      const myReactions = [];
      msg.reactions.forEach((r) => {
        if (reactionCounts[r.emoji] !== void 0) {
          reactionCounts[r.emoji]++;
          if (r.user_id === userId) {
            myReactions.push(r.emoji);
          }
        }
      });
      return {
        id: msg.id,
        groupId: msg.group_id,
        senderId: msg.sender_id,
        senderName: msg.sender?.name,
        senderAvatarInitials: msg.sender?.avatarInitials,
        content: msg.content,
        createdAt: msg.created_at,
        canDelete: userId === msg.sender_id || userId === group.creator_id,
        reactions: reactionCounts,
        myReactions
      };
    });
    res.status(200).json({
      success: true,
      messages: formattedMessages
    });
  } catch (error) {
    next(error);
  }
};
var sendGroupMessage = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { groupId } = req.params;
    const { content } = req.body;
    if (!userId) throw new AppError("Unauthorized.", 401);
    if (!content || content.trim().length === 0) {
      throw new AppError("Message content cannot be empty.", 400);
    }
    if (content.trim().length > 200) {
      throw new AppError("Message content cannot exceed 200 characters.", 400);
    }
    const membership = await db.groupMembers.findMany({ group_id: groupId, user_id: userId });
    if (membership.length === 0) {
      throw new AppError("You are not a member of this group.", 403);
    }
    const group = await db.groups.findUnique({ id: groupId });
    if (!group) throw new AppError("Group not found.", 404);
    const message = await db.groupMessages.create({
      group_id: groupId,
      sender_id: userId,
      content: content.trim()
    });
    res.status(201).json({
      success: true,
      message: {
        ...message,
        reactions: { "\u{1F525}": 0, "\u{1F4AA}": 0, "\u{1F44F}": 0, "\u2764\uFE0F": 0, "\u{1F602}": 0 },
        myReactions: [],
        canDelete: true,
        senderName: req.user?.name,
        senderAvatarInitials: message.sender?.avatarInitials
      }
    });
    sendGroupChatNotifications(groupId, userId, content.trim(), group.name, req.user?.name || "Someone").catch((err) => {
      console.error("[Push Notification] Error sending group chat notifications:", err);
    });
  } catch (error) {
    next(error);
  }
};
var toggleReaction = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { groupId, messageId } = req.params;
    const { emoji } = req.body;
    if (!userId) throw new AppError("Unauthorized.", 401);
    const allowedEmojis = ["\u{1F525}", "\u{1F4AA}", "\u{1F44F}", "\u2764\uFE0F", "\u{1F602}"];
    if (!allowedEmojis.includes(emoji)) {
      throw new AppError("Invalid emoji reaction.", 400);
    }
    const membership = await db.groupMembers.findMany({ group_id: groupId, user_id: userId });
    if (membership.length === 0) {
      throw new AppError("You are not a member of this group.", 403);
    }
    await db.messageReactions.toggle(messageId, userId, emoji);
    const message = await db.groupMessages.findUnique(messageId);
    if (!message) throw new AppError("Message not found.", 404);
    const reactionCounts = {
      "\u{1F525}": 0,
      "\u{1F4AA}": 0,
      "\u{1F44F}": 0,
      "\u2764\uFE0F": 0,
      "\u{1F602}": 0
    };
    const myReactions = [];
    message.reactions.forEach((r) => {
      if (reactionCounts[r.emoji] !== void 0) {
        reactionCounts[r.emoji]++;
        if (r.user_id === userId) {
          myReactions.push(r.emoji);
        }
      }
    });
    res.status(200).json({
      success: true,
      reactions: reactionCounts,
      myReactions
    });
  } catch (error) {
    next(error);
  }
};
var deleteMessage = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { groupId, messageId } = req.params;
    if (!userId) throw new AppError("Unauthorized.", 401);
    const message = await db.groupMessages.findUnique(messageId);
    if (!message) throw new AppError("Message not found.", 404);
    const group = await db.groups.findUnique({ id: groupId });
    if (!group) throw new AppError("Group not found.", 404);
    const canDelete = userId === message.sender_id || userId === group.creator_id;
    if (!canDelete) {
      throw new AppError("You do not have permission to delete this message.", 403);
    }
    await db.groupMessages.delete(messageId);
    res.status(200).json({
      success: true,
      message: "Message deleted successfully."
    });
  } catch (error) {
    next(error);
  }
};
async function sendGroupChatNotifications(groupId, senderId, content, groupName, senderName) {
  try {
    const group = await db.groups.findUnique({ id: groupId });
    if (!group) return;
    const members = group.members.filter((m) => m.user_id !== senderId && m.user.push_subscription);
    const truncatedContent = content.length > 50 ? content.substring(0, 47) + "..." : content;
    const payload = JSON.stringify({
      title: `Tin nh\u1EAFn m\u1EDBi trong nh\xF3m ${groupName}`,
      body: `${senderName}: ${truncatedContent}`,
      icon: "/icon.png",
      badge: "/icon.png",
      data: { url: `/#/groups?id=${groupId}` }
    });
    for (const member of members) {
      const countToday = await db.groupChatNotificationLogs.countToday(member.user_id);
      if (countToday >= 3) {
        console.log(`[Push Notification] User ${member.user_id} reached daily limit for group chat notifications.`);
        continue;
      }
      try {
        const subscription = JSON.parse(member.user.push_subscription);
        await webpush.sendNotification(subscription, payload);
        await db.groupChatNotificationLogs.create(member.user_id, groupId);
      } catch (pushErr) {
        console.error(`[Push Notification] Failed for user ${member.user_id}:`, pushErr.message);
        if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
          await db.users.update(member.user_id, { push_subscription: null });
        }
      }
    }
  } catch (err) {
    console.error("[Push Notification] sendGroupChatNotifications failed:", err);
  }
}

// src/routes/groups.ts
var router5 = Router5();
router5.get("/invite/:inviteCode", getGroupByInviteCode);
router5.use(authMiddleware);
router5.get("/", getGroups);
router5.post("/", createGroup);
router5.post("/join/:inviteCode", joinGroupByInviteCode);
router5.get("/:id", getGroupById);
router5.post("/:id/invite", createInviteCode);
router5.post("/:id/join", joinGroup);
router5.post("/:id/leave", leaveGroup);
router5.delete("/:id/members/:userId", removeMember);
router5.delete("/:id", deleteGroup);
router5.get("/:groupId/messages", getGroupMessages);
router5.post("/:groupId/messages", sendGroupMessage);
router5.post("/:groupId/messages/:messageId/reactions", toggleReaction);
router5.delete("/:groupId/messages/:messageId", deleteMessage);
var groups_default = router5;

// src/routes/ai.ts
import { Router as Router6 } from "express";

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
var router6 = Router6();
router6.use(authMiddleware);
router6.post("/report", getAIReport);
router6.post("/chat", postAIChat);
var ai_default = router6;

// src/routes/freeze.ts
import { Router as Router7 } from "express";

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
var router7 = Router7();
router7.use(authMiddleware);
router7.get("/tokens", getFreezeTokens);
router7.post("/activate", activateFreeze);
router7.get("/dates", getFreezeDates);
var freeze_default = router7;

// src/routes/xp.ts
import { Router as Router8 } from "express";

// src/lib/xpSystem.ts
var LEVELS = [
  { level: 1, name: "Beginner", icon: "\u{1F331}", xp_required: 0 },
  { level: 2, name: "Explorer", icon: "\u{1F50D}", xp_required: 100 },
  { level: 3, name: "Achiever", icon: "\u26A1", xp_required: 300 },
  { level: 4, name: "Challenger", icon: "\u{1F3AF}", xp_required: 600 },
  { level: 5, name: "Warrior", icon: "\u2694\uFE0F", xp_required: 1e3 },
  { level: 6, name: "Champion", icon: "\u{1F3C6}", xp_required: 1500 },
  { level: 7, name: "Master", icon: "\u{1F31F}", xp_required: 2200 },
  { level: 8, name: "Elite", icon: "\u{1F48E}", xp_required: 3e3 },
  { level: 9, name: "Grandmaster", icon: "\u{1F525}", xp_required: 4e3 },
  { level: 10, name: "Legend", icon: "\u{1F451}", xp_required: 5500 }
];
function getLevelFromXP(totalXP) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVELS[i].xp_required) {
      return LEVELS[i];
    }
  }
  return LEVELS[0];
}

// src/controllers/xpController.ts
var MAX_XP_AWARD = 2e3;
var awardXP = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized access.", 401);
    const amount = Number(req.body?.amount);
    const reason = String(req.body?.reason || "").trim();
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new AppError("XP amount must be a positive integer.", 400);
    }
    if (amount > MAX_XP_AWARD) {
      throw new AppError("XP amount is too large.", 400);
    }
    if (!reason) {
      throw new AppError("XP reason is required.", 400);
    }
    const user = await db.users.findUnique({ id: userId });
    if (!user) throw new AppError("User not found.", 404);
    const previousLevel = user.level ?? 1;
    const currentXP = user.total_xp ?? 0;
    const nextXP = currentXP + amount;
    const nextLevel = getLevelFromXP(nextXP).level;
    const updatedUser = await db.users.update(userId, {
      total_xp: nextXP,
      level: nextLevel
    });
    res.status(200).json({
      success: true,
      reason,
      awarded_xp: amount,
      total_xp: updatedUser.total_xp ?? nextXP,
      level: updatedUser.level ?? nextLevel,
      previous_level: previousLevel
    });
  } catch (error) {
    next(error);
  }
};

// src/routes/xp.ts
var router8 = Router8();
router8.use(authMiddleware);
router8.post("/award", awardXP);
var xp_default = router8;

// src/routes/disciplineRoom.ts
import { Router as Router9 } from "express";

// src/controllers/disciplineRoomController.ts
var frameStore = /* @__PURE__ */ new Map();
setInterval(() => {
  const now = Date.now();
  for (const [roomId, clients] of frameStore.entries()) {
    for (const [cid, data] of clients.entries()) {
      if (now - data.ts > 2 * 60 * 60 * 1e3) clients.delete(cid);
    }
    if (clients.size === 0) frameStore.delete(roomId);
  }
}, 10 * 60 * 1e3);
var getAIInsight = (report, mode) => {
  const { focus_score, presence_score, attention_score, away_count, looking_away_count, head_down_count, reading_writing_time, total_away_time, metadata } = report;
  const totalLookingAwayTime = metadata?.total_looking_away_time || 0;
  const totalHeadDownTime = metadata?.total_head_down_time || 0;
  const lowConfidenceTime = metadata?.low_confidence_time || 0;
  if (focus_score >= 90) {
    let msg = "Tuy\u1EC7t v\u1EDDi! B\u1EA1n \u0111\xE3 duy tr\xEC s\u1EF1 t\u1EADp trung c\u1EF1c k\u1EF3 \u1EA5n t\u01B0\u1EE3ng.";
    if (mode === "Study" && (reading_writing_time || 0) > 300) {
      msg += " B\u1EA1n \u0111\xE3 d\xE0nh nhi\u1EC1u th\u1EDDi gian \u0111\u1ECDc v\xE0 ghi ch\xE9p r\u1EA5t hi\u1EC7u qu\u1EA3.";
    }
    return msg + " Phong \u0111\u1ED9 \u0111\u1EC9nh cao!";
  }
  if (lowConfidenceTime > report.duration_seconds * 0.3) {
    return "AI g\u1EB7p kh\xF3 kh\u0103n khi ph\xE2n t\xEDch do \xE1nh s\xE1ng ho\u1EB7c g\xF3c camera. H\xE3y \u0111i\u1EC1u ch\u1EC9nh camera \u0111\u1EC3 nh\u1EADn \u0111\u01B0\u1EE3c b\xE1o c\xE1o ch\xEDnh x\xE1c h\u01A1n nh\xE9.";
  }
  if (mode === "Study") {
    if ((reading_writing_time || 0) > report.duration_seconds * 0.5) {
      return "B\u1EA1n \u0111\xE3 d\xE0nh ph\u1EA7n l\u1EDBn th\u1EDDi gian \u0111\u1EC3 \u0111\u1ECDc v\xE0 ghi ch\xE9p. \u0110\xE2y l\xE0 h\xE0nh vi ph\xF9 h\u1EE3p v\u1EDBi Study Mode, h\xE3y ti\u1EBFp t\u1EE5c duy tr\xEC nh\xE9!";
    }
    if (total_away_time > 60) {
      return "B\u1EA1n r\u1EDDi kh\u1ECFi camera kh\xE1 nhi\u1EC1u l\u1EA7n. L\u1EA7n sau h\xE3y chu\u1EA9n b\u1ECB t\xE0i li\u1EC7u v\xE0 n\u01B0\u1EDBc u\u1ED1ng tr\u01B0\u1EDBc khi b\u1EAFt \u0111\u1EA7u \u0111\u1EC3 tr\xE1nh ng\u1EAFt qu\xE3ng nh\xE9.";
    }
  }
  if (mode === "Deep Work") {
    if (totalLookingAwayTime > 30) {
      return "B\u1EA1n th\u01B0\u1EDDng xuy\xEAn nh\xECn ra ngo\xE0i m\xE0n h\xECnh trong phi\xEAn Deep Work. H\xE3y th\u1EED t\u1EAFt th\xF4ng b\xE1o ho\u1EB7c ch\u1ECDn m\xF4i tr\u01B0\u1EDDng \xEDt xao nh\xE3ng h\u01A1n.";
    }
    if (totalHeadDownTime > 30) {
      return "B\u1EA1n c\xFAi xu\u1ED1ng kh\xE1 l\xE2u trong phi\xEAn Deep Work. N\u1EBFu \u0111ang d\xF9ng \u0111i\u1EC7n tho\u1EA1i, h\xE3y \u0111\u1EB7t \u0111i\u1EC7n tho\u1EA1i xa b\xE0n l\xE0m vi\u1EC7c \u0111\u1EC3 t\u1EADp trung t\u1ED1t h\u01A1n.";
    }
  }
  if (presence_score < 70) {
    return "M\u1EE9c \u0111\u1ED9 hi\u1EC7n di\u1EC7n c\u1EE7a b\u1EA1n kh\xE1 th\u1EA5p. S\u1EF1 hi\u1EC7n di\u1EC7n li\xEAn t\u1EE5c tr\u01B0\u1EDBc camera gi\xFAp AI h\u1ED7 tr\u1EE3 b\u1EA1n duy tr\xEC k\u1EF7 lu\u1EADt t\u1ED1t h\u01A1n.";
  }
  if (focus_score >= 70) {
    return "Kh\xE1 \u1ED5n! B\u1EA1n c\xF3 m\u1ED9t v\xE0i l\u1EA7n m\u1EA5t t\u1EADp trung nh\u1ECF, nh\u01B0ng t\u1ED5ng th\u1EC3 v\u1EABn r\u1EA5t hi\u1EC7u qu\u1EA3. Ti\u1EBFp t\u1EE5c ph\xE1t huy nh\xE9!";
  } else if (focus_score >= 50) {
    return "Phi\xEAn l\xE0m vi\u1EC7c c\xF3 kh\xE1 nhi\u1EC1u xao nh\xE3ng. H\xE3y th\u1EED d\u1ECDn d\u1EB9p kh\xF4ng gian v\xE0 ch\u1ECDn phi\xEAn ng\u1EAFn h\u01A1n \u0111\u1EC3 r\xE8n luy\u1EC7n s\u1EF1 t\u1EADp trung.";
  } else {
    return "M\u1EE9c \u0111\u1ED9 t\u1EADp trung kh\xE1 th\u1EA5p. \u0110\u1EEBng qu\xE1 kh\u1EAFt khe v\u1EDBi b\u1EA3n th\xE2n, h\xE3y ngh\u1EC9 ng\u01A1i m\u1ED9t ch\xFAt v\xE0 th\u1EED l\u1EA1i v\u1EDBi t\xE2m th\u1EBF tho\u1EA3i m\xE1i h\u01A1n nh\xE9.";
  }
};
var calculateXP = (report) => {
  const { focus_score, presence_score, attention_score, away_count } = report;
  let xp = 30;
  if (focus_score >= 90) xp = 200;
  else if (focus_score >= 80) xp = 160;
  else if (focus_score >= 70) xp = 120;
  else if (focus_score >= 50) xp = 80;
  if (presence_score >= 90 && attention_score >= 80) xp += 30;
  if (away_count === 0) xp += 20;
  return Math.min(xp, 250);
};
var createRoom = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized access.", 401);
    const { title, mode, durationMinutes, isPublic } = req.body;
    if (!title || !mode || !durationMinutes) {
      throw new AppError("Title, mode, and duration are required.", 400);
    }
    const expiresAt = new Date(Date.now() + (durationMinutes + 10) * 60 * 1e3).toISOString();
    let room = null;
    let lastError = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      try {
        room = await db.disciplineRooms.create({
          title,
          mode,
          duration_minutes: durationMinutes,
          invite_code: inviteCode,
          creator_id: userId,
          status: "WAITING_PARTNER",
          is_public: !!isPublic,
          expires_at: expiresAt
        });
        break;
      } catch (error) {
        lastError = error;
        if (error?.code !== "P2002") {
          throw error;
        }
      }
    }
    if (!room) {
      throw lastError || new AppError("Could not create a unique invite code. Please try again.", 500);
    }
    await db.roomParticipants.create({
      room_id: room.id,
      user_id: userId,
      role: "CREATOR"
    });
    res.status(201).json({ success: true, room });
  } catch (error) {
    next(error);
  }
};
var joinRoom = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized access.", 401);
    const { inviteCode, roomId } = req.body;
    if (!inviteCode && !roomId) throw new AppError("Invite code or Room ID is required.", 400);
    let room;
    if (inviteCode) {
      room = await db.disciplineRooms.findByInviteCode(inviteCode.toUpperCase());
    } else {
      room = await db.disciplineRooms.findUnique(roomId);
    }
    if (!room) throw new AppError("Room not found.", 404);
    if (room.status !== "WAITING_PARTNER") {
      throw new AppError("Room is no longer waiting for participants.", 400);
    }
    const participants = await db.roomParticipants.findManyByRoomId(room.id);
    if (participants.length >= 2) {
      throw new AppError("Room is full.", 400);
    }
    const alreadyIn = participants.find((p) => p.user_id === userId);
    if (alreadyIn) {
      res.status(200).json({ success: true, room });
      return;
    }
    await db.roomParticipants.create({
      room_id: room.id,
      user_id: userId,
      role: "PARTNER"
    });
    const updatedRoom = await db.disciplineRooms.update(room.id, {
      status: "LOBBY"
    });
    await db.roomMessages.create({
      room_id: room.id,
      sender_id: null,
      type: "SYSTEM",
      event_type: null,
      message: "Partner \u0111\xE3 tham gia ph\xF2ng. H\xE3y trao \u0111\u1ED5i m\u1EE5c ti\xEAu tr\u01B0\u1EDBc khi b\u1EAFt \u0111\u1EA7u phi\xEAn."
    });
    res.status(200).json({ success: true, room: updatedRoom });
  } catch (error) {
    next(error);
  }
};
var getWaitingRooms = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized access.", 401);
    const rooms = await db.disciplineRooms.findWaitingPublic();
    const filteredRooms = rooms.filter((room) => {
      return !room.participants.some((p) => p.user_id === userId);
    });
    res.status(200).json({ success: true, data: filteredRooms });
  } catch (error) {
    next(error);
  }
};
var getRoom = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized access.", 401);
    const { id } = req.params;
    const room = await db.disciplineRooms.findUnique(id);
    if (!room) throw new AppError("Room not found.", 404);
    res.status(200).json({ success: true, room });
  } catch (error) {
    next(error);
  }
};
var startRoom = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized access.", 401);
    const { id } = req.params;
    const room = await db.disciplineRooms.findUnique(id);
    if (!room) throw new AppError("Room not found.", 404);
    if (room.creator_id !== userId) {
      throw new AppError("Only the creator can start the room.", 403);
    }
    const participants = await db.roomParticipants.findManyByRoomId(id);
    if (participants.length < 2) {
      throw new AppError("Please wait for your partner before opening the lobby.", 400);
    }
    const updatedRoom = await db.disciplineRooms.update(id, {
      status: "LOBBY"
    });
    res.status(200).json({ success: true, room: updatedRoom });
  } catch (error) {
    next(error);
  }
};
var heartbeat = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized access.", 401);
    const { id } = req.params;
    const room = await db.disciplineRooms.findUnique(id);
    if (!room) throw new AppError("Room not found.", 404);
    res.status(200).json({ success: true, status: room.status });
  } catch (error) {
    next(error);
  }
};
var endRoom = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized access.", 401);
    const { id } = req.params;
    const {
      durationSeconds,
      presenceScore,
      focusScore,
      attentionScore,
      awayCount,
      lookingAwayCount,
      headDownCount,
      readingWritingTime,
      totalAwayTime,
      aiConfidence,
      metadata
    } = req.body;
    const room = await db.disciplineRooms.findUnique(id);
    if (!room) throw new AppError("Room not found.", 404);
    const reportData = {
      duration_seconds: durationSeconds,
      presence_score: presenceScore,
      focus_score: focusScore,
      attention_score: attentionScore,
      away_count: awayCount,
      looking_away_count: lookingAwayCount,
      head_down_count: headDownCount,
      reading_writing_time: readingWritingTime,
      total_away_time: totalAwayTime,
      ai_confidence: aiConfidence,
      metadata: metadata || null
    };
    const xpEarned = calculateXP(reportData);
    const aiInsight = getAIInsight(reportData, room.mode);
    const report = await db.sessionReports.create({
      room_id: id,
      user_id: userId,
      ...reportData,
      xp_earned: xpEarned,
      ai_insight: aiInsight
    });
    await db.roomParticipants.updateByRoomAndUser(id, userId, {
      left_at: (/* @__PURE__ */ new Date()).toISOString(),
      final_focus_score: focusScore,
      xp_earned: xpEarned
    });
    const user = await db.users.findUnique({ id: userId });
    if (user) {
      const currentXP = user.total_xp || 0;
      const nextXP = currentXP + xpEarned;
      const nextLevel = getLevelFromXP(nextXP).level;
      await db.users.update(userId, {
        total_xp: nextXP,
        level: nextLevel
      });
    }
    if (room.creator_id === userId) {
      await db.disciplineRooms.update(id, {
        status: "COMPLETED",
        ended_at: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    res.status(200).json({ success: true, report });
  } catch (error) {
    next(error);
  }
};
var uploadFrame = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false });
      return;
    }
    const { id } = req.params;
    const {
      frame,
      status,
      focusScore,
      attentionScore,
      presenceScore,
      totalFocusedTime,
      totalReadingWritingTime,
      totalAwayTime,
      currentAlertType,
      lastEventType,
      aiConfidence,
      clientId
    } = req.body;
    if (!frame) {
      res.status(400).json({ success: false, message: "frame required" });
      return;
    }
    const key = clientId || userId;
    if (!frameStore.has(id)) frameStore.set(id, /* @__PURE__ */ new Map());
    frameStore.get(id).set(key, {
      frame,
      status: status || "Focused",
      focusScore: focusScore || 100,
      attentionScore: attentionScore || 100,
      presenceScore: presenceScore || 100,
      totalFocusedTime,
      totalReadingWritingTime,
      totalAwayTime,
      currentAlertType,
      lastEventType,
      aiConfidence,
      userId,
      ts: Date.now()
    });
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};
var getPartnerFrame = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false });
      return;
    }
    const { id } = req.params;
    const myClientId = req.query.clientId || "";
    const roomFrames = frameStore.get(id);
    if (!roomFrames) {
      res.status(200).json({ success: true, frame: null, status: "Camera Off", focusScore: 100 });
      return;
    }
    for (const [cid, data] of roomFrames.entries()) {
      if (cid !== myClientId) {
        const age = Date.now() - data.ts;
        if (age > 4e3) {
          res.status(200).json({
            success: true,
            frame: null,
            status: "Camera Off",
            focusScore: data.focusScore,
            presenceScore: data.presenceScore,
            awayCount: data.awayCount
          });
        } else {
          res.status(200).json({
            success: true,
            frame: data.frame,
            status: data.status,
            focusScore: data.focusScore,
            attentionScore: data.attentionScore,
            presenceScore: data.presenceScore,
            totalFocusedTime: data.totalFocusedTime,
            totalReadingWritingTime: data.totalReadingWritingTime,
            totalAwayTime: data.totalAwayTime,
            awayCount: data.awayCount,
            currentAlertType: data.currentAlertType,
            lastEventType: data.lastEventType,
            aiConfidence: data.aiConfidence
          });
        }
        return;
      }
    }
    res.status(200).json({ success: true, frame: null, status: "Camera Off", focusScore: 100 });
  } catch (error) {
    next(error);
  }
};
var getReport = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized access.", 401);
    const { id } = req.params;
    const report = await db.sessionReports.findByRoomAndUser(id, userId);
    if (!report) throw new AppError("Report not found.", 404);
    res.status(200).json({ success: true, report });
  } catch (error) {
    next(error);
  }
};
var getMessages = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized access.", 401);
    const { id } = req.params;
    const { after } = req.query;
    const messages = await db.roomMessages.findManyByRoomId(id, after);
    res.status(200).json({ success: true, messages });
  } catch (error) {
    next(error);
  }
};
var postMessage = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized access.", 401);
    const { id } = req.params;
    const { message, type, eventType } = req.body;
    if (!message) {
      throw new AppError("Message content is required.", 400);
    }
    const roomMessage = await db.roomMessages.create({
      room_id: id,
      sender_id: type === "SYSTEM" ? null : userId,
      type: type || "USER",
      event_type: eventType || null,
      message
    });
    res.status(201).json({ success: true, message: roomMessage });
  } catch (error) {
    next(error);
  }
};
var setGoal = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized access.", 401);
    const { id } = req.params;
    const { goal } = req.body;
    if (goal === void 0 || goal === null) {
      throw new AppError("Goal is required.", 400);
    }
    const trimmedGoal = String(goal).trim().substring(0, 100);
    if (String(goal).length > 100) {
      throw new AppError("Goal must be 100 characters or less.", 400);
    }
    const room = await db.disciplineRooms.findUnique(id);
    if (!room) throw new AppError("Room not found.", 404);
    const participants = await db.roomParticipants.findManyByRoomId(id);
    const userParticipant = participants.find((p) => p.user_id === userId);
    if (!userParticipant) {
      throw new AppError("You are not a participant in this room.", 403);
    }
    await db.roomParticipants.updateByRoomAndUser(id, userId, { goal: trimmedGoal });
    const user = await db.users.findUnique({ id: userId });
    const userName = user?.name || "User";
    if (trimmedGoal) {
      await db.roomMessages.create({
        room_id: id,
        sender_id: null,
        type: "SYSTEM",
        event_type: null,
        message: `\u{1F3AF} ${userName} \u0111\xE3 \u0111\u1EB7t m\u1EE5c ti\xEAu: "${trimmedGoal}"`
      });
    }
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};
var setReady = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized access.", 401);
    const { id } = req.params;
    const { ready } = req.body;
    if (ready === void 0) {
      throw new AppError("Ready state is required.", 400);
    }
    const room = await db.disciplineRooms.findUnique(id);
    if (!room) throw new AppError("Room not found.", 404);
    if (room.status !== "LOBBY" && room.status !== "START_CONFIRM") {
      throw new AppError("Room is not in lobby phase.", 400);
    }
    const participants = await db.roomParticipants.findManyByRoomId(id);
    const userParticipant = participants.find((p) => p.user_id === userId);
    if (!userParticipant) {
      throw new AppError("You are not a participant in this room.", 403);
    }
    await db.roomParticipants.updateByRoomAndUser(id, userId, {
      is_ready: !!ready,
      ready_at: ready ? (/* @__PURE__ */ new Date()).toISOString() : null
    });
    const user = await db.users.findUnique({ id: userId });
    const userName = user?.name || "User";
    if (ready) {
      await db.roomMessages.create({
        room_id: id,
        sender_id: null,
        type: "SYSTEM",
        event_type: "START_REQUESTED",
        message: `${userName} \u0111\xE3 x\xE1c nh\u1EADn b\u1EAFt \u0111\u1EA7u phi\xEAn.`
      });
    } else {
      await db.roomMessages.create({
        room_id: id,
        sender_id: null,
        type: "SYSTEM",
        event_type: "START_CANCELLED",
        message: `${userName} mu\u1ED1n ch\u1EDD th\xEAm m\u1ED9t ch\xFAt.`
      });
    }
    const updatedParticipants = await db.roomParticipants.findManyByRoomId(id);
    const readyCount = updatedParticipants.filter((p) => p.is_ready).length;
    if (readyCount === 2) {
      await db.disciplineRooms.update(id, {
        status: "ACTIVE",
        started_at: (/* @__PURE__ */ new Date()).toISOString()
      });
      await db.roomMessages.create({
        room_id: id,
        sender_id: null,
        type: "SYSTEM",
        event_type: "SESSION_STARTED",
        message: "C\u1EA3 hai \u0111\xE3 x\xE1c nh\u1EADn. Phi\xEAn t\u1EADp trung s\u1EBD b\u1EAFt \u0111\u1EA7u sau v\xE0i gi\xE2y..."
      });
    } else if (readyCount === 1) {
      await db.disciplineRooms.update(id, {
        status: "START_CONFIRM"
      });
    } else {
      await db.disciplineRooms.update(id, {
        status: "LOBBY"
      });
    }
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};
var leaveRoom = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized access.", 401);
    const { id } = req.params;
    const room = await db.disciplineRooms.findUnique(id);
    if (!room) throw new AppError("Room not found.", 404);
    const participants = await db.roomParticipants.findManyByRoomId(id);
    const userParticipant = participants.find((p) => p.user_id === userId);
    if (!userParticipant) {
      throw new AppError("You are not a participant in this room.", 403);
    }
    if (userParticipant.role === "CREATOR") {
      await db.disciplineRooms.update(id, { status: "CANCELLED" });
      await db.roomMessages.create({
        room_id: id,
        sender_id: null,
        type: "SYSTEM",
        event_type: null,
        message: "\u26A0\uFE0F Ch\u1EE7 ph\xF2ng \u0111\xE3 r\u1EDDi ph\xF2ng. Ph\xF2ng h\u1ECDc \u0111\xE3 b\u1ECB h\u1EE7y."
      });
    } else {
      await db.roomParticipants.deleteByRoomAndUser(id, userId);
      await db.disciplineRooms.update(id, { status: "WAITING_PARTNER" });
      const creatorParticipant = participants.find((p) => p.role === "CREATOR");
      if (creatorParticipant) {
        await db.roomParticipants.updateByRoomAndUser(id, creatorParticipant.user_id, {
          is_ready: false
        });
      }
      await db.roomMessages.create({
        room_id: id,
        sender_id: null,
        type: "SYSTEM",
        event_type: null,
        message: `\u26A0\uFE0F Partner \u0111\xE3 r\u1EDDi kh\u1ECFi ph\xF2ng. B\u1EA1n c\xF3 th\u1EC3 ch\u1EDD ng\u01B0\u1EDDi kh\xE1c tham gia ho\u1EB7c t\u1EA1o ph\xF2ng m\u1EDBi.`
      });
    }
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

// src/routes/disciplineRoom.ts
var router9 = Router9();
router9.use(authMiddleware);
router9.post("/create", createRoom);
router9.post("/join", joinRoom);
router9.get("/waiting", getWaitingRooms);
router9.get("/:id", getRoom);
router9.post("/:id/start", startRoom);
router9.post("/:id/heartbeat", heartbeat);
router9.post("/:id/end", endRoom);
router9.get("/:id/report", getReport);
router9.post("/:id/goal", setGoal);
router9.post("/:id/ready", setReady);
router9.post("/:id/leave", leaveRoom);
router9.get("/:id/messages", getMessages);
router9.post("/:id/messages", postMessage);
router9.post("/:id/frame", uploadFrame);
router9.get("/:id/partner-frame", getPartnerFrame);
var disciplineRoom_default = router9;

// src/express-app.ts
var app = express();
app.use(express.json({ limit: "2mb" }));
app.use("/api/auth", auth_default);
app.use("/api/friends", friends_default);
app.use("/api/goals", goals_default);
app.use("/api/stats", stats_default);
app.use("/api/groups", groups_default);
app.use("/api/ai", ai_default);
app.use("/api/freeze", freeze_default);
app.use("/api/xp", xp_default);
app.use("/api/discipline-room", disciplineRoom_default);
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
