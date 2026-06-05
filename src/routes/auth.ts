// src/routes/auth.ts
import { Router } from "express";
import { register, login, refreshToken, logout, updateProfile, deleteAccount, updatePushSubscription, getVapidPublicKey } from "../controllers/authController";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refreshToken);
router.post("/logout", logout);

router.put("/profile", authMiddleware, updateProfile);
router.delete("/profile", authMiddleware, deleteAccount);

// Web Push endpoints
router.put("/push-subscription", authMiddleware, updatePushSubscription);
router.get("/vapid-public-key", getVapidPublicKey);

export default router;
