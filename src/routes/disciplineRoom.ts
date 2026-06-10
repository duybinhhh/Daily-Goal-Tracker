import { Router } from "express";
import * as disciplineRoomController from "../controllers/disciplineRoomController";
import { authMiddleware } from "../middleware/auth";

const router = Router();

// All routes are protected by auth middleware
router.use(authMiddleware);

router.post("/create", disciplineRoomController.createRoom);
router.post("/join", disciplineRoomController.joinRoom);
router.get("/:id", disciplineRoomController.getRoom);
router.post("/:id/start", disciplineRoomController.startRoom);
router.post("/:id/heartbeat", disciplineRoomController.heartbeat);
router.post("/:id/end", disciplineRoomController.endRoom);
router.get("/:id/report", disciplineRoomController.getReport);

// Camera frame relay (server as relay for cross-browser/cross-machine support)
router.post("/:id/frame", disciplineRoomController.uploadFrame);
router.get("/:id/partner-frame", disciplineRoomController.getPartnerFrame);

export default router;

