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
      const goals = await db.goals.findMany({ user_id: user.id });

      if (localHour === 20) {
        const localDateStr = getLocalDateString(now, timezone);

        if (user.last_freeze_reminder_date !== localDateStr) {
          const atRiskGoals = [];
          for (const goal of goals) {
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
        const localDateStr = getLocalDateString(now, timezone);

        // Check if we already sent a reminder today
        if (user.last_reminder_sent_date === localDateStr) {
          continue;
        }

        let hasIncompleteDailyGoals = false;

        for (const goal of goals) {
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
