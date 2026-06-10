import { Response, NextFunction } from "express";
import { db } from "../../server/db";
import { AuthenticatedRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { XP_RULES, getLevelFromXP } from "../lib/xpSystem";

// ─── In-memory frame relay store ────────────────────────────────────────────
// Maps: roomId → Map<clientId, { frame, status, userId, ts }>
// clientId is a unique random ID generated per browser tab/session.
// Using clientId (not userId) allows two tabs of the same account to see each other.
const frameStore = new Map<string, Map<string, { frame: string; status: string; userId: string; ts: number }>>();

/** Clean up frame data for rooms older than 2 hours */
setInterval(() => {
  const now = Date.now();
  for (const [roomId, clients] of frameStore.entries()) {
    for (const [cid, data] of clients.entries()) {
      if (now - data.ts > 2 * 60 * 60 * 1000) clients.delete(cid);
    }
    if (clients.size === 0) frameStore.delete(roomId);
  }
}, 10 * 60 * 1000);

// Helper for AI Insight based on Focus Score
const getAIInsight = (focusScore: number): string => {
  if (focusScore >= 90) {
    return "Tuyệt vời! Bạn đã duy trì sự tập trung cực kỳ ấn tượng trong suốt phiên. Phong độ đỉnh cao!";
  } else if (focusScore >= 70) {
    return "Khá ổn! Bạn có một vài lần mất tập trung nhỏ, nhưng tổng thể vẫn rất hiệu quả. Tiếp tục phát huy nhé!";
  } else if (focusScore >= 50) {
    return "Phiên làm việc có khá nhiều xao nhãng. Hãy thử dọn dẹp không gian và chọn phiên ngắn hơn nhé!";
  } else {
    return "Mức độ tập trung khá thấp. Đừng quá khắt khe với bản thân, hãy nghỉ ngơi một chút và thử lại sau nhé.";
  }
};

// Calculate XP based on Focus Score
const calculateXP = (focusScore: number): number => {
  if (focusScore >= 90) return 180;
  if (focusScore >= 70) return 120;
  if (focusScore >= 50) return 80;
  return 30;
};

export const createRoom = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized access.", 401);

    const { title, mode, durationMinutes } = req.body;

    if (!title || !mode || !durationMinutes) {
      throw new AppError("Title, mode, and duration are required.", 400);
    }

    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const room = await (db as any).disciplineRooms.create({
      title,
      mode,
      duration_minutes: durationMinutes,
      invite_code: inviteCode,
      creator_id: userId,
      status: "WAITING"
    });

    // Add creator as participant
    await (db as any).roomParticipants.create({
      room_id: room.id,
      user_id: userId,
      role: "CREATOR"
    });

    res.status(201).json({ success: true, room });
  } catch (error) {
    next(error);
  }
};

export const joinRoom = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized access.", 401);

    const { inviteCode } = req.body;
    if (!inviteCode) throw new AppError("Invite code is required.", 400);

    const room = await (db as any).disciplineRooms.findByInviteCode(inviteCode);
    if (!room) throw new AppError("Room not found.", 404);

    if (room.status !== "WAITING") {
      throw new AppError("Room is no longer waiting for participants.", 400);
    }

    const participants = await (db as any).roomParticipants.findManyByRoomId(room.id);
    if (participants.length >= 2) {
      throw new AppError("Room is full.", 400);
    }

    // Check if already in room
    const alreadyIn = participants.find((p: any) => p.user_id === userId);
    if (alreadyIn) {
      res.status(200).json({ success: true, room });
      return;
    }

    await (db as any).roomParticipants.create({
      room_id: room.id,
      user_id: userId,
      role: "PARTNER"
    });

    res.status(200).json({ success: true, room });
  } catch (error) {
    next(error);
  }
};

export const getRoom = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized access.", 401);

    const { id } = req.params;
    const room = await (db as any).disciplineRooms.findUnique(id);
    if (!room) throw new AppError("Room not found.", 404);

    res.status(200).json({ success: true, room });
  } catch (error) {
    next(error);
  }
};

export const startRoom = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized access.", 401);

    const { id } = req.params;
    const room = await (db as any).disciplineRooms.findUnique(id);
    if (!room) throw new AppError("Room not found.", 404);

    if (room.creator_id !== userId) {
      throw new AppError("Only the creator can start the room.", 403);
    }

    const updatedRoom = await (db as any).disciplineRooms.update(id, {
      status: "ACTIVE",
      started_at: new Date().toISOString()
    });

    res.status(200).json({ success: true, room: updatedRoom });
  } catch (error) {
    next(error);
  }
};

export const heartbeat = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized access.", 401);

    const { id } = req.params;
    // Simple heartbeat to confirm participation or get room status
    // In a real socket app, this would be more complex
    const room = await (db as any).disciplineRooms.findUnique(id);
    if (!room) throw new AppError("Room not found.", 404);

    res.status(200).json({ success: true, status: room.status });
  } catch (error) {
    next(error);
  }
};

export const endRoom = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized access.", 401);

    const { id } = req.params;
    const { durationSeconds, presenceScore, focusScore, awayCount } = req.body;

    const room = await (db as any).disciplineRooms.findUnique(id);
    if (!room) throw new AppError("Room not found.", 404);

    // Save report for this user
    const xpEarned = calculateXP(focusScore);
    const aiInsight = getAIInsight(focusScore);

    const report = await (db as any).sessionReports.create({
      room_id: id,
      user_id: userId,
      duration_seconds: durationSeconds,
      presence_score: presenceScore,
      focus_score: focusScore,
      away_count: awayCount,
      xp_earned: xpEarned,
      ai_insight: aiInsight
    });

    // Update participant's final stats
    await (db as any).roomParticipants.updateByRoomAndUser(id, userId, {
      left_at: new Date().toISOString(),
      final_focus_score: focusScore,
      xp_earned: xpEarned
    });

    // Award XP to user
    const user = await db.users.findUnique({ id: userId });
    if (user) {
      const currentXP = user.total_xp || 0;
      const nextXP = currentXP + xpEarned;
      const nextLevel = getLevelFromXP(nextXP).level;
      await db.users.update(userId, {
        total_xp: nextXP,
        level: nextLevel
      });
    }

    // If creator ends, mark room as COMPLETED (in MVP simplified)
    if (room.creator_id === userId) {
      await (db as any).disciplineRooms.update(id, {
        status: "COMPLETED",
        ended_at: new Date().toISOString()
      });
    }

    res.status(200).json({ success: true, report });
  } catch (error) {
    next(error);
  }
};

// ─── Frame relay: upload own frame ──────────────────────────────────────────
export const uploadFrame = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) { res.status(401).json({ success: false }); return; }

    const { id } = req.params;
    const { frame, status, clientId } = req.body;
    if (!frame) { res.status(400).json({ success: false, message: "frame required" }); return; }

    // Use clientId (unique per browser tab) so two tabs of the same user can be distinguished
    const key = clientId || userId;

    if (!frameStore.has(id)) frameStore.set(id, new Map());
    frameStore.get(id)!.set(key, { frame, status: status || "Focused", userId, ts: Date.now() });

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

// ─── Frame relay: get partner's latest frame ──────────────────────────────────
export const getPartnerFrame = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) { res.status(401).json({ success: false }); return; }

    const { id } = req.params;
    // Accept clientId from query param so we can exclude our own frame
    const myClientId = (req.query.clientId as string) || "";

    const roomFrames = frameStore.get(id);
    if (!roomFrames) { res.status(200).json({ success: true, frame: null, status: "Camera Off" }); return; }

    // Return the first entry whose clientId is different from ours
    for (const [cid, data] of roomFrames.entries()) {
      if (cid !== myClientId) {
        const age = Date.now() - data.ts;
        if (age > 4000) {
          res.status(200).json({ success: true, frame: null, status: "Camera Off" });
        } else {
          res.status(200).json({ success: true, frame: data.frame, status: data.status });
        }
        return;
      }
    }

    res.status(200).json({ success: true, frame: null, status: "Camera Off" });
  } catch (error) {
    next(error);
  }
};

export const getReport = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized access.", 401);

    const { id } = req.params;
    const report = await (db as any).sessionReports.findByRoomAndUser(id, userId);
    if (!report) throw new AppError("Report not found.", 404);

    res.status(200).json({ success: true, report });
  } catch (error) {
    next(error);
  }
};
