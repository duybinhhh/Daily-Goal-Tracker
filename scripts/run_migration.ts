/**
 * Script: run Ready Lobby migration on database
 * Run: npx tsx scripts/run_migration.ts
 */
import "dotenv/config";
import pg from "pg";

const connectionString = process.env.DATABASE_URL!;

// Switch from pooler port 6543 to direct port 5432 for DDL
const directUrl = connectionString
  .replace(":6543/", ":5432/")
  .replace("pgbouncer=true&", "")
  .replace("&pgbouncer=true", "")
  .replace("?pgbouncer=true", "");

console.log("Connecting to DB (direct) at port 5432...");

const client = new pg.Client({ connectionString: directUrl });

async function main() {
  await client.connect();
  console.log("Connected.");

  console.log("Altering DisciplineRoom status default and updating existing values...");
  await client.query(`
    -- Update default status of DisciplineRoom to 'WAITING_PARTNER'
    ALTER TABLE "DisciplineRoom" ALTER COLUMN "status" SET DEFAULT 'WAITING_PARTNER';

    -- Update any existing 'WAITING' rooms to 'WAITING_PARTNER'
    UPDATE "DisciplineRoom" SET "status" = 'WAITING_PARTNER' WHERE "status" = 'WAITING';
  `);
  console.log("✓ DisciplineRoom status altered.");

  console.log("Adding columns to RoomParticipant table...");
  await client.query(`
    -- Add goal column if not exists
    ALTER TABLE "RoomParticipant"
    ADD COLUMN IF NOT EXISTS "goal" TEXT;

    -- Add is_ready column if not exists
    ALTER TABLE "RoomParticipant"
    ADD COLUMN IF NOT EXISTS "is_ready" BOOLEAN NOT NULL DEFAULT false;
  `);
  console.log("✓ RoomParticipant columns added successfully.");

  await client.end();
  console.log("\n✅ Done! Database migrated successfully.");
}

main().catch((err) => {
  console.error("❌ Migration Error:", err.message);
  process.exit(1);
});
