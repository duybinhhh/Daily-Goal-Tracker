// server.ts
import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import app from "./src/express-app";
import { initVapidKeys } from "./src/services/vapidHelper";
import { startReminderScheduler } from "./src/services/reminderScheduler";

async function startServer() {
  const PORT = 3000;

  // Initialize Web Push VAPID keys
  initVapidKeys();

  // Start the background Active Reminders scheduler
  startReminderScheduler();

  // Vite middleware for client asset compiling in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve production static single page application builds
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Unified Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
