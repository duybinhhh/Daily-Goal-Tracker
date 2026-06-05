import { db } from "../server/db";
import { syncAndResetGoalProgress } from "../src/services/../controllers/goalController";
import { initVapidKeys } from "../src/services/vapidHelper";
import webpush from "web-push";

async function verify() {
  console.log("--- Starting Active Reminders Verification (Forced 21:00) ---");
  
  // Initialize VAPID keys so they are generated, stored in .env, and configured in webpush
  console.log("Initializing VAPID keys...");
  initVapidKeys();

  const users = await db.users.findMany();
  if (users.length > 0) {
    const testUser = users[0];
    console.log(`\nTesting with user: ${testUser.name} (${testUser.email})`);
    
    // Create a mock daily goal for this user if they don't have one
    const userGoals = await db.goals.findMany({ user_id: testUser.id });
    let testGoal = userGoals.find(g => g.frequency === "daily");
    if (!testGoal) {
      console.log("No daily goals found. Creating a mock daily goal...");
      testGoal = await db.goals.create({
        user_id: testUser.id,
        title: "Mock Daily Drink Water",
        category: "Health",
        target_count: 1,
        frequency: "daily"
      });
    }

    // Ensure it's uncompleted today
    await db.goals.update(testGoal.id, {
      current_count: 0,
      status: "active"
    });
    
    const dummySub = {
      endpoint: "https://fcm.googleapis.com/fcm/send/fake-endpoint-1234",
      keys: {
        p256dh: "MIIBPAIBAAJBANL4m3b69q...",
        auth: "fake-auth-key-123"
      }
    };
    
    console.log("Saving mock push subscription to DB...");
    await db.users.update(testUser.id, {
      push_subscription: JSON.stringify(dummySub),
      timezone: "Asia/Ho_Chi_Minh",
      last_reminder_sent_date: null
    });
    
    // Simulate checkAndSendReminders but forced to 21h00
    console.log("\nSimulating checkAndSendReminders at 21:00...");
    const subscribedUsers = await db.users.findMany({ has_push_subscription: true });
    
    for (const user of subscribedUsers) {
      if (user.id !== testUser.id) continue;
      
      console.log(`Checking goals for user: ${user.name}`);
      const goals = await db.goals.findMany({ user_id: user.id });
      let hasIncompleteDailyGoals = false;
      
      for (const goal of goals) {
        const syncedGoal = await syncAndResetGoalProgress(goal, user.timezone);
        if (syncedGoal.frequency === "daily" && syncedGoal.current_count < syncedGoal.target_count) {
          console.log(`Found incomplete goal: "${syncedGoal.title}" (${syncedGoal.current_count}/${syncedGoal.target_count})`);
          hasIncompleteDailyGoals = true;
          break;
        }
      }
      
      if (hasIncompleteDailyGoals) {
        console.log("Attempting to send push notification to browser service (expected to fail with 400/404/410/etc)...");
        try {
          const subscription = JSON.parse(user.push_subscription!);
          const payload = JSON.stringify({
            title: "Chống đứt chuỗi! 🔥",
            body: `Chào ${user.name}, bạn vẫn còn thói quen chưa hoàn thành hôm nay. Hoàn thành ngay để bảo vệ chuỗi Streak nhé!`
          });
          
          await webpush.sendNotification(subscription, payload);
          console.log("Success (unexpected)!");
        } catch (error: any) {
          console.log(`Caught expected send error: ${error.message} (Status: ${error.statusCode})`);
          
          // Self-cleaning database check
          if (error.statusCode === 400 || error.statusCode === 404 || error.statusCode === 410 || error.message.includes("410") || error.message.includes("400")) {
            console.log("Invalid subscription detected. Self-cleaning subscription from database...");
            await db.users.update(user.id, {
              push_subscription: null
            });
            console.log("Successfully removed invalid subscription from DB!");
          }
        }
      }
    }
    
    // Verify it was cleaned
    const finalUser = await db.users.findUnique({ id: testUser.id });
    console.log("\nFinal user subscription state (expected null):", finalUser.push_subscription);
    
    console.log("--- Verification Completed Successfully! ---");
  } else {
    console.log("No users found in database.");
  }
}

verify();
