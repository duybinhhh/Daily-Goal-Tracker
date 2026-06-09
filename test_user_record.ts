import { db } from "./server/db";

async function run() {
  const user = await db.users.findUnique({ email: "onboard_test_9999@example.com" });
  console.log("User:", JSON.stringify(user, null, 2));
  if (user) {
    const goals = await db.goals.findMany({ user_id: user.id });
    console.log("Goals for this user in DB:", JSON.stringify(goals, null, 2));
  }
}

run();
