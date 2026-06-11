/**
 * Script: add is_public & expires_at columns to DisciplineRoom
 * Run: npx tsx scripts/add_discipline_room_columns.ts
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

console.log("Connecting to DB (direct)...");

const client = new pg.Client({ connectionString: directUrl });

async function main() {
  await client.connect();
  console.log("Connected.");

  // Add is_public column if not exists
  await client.query(`
    ALTER TABLE "DisciplineRoom"
    ADD COLUMN IF NOT EXISTS "is_public" BOOLEAN NOT NULL DEFAULT false;
  `);
  console.log("✓ is_public column added (or already exists)");

  // Add expires_at column if not exists
  await client.query(`
    ALTER TABLE "DisciplineRoom"
    ADD COLUMN IF NOT EXISTS "expires_at" TIMESTAMP(3);
  `);
  console.log("✓ expires_at column added (or already exists)");

  await client.end();
  console.log("\n✅ Done! Database schema updated successfully.");
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
