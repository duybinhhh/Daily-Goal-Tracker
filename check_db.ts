import { db } from "./server/db";

async function run() {
  const goals = await db.goals.findMany();
  console.log("Goals:", goals.length);
  const logs = await db.logs.findMany();
  console.log("Logs:", logs.length);
  
  if (logs.length > 0) {
    const logIds = logs.map(l => l.id);
    const uniqueIds = new Set(logIds);
    console.log("Total Logs:", logs.length);
    console.log("Unique IDs:", uniqueIds.size);
    
    // Check for identical notes or goal_ids
    const logDetails = logs.map(l => ({ id: l.id, goal_id: l.goal_id, note: l.note }));
    console.log(logDetails);
  }
}

run();
