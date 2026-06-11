import "dotenv/config";
import { db } from "../server/db";

async function main() {
  console.log("=== Cleaning up stuck rooms ===");
  
  // We can query the database directly using prisma client or our db wrapper
  // Let's delete the room RT5MFH
  const room = await (db as any).disciplineRooms.findByInviteCode("RT5MFH");
  if (room) {
    console.log(`Found stuck room ${room.invite_code} (ID: ${room.id}), deleting...`);
    // Delete via prisma
    await (db as any).prisma.disciplineRoom.delete({
      where: { id: room.id }
    });
    console.log("Deleted RT5MFH!");
  } else {
    console.log("Room RT5MFH not found in DB.");
  }
}

main().catch(async (e) => {
  // Try using generic prisma connection if db wrapper doesn't expose prisma directly
  const { PrismaClient } = await import("@prisma/client");
  const { PrismaPg } = await import("@prisma/adapter-pg");
  const pg = await import("pg");
  
  const connectionString = process.env.DATABASE_URL;
  const pool = new pg.default.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  
  try {
    const room = await prisma.disciplineRoom.findUnique({
      where: { invite_code: "RT5MFH" }
    });
    if (room) {
      console.log(`Found stuck room ${room.invite_code} via direct Prisma, deleting...`);
      await prisma.disciplineRoom.delete({
        where: { id: room.id }
      });
      console.log("Deleted RT5MFH successfully!");
    }
  } catch (err) {
    console.error("Failed to delete via direct Prisma:", err);
  } finally {
    await pool.end();
  }
});
