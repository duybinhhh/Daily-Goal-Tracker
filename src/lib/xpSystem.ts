// ── XP Rules (AC-1) ──
export const XP_RULES = {
  CHECK_IN: 10,           // Mỗi lần check-in goal
  COMPLETE_DAY: 25,       // Hoàn thành tất cả goal trong ngày
  JOIN_GROUP: 30,         // Tham gia nhóm habit
  INVITE_FRIEND: 20,      // Mời bạn thành công (referral)
} as const;

// Streak milestone XP — cộng thêm khi đạt mốc streak (AC-1)
export const STREAK_MILESTONES: Record<number, number> = {
  3:   50,
  7:   100,
  14:  200,
  30:  300,
  60:  500,
  100: 750,
  365: 1000,
};

// ── 10 Levels (AC-2) ──
// XP_REQUIRED là tổng XP tích lũy để ĐẠT cấp đó
export const LEVELS = [
  { level: 1,  name: "Beginner",    icon: "🌱", xp_required: 0    },
  { level: 2,  name: "Explorer",    icon: "🔍", xp_required: 100  },
  { level: 3,  name: "Achiever",    icon: "⚡", xp_required: 300  },
  { level: 4,  name: "Challenger",  icon: "🎯", xp_required: 600  },
  { level: 5,  name: "Warrior",     icon: "⚔️", xp_required: 1000 },
  { level: 6,  name: "Champion",    icon: "🏆", xp_required: 1500 },
  { level: 7,  name: "Master",      icon: "🌟", xp_required: 2200 },
  { level: 8,  name: "Elite",       icon: "💎", xp_required: 3000 },
  { level: 9,  name: "Grandmaster", icon: "🔥", xp_required: 4000 },
  { level: 10, name: "Legend",      icon: "👑", xp_required: 5500 },
] as const;

export type LevelData = typeof LEVELS[number];

// Tính level từ total_xp
export function getLevelFromXP(totalXP: number): LevelData {
  // Tìm level cao nhất mà user đạt được (duyệt từ cao xuống thấp)
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVELS[i].xp_required) {
      return LEVELS[i];
    }
  }
  return LEVELS[0];
}

// XP hiện tại trong level này (đã đạt được bao nhiêu XP kể từ khi vào level)
export function getXPInCurrentLevel(totalXP: number): number {
  const current = getLevelFromXP(totalXP);
  return totalXP - current.xp_required;
}

// XP cần thêm để lên level tiếp theo
export function getXPToNextLevel(totalXP: number): number {
  const current = getLevelFromXP(totalXP);
  if (current.level === 10) return 0; // Max level
  const next = LEVELS[current.level]; // LEVELS[level] vì index = level-1+1 = level
  return next.xp_required - totalXP;
}

// % progress trong level hiện tại (0–100)
export function getLevelProgress(totalXP: number): number {
  const current = getLevelFromXP(totalXP);
  if (current.level === 10) return 100;
  const next = LEVELS[current.level];
  const xpInLevel = totalXP - current.xp_required;
  const xpSpanOfLevel = next.xp_required - current.xp_required;
  return Math.min(100, Math.round((xpInLevel / xpSpanOfLevel) * 100));
}

// Tính XP cho streak milestone (AC-1)
export function getStreakMilestoneXP(newStreak: number): number {
  return STREAK_MILESTONES[newStreak] ?? 0;
}
