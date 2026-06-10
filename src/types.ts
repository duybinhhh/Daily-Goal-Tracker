// src/types.ts

export interface User {
  id: string;
  email: string;
  name: string;
  timezone: string;
  onboarding_completed?: boolean;
  show_activity_in_feed?: boolean;
  created_at?: string;
  total_xp?: number;
  level?: number;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface FriendUser {
  id: string;
  name: string;
  email: string;
  level: number;
  streak: number;
  isFollowing: boolean;
  avatarInitials: string;
}

export interface FriendActivity {
  id: string;
  userId: string;
  userName: string;
  goalTitle: string;
  type: string;
  createdAt: string;
  avatarInitials: string;
}

export interface FriendStats {
  followingCount: number;
  followersCount: number;
}

export interface Streak {
  id: string;
  user_id: string;
  goal_id: string;
  current_streak: number;
  longest_streak: number;
  last_completed_at: string | null;
}

export interface StreakFreeze {
  id: string;
  user_id: string;
  goal_id: string;
  frozen_date: string;
  created_at: string;
}

export interface FreezeToken {
  id: string;
  user_id: string;
  tokens_left: number;
  month_year: string;
}

export interface GoalLog {
  id: string;
  goal_id: string;
  user_id: string;
  completed_at: string;
  note: string | null;
  created_at: string;
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
  is_archived?: boolean;
  archived_at?: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  streak?: Streak;
  group_id?: string | null;
  reminder_time?: string | null;  // "HH:mm" hoặc null
}

export interface DashboardStats {
  totalGoals: number;
  activeGoals: number;
  completedGoalsToday: number;
  overallCompletionRate: number;
  bestCurrentStreak: number;
  bestLongestStreak: number;
}

export interface HistoryData {
  date: string; // YYYY-MM-DD
  count: number;
  logs: GoalLog[];
}
