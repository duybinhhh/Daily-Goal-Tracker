import "dotenv/config";
import { db } from "../server/db";

async function main() {
  console.log("=== Checking Room RT5MFH ===");
  const room = await (db as any).disciplineRooms.findByInviteCode("RT5MFH");
  if (!room) {
    console.log("Room RT5MFH not found in DB!");
    return;
  }
  console.log("Room:", {
    id: room.id,
    invite_code: room.invite_code,
    status: room.status,
    creator_id: room.creator_id,
    participants: room.participants.map((p: any) => ({
      user_id: p.user_id,
      name: p.user?.name,
      role: p.role,
      is_ready: p.is_ready,
      goal: p.goal
    }))
  });
}

main().catch(console.error);
