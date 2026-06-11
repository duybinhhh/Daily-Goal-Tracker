import { Response, NextFunction } from "express";
import { db } from "../../server/db";
import { AuthenticatedRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { XP_RULES, getLevelFromXP } from "../lib/xpSystem";

// ─── In-memory frame relay store ────────────────────────────────────────────
// Maps: roomId → Map<clientId, { frame, status, userId, ts }>
// clientId is a unique random ID generated per browser tab/session.
// Using clientId (not userId) allows two tabs of the same account to see each other.
const frameStore = new Map<string, Map<string, { 
  frame: string; 
  status: string; 
  focusScore: number;
  attentionScore: number;
  presenceScore: number;
  awayCount: number;
  totalFocusedTime: number;
  totalReadingWritingTime: number;
  totalAwayTime: number;
  currentAlertType: string | null;
  lastEventType: string | null;
  aiConfidence: number;
  userId: string; 
  ts: number 
}>>();

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

// Helper for AI Insight based on new metrics and mode
const getAIInsight = (report: any, mode: string): string => {
  const { focus_score, presence_score, attention_score, away_count, looking_away_count, head_down_count, reading_writing_time, total_away_time, metadata } = report;
  const totalLookingAwayTime = metadata?.total_looking_away_time || 0;
  const totalHeadDownTime = metadata?.total_head_down_time || 0;
  const lowConfidenceTime = metadata?.low_confidence_time || 0;

  if (focus_score >= 90) {
    let msg = "Tuyệt vời! Bạn đã duy trì sự tập trung cực kỳ ấn tượng.";
    if (mode === "Study" && (reading_writing_time || 0) > 300) {
      msg += " Bạn đã dành nhiều thời gian đọc và ghi chép rất hiệu quả.";
    }
    return msg + " Phong độ đỉnh cao!";
  }

  if (lowConfidenceTime > report.duration_seconds * 0.3) {
    return "AI gặp khó khăn khi phân tích do ánh sáng hoặc góc camera. Hãy điều chỉnh camera để nhận được báo cáo chính xác hơn nhé.";
  }

  if (mode === "Study") {
    if ((reading_writing_time || 0) > (report.duration_seconds * 0.5)) {
      return "Bạn đã dành phần lớn thời gian để đọc và ghi chép. Đây là hành vi phù hợp với Study Mode, hãy tiếp tục duy trì nhé!";
    }
    if (total_away_time > 60) {
      return "Bạn rời khỏi camera khá nhiều lần. Lần sau hãy chuẩn bị tài liệu và nước uống trước khi bắt đầu để tránh ngắt quãng nhé.";
    }
  }

  if (mode === "Deep Work") {
    if (totalLookingAwayTime > 30) {
      return "Bạn thường xuyên nhìn ra ngoài màn hình trong phiên Deep Work. Hãy thử tắt thông báo hoặc chọn môi trường ít xao nhãng hơn.";
    }
    if (totalHeadDownTime > 30) {
      return "Bạn cúi xuống khá lâu trong phiên Deep Work. Nếu đang dùng điện thoại, hãy đặt điện thoại xa bàn làm việc để tập trung tốt hơn.";
    }
  }

  if (presence_score < 70) {
    return "Mức độ hiện diện của bạn khá thấp. Sự hiện diện liên tục trước camera giúp AI hỗ trợ bạn duy trì kỷ luật tốt hơn.";
  }

  if (focus_score >= 70) {
    return "Khá ổn! Bạn có một vài lần mất tập trung nhỏ, nhưng tổng thể vẫn rất hiệu quả. Tiếp tục phát huy nhé!";
  } else if (focus_score >= 50) {
    return "Phiên làm việc có khá nhiều xao nhãng. Hãy thử dọn dẹp không gian và chọn phiên ngắn hơn để rèn luyện sự tập trung.";
  } else {
    return "Mức độ tập trung khá thấp. Đừng quá khắt khe với bản thân, hãy nghỉ ngơi một chút và thử lại với tâm thế thoải mái hơn nhé.";
  }
};

// Calculate XP based on Focus Score and bonuses
const calculateXP = (report: any): number => {
  const { focus_score, presence_score, attention_score, away_count } = report;
  let xp = 30;

  if (focus_score >= 90) xp = 200;
  else if (focus_score >= 80) xp = 160;
  else if (focus_score >= 70) xp = 120;
  else if (focus_score >= 50) xp = 80;

  // Bonuses
  if (presence_score >= 90 && attention_score >= 80) xp += 30;
  if (away_count === 0) xp += 20;

  return Math.min(xp, 250); // Cap at 250 XP
};

export const createRoom = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized access.", 401);

    const { title, mode, durationMinutes, isPublic } = req.body;

    if (!title || !mode || !durationMinutes) {
      throw new AppError("Title, mode, and duration are required.", 400);
    }

    // Set expiration to durationMinutes + 10 minutes buffer if it's waiting
    const expiresAt = new Date(Date.now() + (durationMinutes + 10) * 60 * 1000).toISOString();

    let room: any = null;
    let lastError: any = null;

    for (let attempt = 0; attempt < 5; attempt++) {
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      try {
        room = await (db as any).disciplineRooms.create({
          title,
          mode,
          duration_minutes: durationMinutes,
          invite_code: inviteCode,
          creator_id: userId,
          status: "WAITING_PARTNER",
          is_public: !!isPublic,
          expires_at: expiresAt
        });
        break;
      } catch (error: any) {
        lastError = error;
        if (error?.code !== "P2002") {
          throw error;
        }
      }
    }

    if (!room) {
      throw lastError || new AppError("Could not create a unique invite code. Please try again.", 500);
    }

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

    const { inviteCode, roomId } = req.body;
    if (!inviteCode && !roomId) throw new AppError("Invite code or Room ID is required.", 400);

    let room;
    if (inviteCode) {
      room = await (db as any).disciplineRooms.findByInviteCode(inviteCode.toUpperCase());
    } else {
      room = await (db as any).disciplineRooms.findUnique(roomId);
    }
    
    if (!room) throw new AppError("Room not found.", 404);

    if (room.status !== "WAITING_PARTNER") {
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

    // Update room status to LOBBY
    const updatedRoom = await (db as any).disciplineRooms.update(room.id, {
      status: "LOBBY"
    });

    // Post system message
    await (db as any).roomMessages.create({
      room_id: room.id,
      sender_id: null,
      type: "SYSTEM",
      event_type: null,
      message: "Partner đã tham gia phòng. Hãy trao đổi mục tiêu trước khi bắt đầu phiên.",
    });

    res.status(200).json({ success: true, room: updatedRoom });
  } catch (error) {
    next(error);
  }
};

export const getWaitingRooms = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized access.", 401);

    const rooms = await (db as any).disciplineRooms.findWaitingPublic();
    
    // Filter out rooms where the current user is already a participant
    const filteredRooms = rooms.filter((room: any) => {
      return !room.participants.some((p: any) => p.user_id === userId);
    });

    res.status(200).json({ success: true, data: filteredRooms });
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

    const participants = await (db as any).roomParticipants.findManyByRoomId(id);
    if (participants.length < 2) {
      throw new AppError("Please wait for your partner before opening the lobby.", 400);
    }

    const updatedRoom = await (db as any).disciplineRooms.update(id, {
      status: "LOBBY"
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
    const { 
      durationSeconds, 
      presenceScore, 
      focusScore, 
      attentionScore, 
      awayCount, 
      lookingAwayCount, 
      headDownCount, 
      readingWritingTime, 
      totalAwayTime, 
      aiConfidence,
      metadata
    } = req.body;

    const room = await (db as any).disciplineRooms.findUnique(id);
    if (!room) throw new AppError("Room not found.", 404);

    const reportData = {
      duration_seconds: durationSeconds,
      presence_score: presenceScore,
      focus_score: focusScore,
      attention_score: attentionScore,
      away_count: awayCount,
      looking_away_count: lookingAwayCount,
      head_down_count: headDownCount,
      reading_writing_time: readingWritingTime,
      total_away_time: totalAwayTime,
      ai_confidence: aiConfidence,
      metadata: metadata || null
    };

    const xpEarned = calculateXP(reportData);
    const aiInsight = getAIInsight(reportData, room.mode);

    const report = await (db as any).sessionReports.create({
      room_id: id,
      user_id: userId,
      ...reportData,
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
    const { 
      frame, status, focusScore, attentionScore, presenceScore,
      totalFocusedTime, totalReadingWritingTime, totalAwayTime,
      currentAlertType, lastEventType, aiConfidence, clientId, awayCount
    } = req.body;
    
    if (!frame) { res.status(400).json({ success: false, message: "frame required" }); return; }

    // Use clientId (unique per browser tab) so two tabs of the same user can be distinguished
    const key = clientId || userId;

    if (!frameStore.has(id)) frameStore.set(id, new Map());
    frameStore.get(id)!.set(key, { 
      frame, 
      status: status || "Focused", 
      focusScore: focusScore ?? 100,
      attentionScore: attentionScore ?? 100,
      presenceScore: presenceScore ?? 100,
      awayCount: awayCount ?? 0,
      totalFocusedTime,
      totalReadingWritingTime,
      totalAwayTime,
      currentAlertType,
      lastEventType,
      aiConfidence,
      userId, 
      ts: Date.now() 
    });

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
    const myClientId = (req.query.clientId as string) || "";

    const roomFrames = frameStore.get(id);
    if (!roomFrames) {
      res.status(200).json({
        success: true,
        frame: null,
        status: "Camera Off",
        hasMetrics: false,
        focusScore: 0,
        presenceScore: 0,
        attentionScore: 0,
        awayCount: 0
      });
      return;
    }

    for (const [cid, data] of roomFrames.entries()) {
      if (cid !== myClientId) {
        const age = Date.now() - data.ts;
        if (age > 4000) {
          res.status(200).json({ 
            success: true, 
            frame: null, 
            status: "Camera Off", 
            hasMetrics: true,
            focusScore: data.focusScore,
            attentionScore: data.attentionScore,
            presenceScore: data.presenceScore,
            awayCount: data.awayCount
          });
        } else {
          res.status(200).json({ 
            success: true, 
            frame: data.frame, 
            status: data.status, 
            hasMetrics: true,
            focusScore: data.focusScore,
            attentionScore: data.attentionScore,
            presenceScore: data.presenceScore,
            totalFocusedTime: (data as any).totalFocusedTime,
            totalReadingWritingTime: (data as any).totalReadingWritingTime,
            totalAwayTime: (data as any).totalAwayTime,
            awayCount: data.awayCount,
            currentAlertType: (data as any).currentAlertType,
            lastEventType: (data as any).lastEventType,
            aiConfidence: (data as any).aiConfidence
          });
        }
        return;
      }
    }

    res.status(200).json({
      success: true,
      frame: null,
      status: "Camera Off",
      hasMetrics: false,
      focusScore: 0,
      presenceScore: 0,
      attentionScore: 0,
      awayCount: 0
    });
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

export const getMessages = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized access.", 401);

    const { id } = req.params;
    const { after } = req.query;

    const messages = await (db as any).roomMessages.findManyByRoomId(id, after as string);

    res.status(200).json({ success: true, messages });
  } catch (error) {
    next(error);
  }
};

export const postMessage = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized access.", 401);

    const { id } = req.params;
    const { message, type, eventType } = req.body;

    if (!message) {
      throw new AppError("Message content is required.", 400);
    }

    const roomMessage = await (db as any).roomMessages.create({
      room_id: id,
      sender_id: type === "SYSTEM" ? null : userId,
      type: type || "USER",
      event_type: eventType || null,
      message,
    });

    res.status(201).json({ success: true, message: roomMessage });
  } catch (error) {
    next(error);
  }
};

export const setGoal = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized access.", 401);

    const { id } = req.params;
    const { goal } = req.body;

    if (goal === undefined || goal === null) {
      throw new AppError("Goal is required.", 400);
    }

    const trimmedGoal = String(goal).trim().substring(0, 100);

    if (String(goal).length > 100) {
      throw new AppError("Goal must be 100 characters or less.", 400);
    }

    const room = await (db as any).disciplineRooms.findUnique(id);
    if (!room) throw new AppError("Room not found.", 404);

    // Ensure the user is a participant
    const participants = await (db as any).roomParticipants.findManyByRoomId(id);
    const userParticipant = participants.find((p: any) => p.user_id === userId);
    if (!userParticipant) {
      throw new AppError("You are not a participant in this room.", 403);
    }

    // Update participant's goal
    await (db as any).roomParticipants.updateByRoomAndUser(id, userId, { goal: trimmedGoal });

    // Post system message
    const user = await db.users.findUnique({ id: userId });
    const userName = user?.name || "User";
    if (trimmedGoal) {
      await (db as any).roomMessages.create({
        room_id: id,
        sender_id: null,
        type: "SYSTEM",
        event_type: null,
        message: `🎯 ${userName} đã đặt mục tiêu: "${trimmedGoal}"`,
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const setReady = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized access.", 401);

    const { id } = req.params;
    const { ready } = req.body;

    if (ready === undefined) {
      throw new AppError("Ready state is required.", 400);
    }

    const room = await (db as any).disciplineRooms.findUnique(id);
    if (!room) throw new AppError("Room not found.", 404);

    if (room.status !== "LOBBY" && room.status !== "START_CONFIRM") {
      throw new AppError("Room is not in lobby phase.", 400);
    }

    // Ensure the user is a participant
    const participants = await (db as any).roomParticipants.findManyByRoomId(id);
    const userParticipant = participants.find((p: any) => p.user_id === userId);
    if (!userParticipant) {
      throw new AppError("You are not a participant in this room.", 403);
    }

    // Update ready status
    await (db as any).roomParticipants.updateByRoomAndUser(id, userId, { 
      is_ready: !!ready,
      ready_at: ready ? new Date().toISOString() : null
    });

    const user = await db.users.findUnique({ id: userId });
    const userName = user?.name || "User";

    // Post system message
    if (ready) {
      await (db as any).roomMessages.create({
        room_id: id,
        sender_id: null,
        type: "SYSTEM",
        event_type: "START_REQUESTED",
        message: `${userName} đã xác nhận bắt đầu phiên.`,
      });
    } else {
      await (db as any).roomMessages.create({
        room_id: id,
        sender_id: null,
        type: "SYSTEM",
        event_type: "START_CANCELLED",
        message: `${userName} muốn chờ thêm một chút.`,
      });
    }

    // Check if both are ready (must be 2 participants and both ready)
    const updatedParticipants = await (db as any).roomParticipants.findManyByRoomId(id);
    const readyCount = updatedParticipants.filter((p: any) => p.is_ready).length;

    if (readyCount === 2) {
      // Start the room
      await (db as any).disciplineRooms.update(id, {
        status: "ACTIVE",
        started_at: new Date().toISOString()
      });

      await (db as any).roomMessages.create({
        room_id: id,
        sender_id: null,
        type: "SYSTEM",
        event_type: "SESSION_STARTED",
        message: "Cả hai đã xác nhận. Phiên tập trung sẽ bắt đầu sau vài giây...",
      });
    } else if (readyCount === 1) {
      await (db as any).disciplineRooms.update(id, {
        status: "START_CONFIRM"
      });
    } else {
      await (db as any).disciplineRooms.update(id, {
        status: "LOBBY"
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const leaveRoom = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized access.", 401);

    const { id } = req.params;
    const room = await (db as any).disciplineRooms.findUnique(id);
    if (!room) throw new AppError("Room not found.", 404);

    const participants = await (db as any).roomParticipants.findManyByRoomId(id);
    const userParticipant = participants.find((p: any) => p.user_id === userId);
    if (!userParticipant) {
      throw new AppError("You are not a participant in this room.", 403);
    }

    if (userParticipant.role === "CREATOR") {
      // If creator leaves, room is CANCELLED
      await (db as any).disciplineRooms.update(id, { status: "CANCELLED" });

      await (db as any).roomMessages.create({
        room_id: id,
        sender_id: null,
        type: "SYSTEM",
        event_type: null,
        message: "⚠️ Chủ phòng đã rời phòng. Phòng học đã bị hủy.",
      });
    } else {
      // If partner leaves:
      // Delete partner participant
      await (db as any).roomParticipants.deleteByRoomAndUser(id, userId);

      // Update room status back to WAITING_PARTNER
      await (db as any).disciplineRooms.update(id, { status: "WAITING_PARTNER" });

      // Reset creator's ready state
      const creatorParticipant = participants.find((p: any) => p.role === "CREATOR");
      if (creatorParticipant) {
        await (db as any).roomParticipants.updateByRoomAndUser(id, creatorParticipant.user_id, {
          is_ready: false
        });
      }

      // Post system message
      await (db as any).roomMessages.create({
        room_id: id,
        sender_id: null,
        type: "SYSTEM",
        event_type: null,
        message: `⚠️ Partner đã rời khỏi phòng. Bạn có thể chờ người khác tham gia hoặc tạo phòng mới.`,
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

