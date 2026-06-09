import "dotenv/config";
import { db } from "./server/db";

async function main() {
  console.log("=== USERS ===");
  const users = await db.users.findMany();
  for (const u of users) {
    console.log({
      id: u.id,
      email: u.email,
      name: u.name,
      timezone: u.timezone,
      onboarding_completed: u.onboarding_completed,
      push_subscription: u.push_subscription ? "HAS_SUBSCRIPTION (length: " + u.push_subscription.length + ")" : "NULL"
    });
  }

  console.log("\n=== GOALS ===");
  const goals = await db.goals.findMany();
  for (const g of goals) {
    console.log({
      id: g.id,
      user_id: g.user_id,
      title: g.title,
      status: g.status,
      reminder_time: g.reminder_time
    });
  }

  console.log("\n=== NOTIFICATIONS ===");
  const notifs = await db.notifications.findMany();
  console.log("Total notifications count:", notifs.length);
  for (const n of notifs.slice(-5)) {
    console.log({
      id: n.id,
      user_id: n.user_id,
      type: n.type,
      message: n.message,
      created_at: n.created_at
    });
  }
}

main()
  .catch(console.error);
