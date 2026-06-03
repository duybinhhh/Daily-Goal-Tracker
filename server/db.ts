// server/db.ts
import fs from "fs";
import path from "path";

// Define schema types corresponding exactly to Prisma models
export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string;
  target_count: number;
  current_count: number;
  frequency: string; // daily, weekly, monthly
  status: string; // active, paused, completed
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface GoalLog {
  id: string;
  goal_id: string;
  user_id: string;
  completed_at: string;
  note: string | null;
  created_at: string;
}

export interface Streak {
  id: string;
  user_id: string;
  goal_id: string;
  current_streak: number;
  longest_streak: number;
  last_completed_at: string | null;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface DatabaseSchema {
  users: User[];
  goals: Goal[];
  logs: GoalLog[];
  streaks: Streak[];
  notifications: Notification[];
}

const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "db.json");

class LocalDB {
  private schema: DatabaseSchema = {
    users: [],
    goals: [],
    logs: [],
    streaks: [],
    notifications: [],
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const data = fs.readFileSync(DB_FILE, "utf-8");
        this.schema = JSON.parse(data);
        // Ensure all arrays exist
        this.schema.users = this.schema.users || [];
        this.schema.goals = this.schema.goals || [];
        this.schema.logs = this.schema.logs || [];
        this.schema.streaks = this.schema.streaks || [];
        this.schema.notifications = this.schema.notifications || [];
      } else {
        this.save();
      }
    } catch (error) {
      console.error("Failed to initialize database, using memory-store.", error);
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.schema, null, 2), "utf-8");
    } catch (error) {
      console.error("Failed to save data on database", error);
    }
  }

  // Users Helper Operations
  public users = {
    findUnique: async (where: { email?: string; id?: string }) => {
      return this.schema.users.find(
        (u) =>
          (where.email && u.email === where.email) ||
          (where.id && u.id === where.id)
      ) || null;
    },
    create: async (data: Omit<User, "id" | "created_at" | "updated_at"> & { timezone?: string }) => {
      const now = new Date().toISOString();
      const newUser: User = {
        id: crypto.randomUUID(),
        email: data.email,
        password_hash: data.password_hash,
        name: data.name,
        timezone: data.timezone || "UTC",
        created_at: now,
        updated_at: now,
      };
      this.schema.users.push(newUser);
      this.save();
      return newUser;
    },
    update: async (id: string, updateData: Partial<Omit<User, "id" | "created_at">>) => {
      const index = this.schema.users.findIndex((u) => u.id === id);
      if (index === -1) throw new Error("User not found");
      const updated = {
        ...this.schema.users[index],
        ...updateData,
        updated_at: new Date().toISOString(),
      };
      this.schema.users[index] = updated;
      this.save();
      return updated;
    },
  };

  // Goals CRUD Operations
  public goals = {
    findMany: async (where?: { user_id?: string; status?: string }) => {
      let result = this.schema.goals;
      if (where) {
        if (where.user_id) result = result.filter((g) => g.user_id === where.user_id);
        if (where.status) result = result.filter((g) => g.status === where.status);
      }
      return result;
    },
    findUnique: async (where: { id: string }) => {
      return this.schema.goals.find((g) => g.id === where.id) || null;
    },
    create: async (data: Omit<Goal, "id" | "created_at" | "updated_at" | "current_count" | "status">) => {
      const now = new Date().toISOString();
      const newGoal: Goal = {
        id: crypto.randomUUID(),
        user_id: data.user_id,
        title: data.title,
        description: data.description || null,
        category: data.category,
        target_count: data.target_count,
        current_count: 0,
        frequency: data.frequency,
        status: "active",
        due_date: data.due_date || null,
        created_at: now,
        updated_at: now,
      };
      this.schema.goals.push(newGoal);
      this.save();
      return newGoal;
    },
    update: async (id: string, updateData: Partial<Omit<Goal, "id" | "user_id" | "created_at">>) => {
      const index = this.schema.goals.findIndex((g) => g.id === id);
      if (index === -1) throw new Error("Goal not found");
      const updated = {
        ...this.schema.goals[index],
        ...updateData,
        updated_at: new Date().toISOString(),
      };
      this.schema.goals[index] = updated;
      this.save();
      return updated;
    },
    delete: async (id: string) => {
      const index = this.schema.goals.findIndex((g) => g.id === id);
      if (index === -1) throw new Error("Goal not found");
      const deleted = this.schema.goals[index];
      this.schema.goals = this.schema.goals.filter((g) => g.id !== id);
      // Clean corresponding streaks and logs as Cascade Delete behavior
      this.schema.logs = this.schema.logs.filter((l) => l.goal_id !== id);
      this.schema.streaks = this.schema.streaks.filter((s) => s.goal_id !== id);
      this.save();
      return deleted;
    },
  };

  // Goal Logs helpers
  public logs = {
    findMany: async (where?: { goal_id?: string; user_id?: string }) => {
      let result = this.schema.logs;
      if (where) {
        if (where.goal_id) result = result.filter((l) => l.goal_id === where.goal_id);
        if (where.user_id) result = result.filter((l) => l.user_id === where.user_id);
      }
      return result;
    },
    create: async (data: Omit<GoalLog, "id" | "created_at">) => {
      const now = new Date().toISOString();
      const newLog: GoalLog = {
        id: crypto.randomUUID(),
        goal_id: data.goal_id,
        user_id: data.user_id,
        completed_at: data.completed_at || now,
        note: data.note || null,
        created_at: now,
      };
      this.schema.logs.push(newLog);
      this.save();
      return newLog;
    },
  };

  // Streaks helpers
  public streaks = {
    findUnique: async (where: { goal_id: string }) => {
      return this.schema.streaks.find((s) => s.goal_id === where.goal_id) || null;
    },
    findMany: async (where?: { user_id: string }) => {
      let result = this.schema.streaks;
      if (where?.user_id) {
        result = result.filter((s) => s.user_id === where.user_id);
      }
      return result;
    },
    create: async (data: Omit<Streak, "id" | "current_streak" | "longest_streak" | "last_completed_at">) => {
      const newStreak: Streak = {
        id: crypto.randomUUID(),
        user_id: data.user_id,
        goal_id: data.goal_id,
        current_streak: 0,
        longest_streak: 0,
        last_completed_at: null,
      };
      this.schema.streaks.push(newStreak);
      this.save();
      return newStreak;
    },
    update: async (id: string, updateData: Partial<Omit<Streak, "id" | "user_id" | "goal_id">>) => {
      const index = this.schema.streaks.findIndex((s) => s.id === id);
      if (index === -1) throw new Error("Streak not found");
      const updated = {
        ...this.schema.streaks[index],
        ...updateData,
      };
      this.schema.streaks[index] = updated;
      this.save();
      return updated;
    },
    upsert: async (goal_id: string, user_id: string, updates: Partial<Streak>) => {
      const index = this.schema.streaks.findIndex((s) => s.goal_id === goal_id);
      if (index === -1) {
        // Create
        const newStreak: Streak = {
          id: crypto.randomUUID(),
          user_id,
          goal_id,
          current_streak: updates.current_streak ?? 1,
          longest_streak: updates.longest_streak ?? 1,
          last_completed_at: updates.last_completed_at ?? new Date().toISOString(),
        };
        this.schema.streaks.push(newStreak);
        this.save();
        return newStreak;
      } else {
        // Update
        const updated = {
          ...this.schema.streaks[index],
          ...updates,
        };
        this.schema.streaks[index] = updated;
        this.save();
        return updated;
      }
    },
  };

  // Notifications Helpers
  public notifications = {
    findMany: async (where: { user_id: string; is_read?: boolean }) => {
      let result = this.schema.notifications.filter((n) => n.user_id === where.user_id);
      if (where.is_read !== undefined) {
        result = result.filter((n) => n.is_read === where.is_read);
      }
      return result;
    },
    create: async (data: Omit<Notification, "id" | "created_at" | "is_read">) => {
      const now = new Date().toISOString();
      const newNotification: Notification = {
        id: crypto.randomUUID(),
        user_id: data.user_id,
        type: data.type,
        message: data.message,
        is_read: false,
        created_at: now,
      };
      this.schema.notifications.push(newNotification);
      this.save();
      return newNotification;
    },
    markAllAsRead: async (user_id: string) => {
      this.schema.notifications.forEach((n) => {
        if (n.user_id === user_id) {
          n.is_read = true;
        }
      });
      this.save();
    },
  };
}

export const db = new LocalDB();
