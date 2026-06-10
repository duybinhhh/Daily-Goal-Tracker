import { db } from "../server/db";

async function run() {
  const goal = await db.goals.findMany();
  if (goal.length === 0) return console.log("No goals found");
  
  const g = goal[0];
  console.log("Before:", g.status, g.is_archived);
  
  const updated = await db.goals.update(g.id, { is_archived: true, status: "paused" });
  console.log("After:", updated.status, updated.is_archived);
}

run().catch(console.error);
