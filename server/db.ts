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
    show_activity_in_feed: u.show_activity_in_feed ?? true,
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

function mapGroupMessage(m: any) {
  if (!m) return null;
  return {
    ...m,
    created_at: m.created_at.toISOString(),
    updated_at: m.updated_at.toISOString(),
    sender: m.sender ? {
      id: m.sender.id,
      name: m.sender.name,
      avatarInitials: m.sender.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2)
    } : null,
    reactions: m.reactions || [],
  };
}

function mapDisciplineRoom(r: any) {
  if (!r) return null;
  return {
    ...r,
    started_at: r.started_at ? r.started_at.toISOString() : null,
    ended_at: r.ended_at ? r.ended_at.toISOString() : null,
    expires_at: r.expires_at ? r.expires_at.toISOString() : null,
    created_at: r.created_at.toISOString(),
    updated_at: r.updated_at.toISOString(),
    participants: r.participants ? r.participants.map(mapRoomParticipant) : [],
  };
}

function mapRoomParticipant(p: any) {
  if (!p) return null;
  return {
    ...p,
    joined_at: p.joined_at.toISOString(),
    left_at: p.left_at ? p.left_at.toISOString() : null,
    ready_at: p.ready_at ? p.ready_at.toISOString() : null,
    user: p.user ? {
      id: p.user.id,
      name: p.user.name,
      email: p.user.email,
    } : null,
  };
}

function mapSessionReport(r: any) {
  if (!r) return null;
  return {
    ...r,
    created_at: r.created_at.toISOString(),
    metadata: r.metadata ? (typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata) : null,
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
        show_activity_in_feed?: boolean;
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

  public friends = {
    search: async (currentUserId: string, query: string) => {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
          id: { not: currentUserId },
        },
        select: {
          id: true,
          name: true,
          email: true,
          level: true,
          total_xp: true,
          followers: {
            where: { follower_id: currentUserId },
          },
          goals: {
            select: {
              streaks: {
                select: {
                  current_streak: true,
                  longest_streak: true,
                }
              }
            }
          }
        },
        take: 20,
      });

      return users.map((u: any) => {
        // Find max streak across all goals
        let maxStreak = 0;
        u.goals.forEach((g: any) => {
          g.streaks.forEach((s: any) => {
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
          avatarInitials: u.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2),
        };
      });
    },
    follow: async (followerId: string, followingId: string) => {
      if (followerId === followingId) throw new Error("You cannot follow yourself.");
      return await prisma.follow.upsert({
        where: {
          follower_id_following_id: {
            follower_id: followerId,
            following_id: followingId,
          },
        },
        update: {},
        create: {
          follower_id: followerId,
          following_id: followingId,
        },
      });
    },
    unfollow: async (followerId: string, followingId: string) => {
      return await prisma.follow.deleteMany({
        where: {
          follower_id: followerId,
          following_id: followingId,
        },
      });
    },
    getFeed: async (userId: string) => {
      // Get IDs of users being followed
      const following = await prisma.follow.findMany({
        where: { follower_id: userId },
        select: { following_id: true },
      });
      const followingIds = following.map((f: any) => f.following_id);

      // Get latest check-ins from those users who have privacy enabled
      const logs = await prisma.goalLog.findMany({
        where: {
          user_id: { in: followingIds },
          user: { show_activity_in_feed: true },
        },
        include: {
          user: true,
          goal: true,
        },
        orderBy: { completed_at: "desc" },
        take: 5,
      });

      return logs.map((l: any) => ({
        id: l.id,
        userId: l.user_id,
        userName: l.user.name,
        goalTitle: l.goal.title,
        type: "checkin",
        createdAt: l.completed_at.toISOString(),
        avatarInitials: l.user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2),
      }));
    },
    getStats: async (userId: string) => {
      const [followingCount, followersCount] = await Promise.all([
        prisma.follow.count({ where: { follower_id: userId } }),
        prisma.follow.count({ where: { following_id: userId } }),
      ]);
      return { followingCount, followersCount };
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
      group_id?: string | null;
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
          group_id: data.group_id || null,
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
      is_archived?: boolean;
      archived_at?: string | null;
      due_date?: string | null;
      reminder_time?: string | null;
      group_id?: string | null;
    }) => {
      const prismaUpdate: any = { ...updateData };
      if (updateData.due_date !== undefined) {
        prismaUpdate.due_date = updateData.due_date ? new Date(updateData.due_date) : null;
      }
      if (updateData.archived_at !== undefined) {
        prismaUpdate.archived_at = updateData.archived_at ? new Date(updateData.archived_at) : null;
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
    findByInviteCode: async (inviteCode: string) => {
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
    create: async (data: {
      name: string;
      description?: string | null;
      creator_id: string;
      goal_title: string;
      goal_category: string;
      goal_target_count: number;
      goal_frequency: string;
      max_members?: number;
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
          max_members: data.max_members ?? 20,
        },
      });
      return created;
    },
    update: async (id: string, data: {
      name?: string;
      description?: string | null;
      invite_code?: string | null;
      invite_expires_at?: Date | null;
      max_members?: number;
    }) => {
      const updated = await prisma.habitGroup.update({
        where: { id },
        data,
      });
      return updated;
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

  public groupMessages = {
    findMany: async (where: { group_id: string }, take: number = 30) => {
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
      // Reverse to get chronological order for chat
      return messages.reverse().map(mapGroupMessage);
    },
    findUnique: async (id: string) => {
      const msg = await prisma.groupMessage.findUnique({
        where: { id },
        include: {
          sender: true,
          reactions: true
        }
      });
      return mapGroupMessage(msg);
    },
    create: async (data: { group_id: string; sender_id: string; content: string }) => {
      const created = await prisma.groupMessage.create({
        data: {
          group_id: data.group_id,
          sender_id: data.sender_id,
          content: data.content,
        },
        include: {
          sender: true,
          reactions: true
        }
      });
      return mapGroupMessage(created);
    },
    delete: async (id: string) => {
      return await prisma.groupMessage.delete({ where: { id } });
    }
  };

  public messageReactions = {
    findUnique: async (where: { message_id: string; user_id: string; emoji: string }) => {
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
    create: async (data: { message_id: string; user_id: string; emoji: string }) => {
      return await prisma.messageReaction.create({
        data: {
          message_id: data.message_id,
          user_id: data.user_id,
          emoji: data.emoji,
        }
      });
    },
    delete: async (id: string) => {
      return await prisma.messageReaction.delete({ where: { id } });
    },
    toggle: async (message_id: string, user_id: string, emoji: string) => {
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

  public groupChatNotificationLogs = {
    countToday: async (user_id: string) => {
      const today = new Date();
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
    create: async (user_id: string, group_id: string) => {
      return await prisma.groupChatNotificationLog.create({
        data: { user_id, group_id }
      });
    }
  };

  public disciplineRooms = {
    findUnique: async (id: string) => {
      const room = await prisma.disciplineRoom.findUnique({
        where: { id },
        include: { participants: { include: { user: true } } }
      });
      return mapDisciplineRoom(room);
    },
    findByInviteCode: async (inviteCode: string) => {
      const room = await prisma.disciplineRoom.findUnique({
        where: { invite_code: inviteCode },
        include: { participants: { include: { user: true } } }
      });
      return mapDisciplineRoom(room);
    },
    findWaitingPublic: async () => {
      const now = new Date();
      const whereClause: any = {
          status: "WAITING_PARTNER",
          is_public: true,
          OR: [
            { expires_at: null },
            { expires_at: { gt: now } }
          ]
        };
      const rooms = await prisma.disciplineRoom.findMany({
        where: whereClause,
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
    create: async (data: { 
      title: string; 
      mode: string; 
      duration_minutes: number; 
      invite_code: string; 
      creator_id: string; 
      status: string;
      is_public?: boolean;
      expires_at?: string | null;
    }) => {
      const prismaData: any = { ...data };
      if (data.expires_at) prismaData.expires_at = new Date(data.expires_at);
      const created = await prisma.disciplineRoom.create({
        data: prismaData,
        include: { participants: { include: { user: true } } }
      });
      return mapDisciplineRoom(created);
    },
    update: async (id: string, data: { status?: string; started_at?: string; ended_at?: string; is_public?: boolean }) => {
      const prismaData: any = { ...data };
      if (data.started_at) prismaData.started_at = new Date(data.started_at);
      if (data.ended_at) prismaData.ended_at = new Date(data.ended_at);
      const updated = await prisma.disciplineRoom.update({
        where: { id },
        data: prismaData,
      });
      return mapDisciplineRoom(updated);
    }
  };

  public roomParticipants = {
    findManyByRoomId: async (roomId: string) => {
      const participants = await prisma.roomParticipant.findMany({
        where: { room_id: roomId },
        include: { user: true }
      });
      return participants.map(mapRoomParticipant);
    },
    create: async (data: { room_id: string; user_id: string; role: string }) => {
      const created = await prisma.roomParticipant.create({ data });
      return mapRoomParticipant(created);
    },
    updateByRoomAndUser: async (
      roomId: string, 
      userId: string, 
      data: { 
        left_at?: string; 
        final_focus_score?: number; 
        xp_earned?: number; 
        goal?: string | null; 
        is_ready?: boolean;
        ready_at?: string | null;
      }
    ) => {
      const prismaData: any = { ...data };
      if (data.left_at) prismaData.left_at = new Date(data.left_at);
      if (data.ready_at) prismaData.ready_at = new Date(data.ready_at);
      const updated = await prisma.roomParticipant.update({
        where: { room_id_user_id: { room_id: roomId, user_id: userId } },
        data: prismaData,
      });
      return mapRoomParticipant(updated);
    },
    deleteByRoomAndUser: async (roomId: string, userId: string) => {
      const deleted = await prisma.roomParticipant.delete({
        where: { room_id_user_id: { room_id: roomId, user_id: userId } }
      });
      return mapRoomParticipant(deleted);
    }
  };

  public roomMessages = {
    findManyByRoomId: async (roomId: string, afterDate?: string) => {
      let whereClause: any = { room_id: roomId };
      if (afterDate) {
        whereClause.created_at = { gt: new Date(afterDate) };
      }
      const messages = await (prisma as any).roomMessage.findMany({
        where: whereClause,
        orderBy: { created_at: 'asc' },
        include: { sender: { select: { id: true, name: true } } }
      });
      return messages.map(m => ({
        ...m,
        created_at: m.created_at.toISOString(),
        senderName: m.sender?.name || null
      }));
    },
    create: async (data: { room_id: string; sender_id?: string; type: string; event_type?: string; message: string }) => {
      const created = await (prisma as any).roomMessage.create({
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

  public sessionReports = {
    create: async (data: { 
      room_id: string; 
      user_id: string; 
      duration_seconds: number; 
      presence_score: number; 
      focus_score: number; 
      attention_score?: number;
      away_count: number; 
      looking_away_count?: number;
      head_down_count?: number;
      reading_writing_time?: number;
      total_away_time?: number;
      ai_confidence?: number;
      xp_earned: number; 
      ai_insight: string;
      metadata?: any;
    }) => {
      const created = await prisma.sessionReport.create({ data });
      return mapSessionReport(created);
    },
    findByRoomAndUser: async (roomId: string, userId: string) => {
      const report = await prisma.sessionReport.findFirst({
        where: { room_id: roomId, user_id: userId }
      });
      return mapSessionReport(report);
    },
    findManyByRoomId: async (roomId: string) => {
      const reports = await prisma.sessionReport.findMany({
        where: { room_id: roomId },
        orderBy: { created_at: "asc" }
      });
      const userIds = Array.from(new Set(reports.map((report: any) => report.user_id)));
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true }
      });
      const usersById = new Map(users.map((user: any) => [user.id, user]));

      return reports.map((report: any) => {
        const mapped = mapSessionReport(report);
        return mapped ? {
          ...mapped,
          user: usersById.get(report.user_id) || null
        } : null;
      }).filter(Boolean);
    }
  };
}

export const db = new PrismaDB();

