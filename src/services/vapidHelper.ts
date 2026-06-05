import webpush from "web-push";
import fs from "fs";
import path from "path";

export function initVapidKeys() {
  let publicKey = process.env.VAPID_PUBLIC_KEY;
  let privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    console.log("[VAPID] VAPID keys not found. Generating new ones...");
    const keys = webpush.generateVAPIDKeys();
    publicKey = keys.publicKey;
    privateKey = keys.privateKey;
    
    // Write to .env file to persist
    const dotenvPath = path.join(process.cwd(), ".env");
    let content = "";
    if (fs.existsSync(dotenvPath)) {
      content = fs.readFileSync(dotenvPath, "utf-8");
    }
    
    const hasPublicKey = content.includes("VAPID_PUBLIC_KEY");
    const hasPrivateKey = content.includes("VAPID_PRIVATE_KEY");
    
    const newLines = [];
    if (!hasPublicKey) newLines.push(`VAPID_PUBLIC_KEY="${publicKey}"`);
    if (!hasPrivateKey) newLines.push(`VAPID_PRIVATE_KEY="${privateKey}"`);
    
    if (newLines.length > 0) {
      const prefix = content.endsWith("\n") ? "" : "\n";
      fs.appendFileSync(dotenvPath, prefix + newLines.join("\n") + "\n");
      console.log("[VAPID] Generated and saved new VAPID keys to .env");
    }
    
    process.env.VAPID_PUBLIC_KEY = publicKey;
    process.env.VAPID_PRIVATE_KEY = privateKey;
  }

  webpush.setVapidDetails(
    "mailto:admin@daily-goal-tracker.com",
    publicKey,
    privateKey
  );
  
  console.log("[VAPID] VAPID Keys initialized successfully.");
  return { publicKey, privateKey };
}
