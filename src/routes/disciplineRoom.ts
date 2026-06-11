import { Router } from "express";
import * as disciplineRoomController from "../controllers/disciplineRoomController";
import { authMiddleware } from "../middleware/auth";

const router = Router();

// All routes are protected by auth middleware
router.use(authMiddleware);

router.post("/create", disciplineRoomController.createRoom);
router.post("/join", disciplineRoomController.joinRoom);
router.get("/waiting", disciplineRoomController.getWaitingRooms);
router.get("/:id", disciplineRoomController.getRoom);
router.post("/:id/start", disciplineRoomController.startRoom);
router.post("/:id/heartbeat", disciplineRoomController.heartbeat);
router.post("/:id/end", disciplineRoomController.endRoom);
router.get("/:id/report", disciplineRoomController.getReport);
router.post("/:id/goal", disciplineRoomController.setGoal);
router.post("/:id/ready", disciplineRoomController.setReady);
router.post("/:id/leave", disciplineRoomController.leaveRoom);

// Room Messages
router.get("/:id/messages", disciplineRoomController.getMessages);
router.post("/:id/messages", disciplineRoomController.postMessage);

// Camera frame relay (server as relay for cross-browser/cross-machine support)
router.post("/:id/frame", disciplineRoomController.uploadFrame);
router.get("/:id/partner-frame", disciplineRoomController.getPartnerFrame);

export default router;

