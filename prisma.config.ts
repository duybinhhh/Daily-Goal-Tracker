import "dotenv/config";
import { defineConfig, env } from "prisma/config";

const dbUrl = env("DATABASE_URL") || "";
const finalUrl = dbUrl && !dbUrl.includes("pgbouncer=true") && dbUrl.includes("pooler") 
  ? `${dbUrl}${dbUrl.includes("?") ? "&" : "?"}pgbouncer=true` 
  : dbUrl;

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: finalUrl,
  },
});
