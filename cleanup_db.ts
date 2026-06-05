import { db } from "./server/db";

async function deduplicateLogs() {
  const logs = await db.logs.findMany();
  
  // Group by goal_id and created_at/note
  // Since we want to remove logs that were created within seconds of each other with the same note
  
  const groups = new Map<string, any[]>();
  
  for (const log of logs) {
    // Generate a key based on goal_id, note, and rough time (e.g. within same minute)
    const timeKey = new Date(log.completed_at).toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
    const key = `${log.goal_id}_${log.note || ""}_${timeKey}`;
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(log);
  }
  
  let deletedCount = 0;
  
  for (const [key, group] of groups.entries()) {
    if (group.length > 1) {
      // Keep the first one, delete the rest
      const [keep, ...rest] = group;
      console.log(`Found ${rest.length} duplicates for ${key}`);
      for (const duplicate of rest) {
        await db.logs.delete(duplicate.id);
        deletedCount++;
      }
    }
  }
  
  console.log(`Deleted ${deletedCount} duplicate logs.`);
}

deduplicateLogs();
