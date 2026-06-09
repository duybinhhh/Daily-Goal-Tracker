import webpush from "web-push";
import { db } from "../../server/db";
import { syncAndResetGoalProgress } from "../controllers/goalController";

// Helper to format Date as YYYY-MM-DD in user's timezone
const getLocalDateString = (date: Date, timezone: string): string => {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const parts = formatter.formatToParts(date);
    const year = parts.find(p => p.type === "year")?.value;
    const month = parts.find(p => p.type === "month")?.value;
    const day = parts.find(p => p.type === "day")?.value;
    return `${year}-${month}-${day}`;
  } catch (e) {
    return date.toISOString().split("T")[0];
  }
};

// Helper to get the hour in user's timezone
const getLocalHour = (date: Date, timezone: string): number => {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const hour = parts.find(p => p.type === "hour")?.value;
    return hour ? parseInt(hour, 10) : date.getUTCHours();
  } catch (e) {
    return date.getUTCHours();
  }
};

// Helper to get HH:mm string in user's timezone
const getLocalTimeString = (date: Date, timezone: string): string => {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const hour = parts.find(p => p.type === "hour")?.value?.padStart(2, "0") ?? "00";
    const minute = parts.find(p => p.type === "minute")?.value?.padStart(2, "0") ?? "00";
    return `${hour}:${minute}`; // "HH:mm" — e.g. "08:30"
  } catch {
    const h = String(date.getUTCHours()).padStart(2, "0");
    const m = String(date.getUTCMinutes()).padStart(2, "0");
    return `${h}:${m}`;
  }
};

// Main check function
export async function checkAndSendReminders() {
  try {
    // 1. Fetch all users with active push subscriptions
    const users = await db.users.findMany({ has_push_subscription: true });
    if (users.length === 0) return;

    const now = new Date();

    for (const user of users) {
      if (!user.push_subscription) continue;

      const timezone = user.timezone || "UTC";
      const localHour = getLocalHour(now, timezone);
      const localTimeStr = getLocalTimeString(now, timezone);
      const localDateStr = getLocalDateString(now, timezone);
      
      const goals = await db.goals.findMany({ user_id: user.id, status: "active" });

      // ─────────────────────────────────────────────────────
      // PHẦN 1: Per-goal reminders (AC-3, AC-4, AC-5)
      // ─────────────────────────────────────────────────────
      for (const goal of goals) {
        // Chỉ xử lý goal có reminder_time riêng
        if (!goal.reminder_time) continue;

        // Kiểm tra đúng phút (so sánh "HH:mm")
        if (localTimeStr !== goal.reminder_time) continue;

        // AC-5: Kiểm tra goal đã hoàn thành hôm nay chưa
        const syncedGoal = await syncAndResetGoalProgress(goal, timezone);
        if (syncedGoal.current_count >= syncedGoal.target_count) {
          console.log(`[Reminder Scheduler] Goal "${goal.title}" already completed — skipping per-goal reminder.`);
          continue;
        }

        // Kiểm tra đã gửi per-goal reminder hôm nay chưa
        const existingNotifs = await db.notifications.findMany({ user_id: user.id });
        const alreadySentToday = existingNotifs.some(
          (n: any) =>
            n.message.includes(`per_goal_reminder:${goal.id}:`) &&
            n.created_at &&
            getLocalDateString(new Date(n.created_at), timezone) === localDateStr
        );

        if (alreadySentToday) {
          console.log(`[Reminder Scheduler] Per-goal reminder for "${goal.title}" already sent today — skipping.`);
          continue;
        }

        // AC-4: Gửi push notification với nội dung chuẩn
        try {
          const subscription = JSON.parse(user.push_subscription);
          const payload = JSON.stringify({
            title: "Nhắc nhở mục tiêu ⏰",
            body: `[${goal.title}] — Đừng quên mục tiêu của bạn hôm nay!`,
            icon: "/icon.png",
            badge: "/icon.png",
            data: { url: "/#/goals" },
          });

          await webpush.sendNotification(subscription, payload);
          console.log(`[Reminder Scheduler] Per-goal reminder sent: "${goal.title}" to user ${user.name}`);

          // Lưu record để dedup
          await db.notifications.create({
            user_id: user.id,
            type: "per_goal_reminder",
            message: `per_goal_reminder:${goal.id}:${goal.title}`,
          });
        } catch (pushError: any) {
          console.error(`[Reminder Scheduler] Push error for goal "${goal.title}":`, pushError.message);
          if (pushError.statusCode === 410 || pushError.statusCode === 404) {
            await db.users.update(user.id, { push_subscription: null });
          }
        }
      }

      // ─────────────────────────────────────────────────────
      // PHẦN 2: Nhắc chung 21h — GIỮ NGUYÊN LOGIC GỐC
      // Chỉ thay đổi: loại trừ các goal đã có reminder_time (AC-6)
      // ─────────────────────────────────────────────────────

      // Freeze risk reminder at 20h
      if (localHour === 20) {
        if (user.last_freeze_reminder_date !== localDateStr) {
          const atRiskGoals = [];
          for (const goal of goals) {
            // AC-6: skip goal has individual reminder
            if (goal.reminder_time) continue;

            const synced = await syncAndResetGoalProgress(goal, timezone);
            const streak = await db.streaks.findUnique({ goal_id: synced.id });
            const currentStreak = streak?.current_streak ?? 0;
            if (currentStreak > 0 && currentStreak < 5 && synced.current_count < synced.target_count) {
              atRiskGoals.push({ ...synced, currentStreak });
            }
          }

          if (atRiskGoals.length > 0) {
            const tokenRecord = await db.freezeTokens.findOrCreate(user.id);
            if (tokenRecord.tokens_left > 0) {
              const goalNames = atRiskGoals
                .sort((a, b) => b.currentStreak - a.currentStreak)
                .slice(0, 2)
                .map((goal) => `"${goal.title}"`)
                .join(", ");

              const payload = JSON.stringify({
                title: "Protect your streak!",
                body: `${goalNames} may lose a streak. You still have ${tokenRecord.tokens_left} Freeze Tokens.`,
                icon: "/icon.png",
                badge: "/icon.png",
                data: { url: "/#/goals" },
              });

              try {
                const subscription = JSON.parse(user.push_subscription);
                await webpush.sendNotification(subscription, payload);
                await db.users.update(user.id, { last_freeze_reminder_date: localDateStr });
              } catch (pushErr: any) {
                console.error(`[Freeze Reminder] Push failed for user ${user.id}:`, pushErr.message);
                if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
                  await db.users.update(user.id, { push_subscription: null });
                }
              }
            }
          }
        }
      }

      // Check if it's 21:00 (9:00 PM) or later in the user's local timezone
      if (localHour >= 21) {
        // Check if we already sent a reminder today
        if (user.last_reminder_sent_date === localDateStr) {
          continue;
        }

        let hasIncompleteDailyGoals = false;

        for (const goal of goals) {
          // AC-6: BỎ QUA goal đã cài reminder_time riêng
          if (goal.reminder_time) continue;

          // Sync and reset progress to ensure current day's count is updated
          const syncedGoal = await syncAndResetGoalProgress(goal, timezone);

          // We check only daily goals that are not yet completed
          if (syncedGoal.frequency === "daily" && syncedGoal.current_count < syncedGoal.target_count) {
            hasIncompleteDailyGoals = true;
            break;
          }
        }

        // 3. If there are incomplete daily goals, send the push notification
        if (hasIncompleteDailyGoals) {
          console.log(`[Reminder Scheduler] Sending active reminder to user: ${user.name} (${user.email})`);
          
          try {
            const subscription = JSON.parse(user.push_subscription);
            
            const payload = JSON.stringify({
              title: "Chống đứt chuỗi! 🔥",
              body: `Chào ${user.name}, bạn vẫn còn thói quen chưa hoàn thành hôm nay. Hoàn thành ngay để bảo vệ chuỗi Streak nhé!`,
              icon: "/icon.png",
              badge: "/icon.png",
              data: {
                url: "/"
              }
            });

            await webpush.sendNotification(subscription, payload);
            console.log(`[Reminder Scheduler] Reminder sent successfully to user: ${user.name}`);
            
            // Update the last reminder sent date to today
            await db.users.update(user.id, {
              last_reminder_sent_date: localDateStr
            });
          } catch (error: any) {
            console.error(`[Reminder Scheduler] Error sending push to user ${user.id}:`, error.message);
            
            // Clean up invalid or expired subscriptions (410 Gone / 404 Not Found)
            if (error.statusCode === 410 || error.statusCode === 404) {
              console.log(`[Reminder Scheduler] Push subscription expired for user ${user.name}. Removing from database.`);
              await db.users.update(user.id, {
                push_subscription: null
              });
            }
          }
        }
      }
    }
  } catch (err: any) {
    console.error("[Reminder Scheduler] Error in checkAndSendReminders job:", err.message);
  }
}

// Start the scheduler
export function startReminderScheduler(intervalMs: number = 60000) {
  console.log(`[Reminder Scheduler] Starting background active reminders job (every ${intervalMs / 1000}s)...`);
  
  // Run once on startup
  setTimeout(() => {
    checkAndSendReminders();
  }, 5000);

  // Set interval
  setInterval(() => {
    checkAndSendReminders();
  }, intervalMs);
}
