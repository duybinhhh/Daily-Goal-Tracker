const { execSync } = require('child_process');
require('dotenv').config();

let dbUrl = process.env.DATABASE_URL;
if (dbUrl && dbUrl.includes('6543')) {
    dbUrl = dbUrl.replace(':6543', ':5432').replace('?pgbouncer=true', '').replace('&pgbouncer=true', '');
}

console.log("Using modified DB URL for schema push");
process.env.DATABASE_URL = dbUrl;

try {
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit', env: process.env });
} catch (e) {
    console.error("Failed to push schema", e.message);
}
