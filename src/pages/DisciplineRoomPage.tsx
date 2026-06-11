import React, { useState, useEffect, useRef } from "react";
import { Camera, CameraOff, Users, Clock, Zap, Target, Award, Copy, Check, Info, Brain, Loader2, ArrowRight, Maximize2, Minimize2, ChevronRight, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";
import { useGoalStore } from "../store/goalStore";

type AIStatus = "Camera Off" | "Detecting" | "Focused" | "Reading/Writing" | "Looking Away" | "Head Down" | "Away" | "Low Confidence";
type Phase = "CREATE" | "WAITING" | "LOBBY" | "ACTIVE" | "REPORT";
type Mode = "Study" | "Deep Work";

interface SessionReport {
  duration_seconds: number;
  presence_score: number;
  focus_score: number;
  attention_score: number;
  away_count: number;
  looking_away_count: number;
  head_down_count: number;
  reading_writing_time: number;
  total_away_time: number;
  ai_confidence: number;
  xp_earned: number;
  ai_insight: string;
  metadata?: {
    timeline: any[];
    total_focused_time: number;
    total_reading_writing_time: number;
    total_looking_away_time: number;
    total_head_down_time: number;
    total_away_time: number;
    low_confidence_time: number;
    manual_checkpoint_count: number;
    mode: Mode;
  };
}

export function DisciplineRoomPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { setShowGuestAuthModal } = useGoalStore();

  useEffect(() => {
    if (!isAuthenticated) {
      setShowGuestAuthModal(true, "discipline_room");
      navigate("/");
    }
  }, [isAuthenticated, navigate, setShowGuestAuthModal]);

  if (!isAuthenticated) return null;

  return <DisciplineRoomContent />;
}

function DisciplineRoomContent() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [phase, setPhase] = useState<Phase>("CREATE");

  // Ready Lobby (Pre-Session Lobby) States
  const [localGoal, setLocalGoal] = useState("");
  const [partnerGoal, setPartnerGoal] = useState("");
  const [localReady, setLocalReady] = useState(false);
  const [partnerReady, setPartnerReady] = useState(false);
  const [readyCheckStartTime, setReadyCheckStartTime] = useState<number | null>(null);
  const [partnerName, setPartnerName] = useState("");
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const isGoalInputFocusedRef = useRef(false);
  const lastSavedLocalGoalRef = useRef("");

  // Create/Join Room State
  const [roomId, setRoomId] = useState("");
  const [title, setTitle] = useState("");
  const [mode, setMode] = useState<Mode>("Study");
  const [duration, setDuration] = useState<number>(15);
  const [isPublic, setIsPublic] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState("");
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tab state for CREATE phase
  const [activeTab, setActiveTab] = useState<"create" | "join" | "public">("create");

  // Waiting Room List State
  const [waitingRooms, setWaitingRooms] = useState<any[]>([]);
  const [isWaitingRoomsLoading, setIsWaitingRoomsLoading] = useState(false);
  const [filterMode, setFilterMode] = useState<string>("All");
  const [filterDuration, setFilterDuration] = useState<string>("All");

  // Waiting Room State
  const [inviteCode, setInviteCode] = useState("");
  const [partnerJoined, setPartnerJoined] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isCreator, setIsCreator] = useState(false);

  // Active Session State
  const [countdown, setCountdown] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [cameraStatus, setCameraStatus] = useState<AIStatus>("Detecting");
  const [focusScore, setFocusScore] = useState(100);
  const [presenceScore, setPresenceScore] = useState(100);
  const [attentionScore, setAttentionScore] = useState(100);
  const [aiConfidence, setAiConfidence] = useState(100);
  const [awayCount, setAwayCount] = useState(0);
  const [lookingAwayCount, setLookingAwayCount] = useState(0);
  const [headDownCount, setHeadDownCount] = useState(0);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // V2 New States
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [activeAlert, setActiveAlert] = useState<{ type: string; message: string; severity: 'light' | 'strong' } | null>(null);
  const [checkpoint, setCheckpoint] = useState<{ question: string; options: string[] } | null>(null);
  const [totalSeconds, setTotalSeconds] = useState(0);

  // New detailed metrics refs (for report)
  const totalFocusedSecondsRef = useRef(0);
  const totalReadingWritingSecondsRef = useRef(0);
  const totalLookingAwaySecondsRef = useRef(0);
  const totalHeadDownSecondsRef = useRef(0);
  const totalAwaySecondsRef = useRef(0);
  const lowConfidenceSecondsRef = useRef(0);
  const manualCheckpointCountRef = useRef(0);

  // Alert/Checkpoint timers & Cooldowns
  const alertCooldownsRef = useRef<{ [key: string]: number }>({});
  const lastCheckpointTimeRef = useRef(0);
  const checkpointBypassTimerRef = useRef<number | null>(null); // For "Reading/Writing" bypass after checkpoint

  const timelineEventsRef = useRef<any[]>([]);

  const addTimelineEvent = (type: string, note?: string) => {
    const lastEvent = timelineEventsRef.current[timelineEventsRef.current.length - 1];
    const now = Date.now();
    
    // If it's the same type, just update duration if it's the very next tick? 
    // Actually, let's keep it simple: create a new event only if type changes.
    if (lastEvent && lastEvent.type === type && !note) {
      lastEvent.endTime = now;
      lastEvent.durationSeconds = Math.round((now - lastEvent.startTime) / 1000);
      return;
    }

    if (lastEvent) {
      lastEvent.endTime = now;
      lastEvent.durationSeconds = Math.round((now - lastEvent.startTime) / 1000);
    }

    const newEvent = {
      type,
      startTime: now,
      mode: modeRef.current, // Use ref to get latest mode if needed
      confidence: aiConfidenceRef.current,
      note
    };
    timelineEventsRef.current.push(newEvent);
    setTimelineEvents([...timelineEventsRef.current]);
  };

  const modeRef = useRef<Mode>(mode);
  useEffect(() => { modeRef.current = mode; }, [mode]);

  const aiConfidenceRef = useRef(100);
  useEffect(() => { aiConfidenceRef.current = aiConfidence; }, [aiConfidence]);
  useEffect(() => { focusScoreRef.current = focusScore; }, [focusScore]);
  useEffect(() => { attentionScoreRef.current = attentionScore; }, [attentionScore]);
  useEffect(() => { presenceScoreRef.current = presenceScore; }, [presenceScore]);
  useEffect(() => { awayCountStateRef.current = awayCount; }, [awayCount]);
  useEffect(() => { activeAlertRef.current = activeAlert; }, [activeAlert]);

  const [isDetectorLoading, setIsDetectorLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Partner State (via server relay)
  const [partnerFrame, setPartnerFrame] = useState<string | null>(null);
  const [partnerStatus, setPartnerStatus] = useState<AIStatus>("Detecting");
  const [partnerFocusScore, setPartnerFocusScore] = useState(100);
  const [partnerPresenceScore, setPartnerPresenceScore] = useState(100);
  const [partnerAwayCount, setPartnerAwayCount] = useState(0);
  const partnerMetricsRef = useRef<{
    focusScore: number;
    presenceScore: number;
    awayCount: number;
    updatedAt: number;
  } | null>(null);

  // Chat State
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const lastMessageTimeRef = useRef<number>(0);

  // Report State
  const [serverReport, setServerReport] = useState<SessionReport | null>(null);
  // Partner final snapshot (saved before session ends for report comparison)
  const [reportPartnerName, setReportPartnerName] = useState("");
  const [reportPartnerFocusScore, setReportPartnerFocusScore] = useState<number | null>(null);
  const [reportPartnerPresenceScore, setReportPartnerPresenceScore] = useState<number | null>(null);
  const [reportPartnerAwayCount, setReportPartnerAwayCount] = useState<number | null>(null);
  const [reportPartnerGoal, setReportPartnerGoal] = useState("");

  // ─── Fetch Waiting Rooms ──────────────────────────────────────────────────
  const fetchWaitingRooms = async (silent = false) => {
    if (!silent) setIsWaitingRoomsLoading(true);
    try {
      const response = await api.get("/api/discipline-room/waiting");
      setWaitingRooms(response.data.data);
    } catch (err) {
      console.error("Failed to fetch waiting rooms", err);
    } finally {
      if (!silent) setIsWaitingRoomsLoading(false);
    }
  };

  useEffect(() => {
    if (phase === "CREATE") {
      fetchWaitingRooms();
      const interval = setInterval(() => fetchWaitingRooms(true), 10000);
      return () => clearInterval(interval);
    }
  }, [phase]);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const partnerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const detectorRef = useRef<FaceLandmarker | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const frameBroadcastIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const partnerPollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cameraStatusRef = useRef<AIStatus>("Detecting");
  const focusScoreRef = useRef(100);
  const attentionScoreRef = useRef(100);
  const presenceScoreRef = useRef(100);
  const awayCountStateRef = useRef(0);
  const activeAlertRef = useRef<{ type: string; message: string; severity: 'light' | 'strong' } | null>(null);
  // Unique per browser tab — lets the server distinguish two tabs of the same account
  const clientIdRef = useRef(`tab-${Date.now()}-${Math.random().toString(36).slice(2)}`);

  // Stats tracking refs
  const totalTicksRef = useRef(0);
  const faceDetectedTicksRef = useRef(0);
  const validAttentionTicksRef = useRef(0);
  const lastFaceTickRef = useRef(0);
  const isCurrentlyAwayRef = useRef(false);

  // New detailed metrics refs
  const lookingAwayTicksRef = useRef(0);
  const headDownTicksRef = useRef(0);
  const readingWritingTicksRef = useRef(0);
  const totalAwayTicksRef = useRef(0);
  const confidenceSumRef = useRef(0);

  // Event count refs (to avoid double counting continuous events)
  const lookingAwayCountRef = useRef(0);
  const headDownCountRef = useRef(0);
  const awayCountRef = useRef(0);
  const isCurrentlyLookingAwayRef = useRef(false);
  const isCurrentlyHeadDownRef = useRef(false);

  // Time thresholds tracking
  const stateStartTimeRef = useRef<number>(Date.now());
  const lastStatusRef = useRef<AIStatus>("Detecting");
  const rawStatusCandidateRef = useRef<AIStatus>("Detecting");
  const rawStatusStreakRef = useRef(0);
  const stableRawStatusRef = useRef<AIStatus>("Detecting");
  const smoothedConfidenceRef = useRef(100);

  // ─── Assign stream to video element ─────────────────────────────────────────
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream]);

  // ─── Cleanup on unmount ──────────────────────────────────────────────────────
  const cleanupSession = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
    if (frameBroadcastIntervalRef.current) clearInterval(frameBroadcastIntervalRef.current);
    if (partnerPollIntervalRef.current) clearInterval(partnerPollIntervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setStream(null);
  };

  useEffect(() => {
    return cleanupSession;
  }, []);

  // ─── Server-side frame relay: poll partner's frames ──────────────────────────
  useEffect(() => {
    if (phase !== "ACTIVE" || !roomId || countdown !== null) return;

    const pollPartner = async () => {
      try {
        const res = await api.get(`/api/discipline-room/${roomId}/partner-frame`, {
          params: { clientId: clientIdRef.current }
        });
        if (res.data.frame) {
          setPartnerFrame(res.data.frame);
          setPartnerStatus(res.data.status || "Focused");
        } else {
          setPartnerStatus("Camera Off");
        }

        if (res.data.hasMetrics) {
          const nextFocus = Math.max(0, Math.min(100, Math.round(Number(res.data.focusScore ?? 0))));
          const nextPresence = Math.max(0, Math.min(100, Math.round(Number(res.data.presenceScore ?? 0))));
          const nextAway = Math.max(0, Math.round(Number(res.data.awayCount ?? 0)));
          setPartnerFocusScore(nextFocus);
          setPartnerPresenceScore(nextPresence);
          setPartnerAwayCount(nextAway);
          partnerMetricsRef.current = {
            focusScore: nextFocus,
            presenceScore: nextPresence,
            awayCount: nextAway,
            updatedAt: Date.now()
          };
        }
      } catch {
        // Silently ignore network errors during polling
      }
    };

    partnerPollIntervalRef.current = setInterval(pollPartner, 500);
    return () => {
      if (partnerPollIntervalRef.current) clearInterval(partnerPollIntervalRef.current);
    };
  }, [phase, roomId, countdown]);

  // ─── Initialize face detector ────────────────────────────────────────────────
  const initDetector = async () => {
    if (detectorRef.current) return;
    setIsDetectorLoading(true);
    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
      );
      detectorRef.current = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
          delegate: "GPU"
        },
        runningMode: "IMAGE",
        numFaces: 1
      });
    } catch (err) {
      console.error("Failed to initialize face landmarker", err);
    } finally {
      setIsDetectorLoading(false);
    }
  };

  // ─── Room Management ─────────────────────────────────────────────────────────
  const handleCreateRoom = async () => {
    if (!title.trim()) {
      setError("Vui lòng nhập tên phòng trước khi tạo.");
      return;
    }
    setIsActionLoading(true);
    setError(null);
    try {
      const response = await api.post("/api/discipline-room/create", {
        title: title.trim(),
        mode,
        durationMinutes: duration,
        isPublic
      });
      const room = response.data.room;
      setRoomId(room.id);
      setInviteCode(room.invite_code);
      setIsCreator(true);
      setPhase("WAITING");
      startHeartbeat(room.id);
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể tạo phòng.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleJoinRoom = async (targetRoomId?: string) => {
    if (!inviteCodeInput && !targetRoomId) return;
    setIsActionLoading(true);
    setError(null);
    try {
      const payload: any = {};
      if (targetRoomId) {
        payload.roomId = targetRoomId;
      } else {
        payload.inviteCode = inviteCodeInput.toUpperCase();
      }

      const response = await api.post("/api/discipline-room/join", payload);
      const room = response.data.room;
      setRoomId(room.id);
      setInviteCode(room.invite_code);
      setTitle(room.title);
      setMode(room.mode as Mode);
      setDuration(room.duration_minutes);
      setIsCreator(false);
      setPhase("WAITING");
      startHeartbeat(room.id);
    } catch (err: any) {
      setError(err.response?.data?.message || "Mã mời không hợp lệ hoặc phòng đã đầy.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const syncRoomState = async (id: string) => {
    const response = await api.post(`/api/discipline-room/${id}/heartbeat`);
    const roomResp = await api.get(`/api/discipline-room/${id}`);
    const room = roomResp.data.room;
    const status = room.status || response.data.status;

    setTitle(room.title);
    setMode(room.mode as Mode);
    setDuration(room.duration_minutes);
    setInviteCode(room.invite_code || "");
    setPartnerJoined(room.participants.length >= 2);

    const currentUserId = user?.id;
    const localPart = room.participants.find((p: any) => p.user_id === currentUserId);
    const partnerPart = room.participants.find((p: any) => p.user_id !== currentUserId);

    if (localPart) {
      setLocalReady(!!localPart.is_ready);
      if (!isGoalInputFocusedRef.current) {
        const syncedGoal = localPart.goal || "";
        setLocalGoal(syncedGoal);
        lastSavedLocalGoalRef.current = syncedGoal;
      }
      setIsCreator(localPart.role === "CREATOR");
    }

    if (partnerPart) {
      setPartnerReady(!!partnerPart.is_ready);
      setPartnerGoal(partnerPart.goal || "");
      setPartnerName(partnerPart.user?.name || "Partner");
    } else {
      setPartnerReady(false);
      setPartnerGoal("");
      setPartnerName("");
    }

    if (status === "WAITING_PARTNER") {
      setPhase("WAITING");
      setReadyCheckStartTime(null);
      setShowTimeoutWarning(false);
    } else if (status === "LOBBY" || status === "READY_CHECK" || status === "START_CONFIRM") {
      setPhase("LOBBY");
      setReadyCheckStartTime((prev) => prev || Date.now());
    } else if (status === "ACTIVE") {
      setPhase("ACTIVE");
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      setCountdown((prev) => prev ?? 3);
    } else if (status === "COMPLETED") {
      setPhase("REPORT");
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
    } else if (status === "CANCELLED") {
      cleanupSession();
      resetRoom();
      setError("Phòng đã bị hủy bởi chủ phòng.");
    }
  };

  const startHeartbeat = (id: string) => {
    if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
    syncRoomState(id).catch((err) => console.error("Initial room sync failed", err));
    heartbeatIntervalRef.current = setInterval(() => {
      syncRoomState(id).catch((err) => console.error("Heartbeat failed", err));
    }, 1500);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startRealSession = async () => {
    if (!isCreator) return;
    setIsActionLoading(true);
    try {
      await api.post(`/api/discipline-room/${roomId}/start`);
    } catch (err) {
      setError("Không thể bắt đầu phiên.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // ─── Active Session: countdown ───────────────────────────────────────────────
  useEffect(() => {
    if (phase === "ACTIVE") {
      if (countdown !== null && countdown > 0) {
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timer);
      } else if (countdown === 0) {
        setCountdown(null);
        startTracking();
      }
    }
  }, [phase, countdown]);

  // ─── Start tracking session ──────────────────────────────────────────────────
  const startTracking = async () => {
    setTimeLeft(duration * 60);
    setTotalSeconds(0);
    setFocusScore(100);
    setPresenceScore(100);
    setAttentionScore(100);
    setAiConfidence(100);
    setAwayCount(0);
    focusScoreRef.current = 100;
    presenceScoreRef.current = 100;
    attentionScoreRef.current = 100;
    awayCountStateRef.current = 0;
    aiConfidenceRef.current = 100;
    activeAlertRef.current = null;
    setTimelineEvents([]);
    timelineEventsRef.current = [];
    addTimelineEvent("Session Started");

    totalFocusedSecondsRef.current = 0;
    totalReadingWritingSecondsRef.current = 0;
    totalLookingAwaySecondsRef.current = 0;
    totalHeadDownSecondsRef.current = 0;
    totalAwaySecondsRef.current = 0;
    lowConfidenceSecondsRef.current = 0;
    manualCheckpointCountRef.current = 0;
    alertCooldownsRef.current = {};
    checkpointBypassTimerRef.current = null;

    setCameraStatus("Detecting");
    cameraStatusRef.current = "Detecting";
    setCameraError(null);
    setIsCameraLoading(true);

    totalTicksRef.current = 0;
    faceDetectedTicksRef.current = 0;
    lastFaceTickRef.current = 0;
    confidenceSumRef.current = 0;
    lookingAwayTicksRef.current = 0;
    headDownTicksRef.current = 0;
    readingWritingTicksRef.current = 0;
    totalAwayTicksRef.current = 0;
    lookingAwayCountRef.current = 0;
    headDownCountRef.current = 0;
    awayCountRef.current = 0;
    isCurrentlyAwayRef.current = false;
    isCurrentlyLookingAwayRef.current = false;
    isCurrentlyHeadDownRef.current = false;
    rawStatusCandidateRef.current = "Detecting";
    rawStatusStreakRef.current = 0;
    stableRawStatusRef.current = "Detecting";
    lastStatusRef.current = "Detecting";
    stateStartTimeRef.current = Date.now();
    smoothedConfidenceRef.current = 100;
    partnerMetricsRef.current = null;
    setPartnerFrame(null);
    setPartnerStatus("Detecting");

    initDetector().catch(err => console.warn("Detector init failed", err));

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Trình duyệt không hỗ trợ truy cập camera.");
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" }
      });
      streamRef.current = mediaStream;
      setStream(mediaStream);
      setCameraStatus("Focused");
      cameraStatusRef.current = "Focused";
    } catch (err: any) {
      console.error("Camera access denied", err);
      let msg = "Không thể truy cập camera. Vui lòng cấp quyền và thử lại.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        msg = "Quyền truy cập camera bị từ chối. Vui lòng cấp quyền trong cài đặt trình duyệt.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        msg = "Không tìm thấy camera trên thiết bị của bạn.";
      }
      setCameraError(msg);
      setCameraStatus("Camera Off");
      cameraStatusRef.current = "Camera Off";
    } finally {
      setIsCameraLoading(false);
    }

    // Countdown timer
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleEndSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // AI Face detection (every 1s)
    detectionIntervalRef.current = setInterval(() => {
      runDetection();
    }, 1000);

    // Upload frame to server relay every 500ms
    frameBroadcastIntervalRef.current = setInterval(() => {
      broadcastLocalFrame();
    }, 500);
  };

  // ─── Upload local camera frame to server relay ───────────────────────────────
  const broadcastLocalFrame = () => {
    if (!videoRef.current || videoRef.current.readyState < 2 || cameraError || !roomId) return;

    const video = videoRef.current;
    const canvas = partnerCanvasRef.current || document.createElement("canvas");
    partnerCanvasRef.current = canvas;
    canvas.width = 320;
    canvas.height = 180;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const frameData = canvas.toDataURL("image/jpeg", 0.45);

    api.post(`/api/discipline-room/${roomId}/frame`, {
      frame: frameData,
      status: cameraStatusRef.current,
      focusScore: focusScoreRef.current,
      attentionScore: attentionScoreRef.current,
      presenceScore: presenceScoreRef.current,
      totalFocusedTime: totalFocusedSecondsRef.current,
      totalReadingWritingTime: totalReadingWritingSecondsRef.current,
      totalAwayTime: totalAwaySecondsRef.current,
      awayCount: awayCountStateRef.current,
      currentAlertType: activeAlertRef.current?.type || null,
      lastEventType: timelineEventsRef.current[timelineEventsRef.current.length - 1]?.type || null,
      aiConfidence: aiConfidenceRef.current,
      clientId: clientIdRef.current,
    }).catch(() => {});
  };

  // ─── Face detection ──────────────────────────────────────────────────────────
  const runDetection = () => {
    if (!detectorRef.current || !videoRef.current || videoRef.current.readyState < 2) return;

    try {
      totalTicksRef.current++;
      setTotalSeconds(prev => prev + 1);

      const result = detectorRef.current.detect(videoRef.current);
      const hasFace = result.faceLandmarks && result.faceLandmarks.length > 0;

      let currentRawStatus: AIStatus = "Away";
      let confidence = 0;

      if (hasFace) {
        faceDetectedTicksRef.current++;
        lastFaceTickRef.current = totalTicksRef.current;
        const landmarks = result.faceLandmarks[0];
        const getPoint = (index: number) => landmarks[index] || landmarks[0];
        const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

        const leftEye = getPoint(33);
        const rightEye = getPoint(263);
        const nose = getPoint(4);
        const chin = getPoint(152);
        const forehead = getPoint(10);
        const leftCheek = getPoint(234);
        const rightCheek = getPoint(454);
        const leftMouth = getPoint(61);
        const rightMouth = getPoint(291);

        const eyeCenterY = (leftEye.y + rightEye.y) / 2;
        const eyeDist = Math.max(0.001, Math.abs(rightEye.x - leftEye.x));
        const faceHeight = Math.max(0.001, Math.abs(chin.y - forehead.y));
        const faceWidth = Math.max(0.001, Math.abs(rightCheek.x - leftCheek.x));
        const faceArea = faceWidth * faceHeight;
        const noseXRatio = (nose.x - leftEye.x) / eyeDist;
        const noseYRatio = (nose.y - eyeCenterY) / Math.max(0.001, chin.y - eyeCenterY);
        const yawScore = Math.abs(noseXRatio - 0.5) * 2;
        const headDownScore = Math.max(0, noseYRatio - 0.55);
        const mouthTilt = Math.abs(leftMouth.y - rightMouth.y);
        const faceTooSmall = faceArea < 0.016 || eyeDist < 0.04;

        const isHeadDown = noseYRatio > (mode === "Study" ? 0.68 : 0.64) || (chin.y > 0.9 && noseYRatio > 0.6);
        const isLookingAway = noseXRatio < 0.33 || noseXRatio > 0.67 || yawScore > 0.42;

        const instantConfidence = clamp(
          Math.round(100 - yawScore * 34 - headDownScore * 80 - mouthTilt * 120 - (faceTooSmall ? 26 : 0)),
          20,
          100
        );
        smoothedConfidenceRef.current = Math.round(smoothedConfidenceRef.current * 0.65 + instantConfidence * 0.35);
        confidence = smoothedConfidenceRef.current;
        confidenceSumRef.current += confidence;

        if (faceTooSmall && confidence < 55) currentRawStatus = "Low Confidence";
        else if (isHeadDown) currentRawStatus = "Head Down";
        else if (isLookingAway) currentRawStatus = "Looking Away";
        else currentRawStatus = "Focused";
      } else {
        currentRawStatus = "Away";
        totalAwayTicksRef.current++;
      }

      if (currentRawStatus === rawStatusCandidateRef.current) {
        rawStatusStreakRef.current++;
      } else {
        rawStatusCandidateRef.current = currentRawStatus;
        rawStatusStreakRef.current = 1;
      }

      const requiredStableFrames = currentRawStatus === "Focused" ? 1 : currentRawStatus === "Away" ? 2 : 2;
      if (rawStatusStreakRef.current >= requiredStableFrames) {
        stableRawStatusRef.current = currentRawStatus;
      }
      currentRawStatus = stableRawStatusRef.current;

      // ─── State Machine with Mode-Aware Thresholds & Smart Alerts ────────────────
      const now = Date.now();
      const timeInCurrentRawState = (now - stateStartTimeRef.current) / 1000;
      let finalStatus: AIStatus = cameraStatusRef.current;

      const triggerAlert = (type: string, message: string, severity: 'light' | 'strong') => {
        const cooldown = alertCooldownsRef.current[type] || 0;
        if (now - cooldown > 60000) { // 60s cooldown
          setActiveAlert({ type, message, severity });
          alertCooldownsRef.current[type] = now;
          setTimeout(() => setActiveAlert(null), 5000); // Auto hide after 5s
        }
      };

      const triggerCheckpoint = (question: string, options: string[]) => {
        if (now - lastCheckpointTimeRef.current > 120000) { // 2 min cooldown
          setCheckpoint({ question, options });
          lastCheckpointTimeRef.current = now;
        }
      };

      // Check if bypass active (e.g. user said "Reading/Writing")
      const isBypassActive = checkpointBypassTimerRef.current && now < checkpointBypassTimerRef.current;

      if (currentRawStatus === "Away") {
        if (timeInCurrentRawState >= 3) {
          finalStatus = "Away";
          if (!isCurrentlyAwayRef.current) {
            isCurrentlyAwayRef.current = true;
            awayCountRef.current++;
            addTimelineEvent("Away");
          }
          triggerAlert("AWAY", "Bạn đã rời khỏi camera quá lâu!", "strong");
        }
      } else if (currentRawStatus === "Focused") {
        finalStatus = "Focused";
        if (cameraStatusRef.current !== "Focused") {
          addTimelineEvent("Focused");
        }
        isCurrentlyAwayRef.current = false;
        isCurrentlyLookingAwayRef.current = false;
        isCurrentlyHeadDownRef.current = false;
      } else if (currentRawStatus === "Head Down") {
        if (isBypassActive) {
          finalStatus = "Reading/Writing";
        } else if (mode === "Study") {
          if (timeInCurrentRawState < 35) {
            finalStatus = "Reading/Writing";
            if (cameraStatusRef.current !== "Reading/Writing") addTimelineEvent("Reading/Writing");
          } else {
            finalStatus = "Head Down";
            if (!isCurrentlyHeadDownRef.current) {
              isCurrentlyHeadDownRef.current = true;
              headDownCountRef.current++;
              addTimelineEvent("Head Down");
            }
            if (timeInCurrentRawState >= 50) {
              triggerAlert("HEAD_DOWN_STUDY", "Bạn vẫn đang đọc/ghi chép chứ?", "light");
              triggerCheckpoint("Bạn đang làm gì?", ["Đang học bài", "Đang đọc sách", "Tạm nghỉ", "Bỏ qua"]);
            }
          }
        } else {
          // Deep Work
          if (timeInCurrentRawState < 8) {
            finalStatus = "Focused";
          } else {
            finalStatus = "Head Down";
            if (!isCurrentlyHeadDownRef.current) {
              isCurrentlyHeadDownRef.current = true;
              headDownCountRef.current++;
              addTimelineEvent("Head Down");
            }
            triggerAlert("HEAD_DOWN_DEEP", "Bạn cúi xuống quá lâu trong Deep Work!", "light");
          }
        }
      } else if (currentRawStatus === "Looking Away") {
        const threshold = mode === "Study" ? 12 : 5;
        if (timeInCurrentRawState < threshold) {
          finalStatus = "Focused";
        } else {
          finalStatus = "Looking Away";
          if (!isCurrentlyLookingAwayRef.current) {
            isCurrentlyLookingAwayRef.current = true;
            lookingAwayCountRef.current++;
            addTimelineEvent("Looking Away");
          }
          triggerAlert("LOOKING_AWAY", "Hãy tập trung vào màn hình!", "light");
        }
      }

      if (currentRawStatus === "Low Confidence") {
        finalStatus = "Low Confidence";
        triggerAlert("LOW_CONFIDENCE", "Camera chưa nhìn rõ khuôn mặt. Hãy chỉnh lại ánh sáng hoặc khoảng cách.", "light");
      }

      if (currentRawStatus !== lastStatusRef.current) {
        stateStartTimeRef.current = now;
        lastStatusRef.current = currentRawStatus;
      }

      if (hasFace && confidence < 40) {
        finalStatus = "Low Confidence";
        if (cameraStatusRef.current !== "Low Confidence") addTimelineEvent("Low Confidence");
      }

      setCameraStatus(finalStatus);
      cameraStatusRef.current = finalStatus;

      // ─── Metrics Tracking (Seconds) ──────────────────────────────────────────
      if (finalStatus === "Focused") totalFocusedSecondsRef.current++;
      else if (finalStatus === "Reading/Writing") totalReadingWritingSecondsRef.current++;
      else if (finalStatus === "Head Down") totalHeadDownSecondsRef.current++;
      else if (finalStatus === "Looking Away") totalLookingAwaySecondsRef.current++;
      else if (finalStatus === "Away") totalAwaySecondsRef.current++;
      else if (finalStatus === "Low Confidence") lowConfidenceSecondsRef.current++;

      // ─── Scoring Logic ─────────────────────────────────────────────────────────
      const presence = Math.round((faceDetectedTicksRef.current / totalTicksRef.current) * 100);
      
      // Attention Score based on valid focused time
      const totalValidTime = totalFocusedSecondsRef.current + (totalReadingWritingSecondsRef.current * (mode === "Study" ? 1.0 : 0.8));
      const attention = faceDetectedTicksRef.current > 0 
        ? Math.round((totalValidTime / faceDetectedTicksRef.current) * 100)
        : 0;
      
      const avgConfidence = Math.round(confidenceSumRef.current / totalTicksRef.current);

      const nextAttention = Math.min(100, attention);
      const nextAwayCount = awayCountRef.current;
      setPresenceScore(presence);
      setAttentionScore(nextAttention);
      setAiConfidence(avgConfidence);
      setAwayCount(nextAwayCount);
      setLookingAwayCount(lookingAwayCountRef.current);
      setHeadDownCount(headDownCountRef.current);
      presenceScoreRef.current = presence;
      attentionScoreRef.current = nextAttention;
      awayCountStateRef.current = nextAwayCount;
      aiConfidenceRef.current = avgConfidence;

      // Focus Score Logic (V3: faster penalty for repeated distraction, gentler for valid study notes)
      let focus = 100;
      const penalty = 
        (totalAwaySecondsRef.current * 2.4) + 
        (totalLookingAwaySecondsRef.current * 0.9) + 
        (totalHeadDownSecondsRef.current * (mode === "Deep Work" ? 1.35 : 0.35)) +
        (lowConfidenceSecondsRef.current * 0.25) +
        (awayCountRef.current * 7) +
        (lookingAwayCountRef.current * 2) +
        (headDownCountRef.current * (mode === "Deep Work" ? 3 : 1));
      
      focus = 100 - (penalty / totalTicksRef.current * 100);
      const nextFocusScore = Math.max(0, Math.min(100, Math.round(focus)));
      setFocusScore(nextFocusScore);
      focusScoreRef.current = nextFocusScore;
    } catch (err) {
      console.error("Detection error:", err);
    }
  };

  const handleEndSession = async () => {
    const partnerMetrics = partnerMetricsRef.current;
    setReportPartnerName(partnerName);
    setReportPartnerFocusScore(partnerMetrics?.focusScore ?? null);
    setReportPartnerPresenceScore(partnerMetrics?.presenceScore ?? null);
    setReportPartnerAwayCount(partnerMetrics?.awayCount ?? null);
    setReportPartnerGoal(partnerGoal);

    cleanupSession();
    setIsActionLoading(true);
    addTimelineEvent("Session Ended");

    try {
      const timeSpent = duration * 60 - timeLeft;
      const metadata = {
        timeline: timelineEventsRef.current,
        total_focused_time: totalFocusedSecondsRef.current,
        total_reading_writing_time: totalReadingWritingSecondsRef.current,
        total_looking_away_time: totalLookingAwaySecondsRef.current,
        total_head_down_time: totalHeadDownSecondsRef.current,
        total_away_time: totalAwaySecondsRef.current,
        low_confidence_time: lowConfidenceSecondsRef.current,
        manual_checkpoint_count: manualCheckpointCountRef.current,
        mode: modeRef.current
      };

      const response = await api.post(`/api/discipline-room/${roomId}/end`, {
        durationSeconds: timeSpent,
        presenceScore: presenceScoreRef.current,
        focusScore: focusScoreRef.current,
        attentionScore: attentionScoreRef.current,
        awayCount: awayCountStateRef.current,
        lookingAwayCount: lookingAwayCountRef.current,
        headDownCount: headDownCountRef.current,
        readingWritingTime: totalReadingWritingSecondsRef.current,
        totalAwayTime: totalAwaySecondsRef.current,
        aiConfidence: aiConfidenceRef.current,
        metadata
      });
      setServerReport(response.data.report);
      setPhase("REPORT");
    } catch (err) {
      console.error("Failed to end session", err);
      setPhase("REPORT");
    } finally {
      setIsActionLoading(false);
    }
  };

  const resetRoom = () => {
    setPhase("CREATE");
    setTitle("");
    setPartnerJoined(false);
    setCameraError(null);
    setRoomId("");
    setInviteCode("");
    setInviteCodeInput("");
    setServerReport(null);
    setReportPartnerName("");
    setReportPartnerFocusScore(null);
    setReportPartnerPresenceScore(null);
    setReportPartnerAwayCount(null);
    setReportPartnerGoal("");
    setIsMaximized(false);
    setIsSidebarOpen(true);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const getChatMessages = async () => {
    if (!roomId) return;
    try {
      const after = lastMessageTimeRef.current ? new Date(lastMessageTimeRef.current).toISOString() : "";
      const url = after ? `/api/discipline-room/${roomId}/messages?after=${after}` : `/api/discipline-room/${roomId}/messages`;
      const res = await api.get(url);
      if (res.data.success && res.data.messages.length > 0) {
        setMessages(prev => {
          const newMessages = res.data.messages.filter((m: any) => !prev.find(p => p.id === m.id));
          if (newMessages.length > 0) {
             if (!isChatOpen) setUnreadCount(c => c + newMessages.length);
             return [...prev, ...newMessages];
          }
          return prev;
        });
        lastMessageTimeRef.current = new Date(res.data.messages[res.data.messages.length - 1].created_at).getTime();
        setTimeout(() => {
          if (chatScrollRef.current) {
            chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
          }
        }, 100);
      }
    } catch (err) {}
  };

  useEffect(() => {
    let interval: any;
    if ((phase === "ACTIVE" || phase === "LOBBY") && roomId) {
      interval = setInterval(getChatMessages, 2000);
      getChatMessages();
    }
    return () => clearInterval(interval);
  }, [phase, roomId]);

  useEffect(() => {
    if (phase !== "LOBBY" || !readyCheckStartTime) {
      setShowTimeoutWarning(false);
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - readyCheckStartTime;
      if (elapsed > 2 * 60 * 1000) {
        setShowTimeoutWarning(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, readyCheckStartTime]);

  const handleUpdateGoal = async (goalText: string) => {
    const trimmed = goalText.trim().substring(0, 100);
    setLocalGoal(trimmed);
    if (trimmed === lastSavedLocalGoalRef.current) return;
    try {
      await api.post(`/api/discipline-room/${roomId}/goal`, { goal: trimmed });
      lastSavedLocalGoalRef.current = trimmed;
      getChatMessages();
    } catch (err: any) {
      console.error("Failed to update goal", err);
    }
  };

  const handleToggleReady = async () => {
    const nextReady = !localReady;
    try {
      await api.post(`/api/discipline-room/${roomId}/ready`, { ready: nextReady });
      setLocalReady(nextReady);
      getChatMessages();
    } catch (err: any) {
      console.error("Failed to toggle ready", err);
    }
  };

  const handleLeaveRoom = async () => {
    try {
      await api.post(`/api/discipline-room/${roomId}/leave`);
    } catch (err: any) {
      console.error("Failed to leave room", err);
    } finally {
      cleanupSession();
      resetRoom();
    }
  };

  const sendChatMessage = async (msg: string, type: "USER"|"SYSTEM" = "USER", eventType: string = "") => {
    if (!roomId || !msg.trim()) return;
    try {
      await api.post(`/api/discipline-room/${roomId}/messages`, {
        message: msg,
        type,
        eventType
      });
      getChatMessages();
    } catch (err) {}
  };

  const handleSendChat = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;
    sendChatMessage(chatInput, "USER");
    setChatInput("");
  };

  // ─── Track Partner Status Changes for System Messages ───────────────────
  const previousPartnerStatusRef = useRef<AIStatus>("Detecting");
  useEffect(() => {
    if (phase !== "ACTIVE") return;
    if (partnerStatus === previousPartnerStatusRef.current) return;

    if (previousPartnerStatusRef.current !== "Away" && partnerStatus === "Away") {
      sendChatMessage("Partner đang Away.", "SYSTEM", "PARTNER_AWAY");
    } else if (previousPartnerStatusRef.current === "Away" && (partnerStatus === "Focused" || partnerStatus === "Reading/Writing")) {
      sendChatMessage("Partner đã quay lại Focused.", "SYSTEM", "PARTNER_FOCUSED");
    }

    previousPartnerStatusRef.current = partnerStatus;
  }, [partnerStatus, phase]);

  // ─── UI Rendering ─────────────────────────────────────────────────────────────
  const renderCreateTab = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold mb-2 ml-1">Mục tiêu của bạn</label>
        <input
          type="text"
          className="w-full px-5 py-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--color-surface)] text-[var(--color-on-surface)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all"
          placeholder="Ví dụ: Học lập trình..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2 ml-1">Chế độ</label>
        <div className="grid grid-cols-2 gap-3">
          {(["Study", "Deep Work"] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`py-3 rounded-2xl text-sm font-bold border transition-all ${mode === m ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] border-[var(--color-primary)] shadow-lg shadow-[var(--color-primary)]/20' : 'bg-transparent border-[var(--border-subtle)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]'}`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2 ml-1">Thời gian</label>
        <div className="grid grid-cols-4 gap-2">
          {[1, 5, 15, 25].map(d => (
            <button
              key={d}
              onClick={() => setDuration(d)}
              className={`py-3 rounded-2xl text-sm font-bold border transition-all ${duration === d ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] border-[var(--color-primary)] shadow-lg shadow-[var(--color-primary)]/20' : 'bg-transparent border-[var(--border-subtle)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]'}`}
            >
              {d}p
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--color-surface-container-high)] border border-[var(--border-subtle)]">
        <div className="flex items-center gap-3">
          <Users size={20} className="text-[var(--color-primary)]" />
          <div>
            <div className="text-sm font-bold">Công khai phòng</div>
            <div className="text-[10px] opacity-60">Người khác có thể thấy và tham gia</div>
          </div>
        </div>
        <button
          onClick={() => setIsPublic(!isPublic)}
          className={`w-12 h-6 rounded-full transition-all relative ${isPublic ? 'bg-[var(--color-primary)]' : 'bg-gray-400'}`}
        >
          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isPublic ? 'left-7' : 'left-1'}`}></div>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm font-medium text-center">
          {error}
        </div>
      )}

      <button
        onClick={handleCreateRoom}
        disabled={!title || isDetectorLoading || isActionLoading}
        className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 text-lg ${title && !isDetectorLoading && !isActionLoading ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:opacity-95 shadow-xl shadow-[var(--color-primary)]/30 active:scale-95' : 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] cursor-not-allowed opacity-50'}`}
      >
        {isActionLoading ? <Loader2 size={24} className="animate-spin" /> : <Zap size={24} />}
        {isActionLoading ? "Đang tạo..." : "Tạo phòng"}
      </button>
    </div>
  );

  const renderJoinTab = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold mb-2 ml-1">Mã mời (Invite Code)</label>
        <input
          type="text"
          className="w-full px-5 py-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--color-surface)] text-[var(--color-on-surface)] outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-center text-3xl font-mono font-black tracking-widest"
          placeholder="ABCDEF"
          maxLength={6}
          value={inviteCodeInput}
          onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
        />
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm font-medium text-center">
          {error}
        </div>
      )}

      <button
        onClick={() => handleJoinRoom()}
        disabled={!inviteCodeInput || isActionLoading}
        className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 text-lg ${inviteCodeInput && !isActionLoading ? 'bg-green-500 text-white hover:opacity-95 shadow-xl shadow-green-500/30 active:scale-95' : 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] cursor-not-allowed opacity-50'}`}
      >
        {isActionLoading ? <Loader2 size={24} className="animate-spin" /> : <ArrowRight size={24} />}
        {isActionLoading ? "Đang kiểm tra..." : "Vào phòng"}
      </button>
    </div>
  );

  const renderPublicTab = () => {
    const filteredRooms = waitingRooms.filter(room => {
      if (filterMode !== "All" && room.mode !== filterMode) return false;
      if (filterDuration !== "All" && room.duration_minutes !== parseInt(filterDuration)) return false;
      return true;
    });

    return (
      <div>
        <div className="flex items-center gap-2 mb-6">
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
            className="px-4 py-2 rounded-xl bg-[var(--color-surface-container-high)] border border-[var(--border-subtle)] text-xs font-bold outline-none flex-1"
          >
            <option value="All">Tất cả Mode</option>
            <option value="Study">Study</option>
            <option value="Deep Work">Deep Work</option>
          </select>
          <select
            value={filterDuration}
            onChange={(e) => setFilterDuration(e.target.value)}
            className="px-4 py-2 rounded-xl bg-[var(--color-surface-container-high)] border border-[var(--border-subtle)] text-xs font-bold outline-none flex-1"
          >
            <option value="All">Mọi thời lượng</option>
            <option value="1">1 phút</option>
            <option value="5">5 phút</option>
            <option value="15">15 phút</option>
            <option value="25">25 phút</option>
          </select>
          <button
            onClick={() => fetchWaitingRooms()}
            className="p-2 rounded-xl bg-[var(--color-surface-container-high)] border border-[var(--border-subtle)] hover:bg-[var(--color-primary-container)] transition-all"
            title="Làm mới"
          >
            {isWaitingRoomsLoading ? <Loader2 size={16} className="animate-spin text-[var(--color-primary)]" /> : <ArrowRight size={16} className="rotate-[-90deg] text-[var(--color-on-surface-variant)]" />}
          </button>
        </div>

        {isWaitingRoomsLoading && waitingRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 className="animate-spin text-[var(--color-primary)] mb-4" size={36} />
            <p className="font-medium opacity-60">Đang tìm các phòng chờ...</p>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-5 bg-[var(--color-surface-container-high)] rounded-2xl mb-4 opacity-30">
              <Users size={40} />
            </div>
            <h4 className="font-bold mb-1">Chưa có phòng chờ nào</h4>
            <p className="text-sm opacity-60 max-w-xs mt-1">Hãy tạo một phòng công khai để người khác có thể cùng tham gia!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRooms.map((room) => (
              <div
                key={room.id}
                className="p-5 rounded-2xl bg-[var(--color-surface-container-high)] border border-[var(--border-subtle)] hover:border-[var(--color-primary)]/40 transition-all flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-container)] flex items-center justify-center font-black text-[var(--color-primary)] text-sm flex-shrink-0">
                  {room.creator?.name?.substring(0, 1).toUpperCase() || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate">{room.title}</div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-[10px] opacity-60">{room.creator?.name || "Người dùng"} · Lv{room.creator?.level || 1}</span>
                    <span className="px-1.5 py-0.5 bg-[var(--color-surface)] text-[var(--color-on-surface-variant)] text-[10px] font-bold rounded-md">{room.mode}</span>
                    <span className="px-1.5 py-0.5 bg-[var(--color-surface)] text-[var(--color-on-surface-variant)] text-[10px] font-bold rounded-md">{room.duration_minutes}p</span>
                    <span className="flex items-center gap-1 text-green-500 text-[10px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                      {room.participants?.length || 1}/2
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleJoinRoom(room.id)}
                  disabled={isActionLoading}
                  className="px-5 py-2 bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded-xl font-bold text-sm shadow-lg shadow-[var(--color-primary)]/20 hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 flex-shrink-0"
                >
                  {isActionLoading ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                  Tham gia
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderCreate = () => {
    const tabs = [
      { id: "create" as const, label: "Tạo phòng", icon: <Zap size={16} /> },
      { id: "join" as const, label: "Tham gia", icon: <ArrowRight size={16} /> },
      { id: "public" as const, label: "Phòng Chờ Công Khai", icon: <Users size={16} />, badge: waitingRooms.length > 0 ? waitingRooms.length : null },
    ];

    return (
      <div className="max-w-2xl mx-auto mt-10 px-4">
        {/* Tab Bar */}
        <div className="flex gap-2 p-1.5 bg-[var(--color-surface-container)] rounded-2xl border border-[var(--border-subtle)] mb-8 shadow-sm">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-sm font-bold transition-all relative
                ${activeTab === tab.id
                  ? 'bg-[var(--color-surface)] text-[var(--color-on-surface)] shadow-md'
                  : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]'
                }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.id === 'create' ? 'Tạo' : tab.id === 'join' ? 'Tham gia' : 'Công khai'}</span>
              {tab.badge !== null && tab.badge !== undefined && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-[var(--color-primary)] text-[var(--color-on-primary)] text-[10px] font-black rounded-full flex items-center justify-center px-1 shadow">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-8 rounded-3xl bg-[var(--color-surface-container)] border border-[var(--border-subtle)] shadow-2xl">
          {activeTab === "create" && (
            <>
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-[var(--color-primary-container)] rounded-2xl shadow-inner">
                  {isDetectorLoading ? <Loader2 className="animate-spin text-[var(--color-primary)]" size={36} /> : <Camera size={36} className="text-[var(--color-primary)]" />}
                </div>
              </div>
              <h2 className="text-xl font-bold text-center mb-1">Tạo phòng mới</h2>
              <p className="text-center text-[var(--color-on-surface-variant)] mb-6 text-sm">Bắt đầu phiên tập trung của riêng bạn</p>
              {renderCreateTab()}
            </>
          )}
          {activeTab === "join" && (
            <>
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-green-500/10 rounded-2xl shadow-inner">
                  <Users size={36} className="text-green-500" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-center mb-1">Tham gia phòng</h2>
              <p className="text-center text-[var(--color-on-surface-variant)] mb-6 text-sm">Nhập mã mời để cùng tập trung với partner</p>
              {renderJoinTab()}
            </>
          )}
          {activeTab === "public" && (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Users className="text-[var(--color-primary)]" size={22} />
                    Phòng Chờ Công Khai
                  </h2>
                  <p className="text-sm text-[var(--color-on-surface-variant)] mt-0.5">Tìm partner để cùng nhau rèn luyện kỷ luật</p>
                </div>
                <span className="text-xs font-bold text-[var(--color-on-surface-variant)] opacity-60">Cập nhật mỗi 10s</span>
              </div>
              {renderPublicTab()}
            </>
          )}
        </div>
      </div>
    );
  };

  const renderWaitingRoomList = () => null;

  const renderWaiting = () => (
    <div className="max-w-md mx-auto mt-10 p-8 rounded-3xl bg-[var(--color-surface-container)] border border-[var(--border-subtle)] text-center shadow-2xl shadow-black/10">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1">{title || "Phòng tập trung"}</h2>
        <div className="flex items-center justify-center gap-2">
           <span className="px-3 py-1 bg-[var(--color-primary-container)] text-[var(--color-primary)] text-xs font-bold rounded-full">{mode}</span>
           <span className="px-3 py-1 bg-[var(--color-surface-container-highest)] text-[var(--color-on-surface-variant)] text-xs font-bold rounded-full">{duration} phút</span>
        </div>
      </div>

      <div className="p-8 bg-[var(--color-surface)] rounded-2xl border border-[var(--border-subtle)] mb-8 shadow-inner">
        <p className="text-xs font-bold text-[var(--color-on-surface-variant)] mb-3 uppercase tracking-widest">Mã mời tham gia</p>
        <div className="flex items-center justify-center gap-4">
          <span className="text-4xl font-mono font-black tracking-widest text-[var(--color-primary)]">{inviteCode}</span>
          <button onClick={copyToClipboard} className="p-3 bg-[var(--color-surface-container-high)] rounded-xl hover:bg-[var(--color-primary-container)] transition-all active:scale-90">
            {copied ? <Check size={24} className="text-green-500" /> : <Copy size={24} />}
          </button>
        </div>
      </div>

      <div className={`flex items-center justify-center gap-4 mb-8 p-5 rounded-2xl transition-all border ${partnerJoined ? "bg-green-500/10 border-green-500/30 text-green-500" : "bg-[var(--color-surface-container-highest)] border-[var(--border-subtle)]"}`}>
        {partnerJoined ? (
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg shadow-green-500/30">
               <Users size={20} />
             </div>
             <span className="font-bold">Partner đã tham gia. Đang mở sảnh trao đổi...</span>
           </div>
        ) : (
           <div className="flex items-center gap-3">
             <Loader2 size={24} className="animate-spin text-[var(--color-on-surface-variant)]" />
             <span className="font-medium text-[var(--color-on-surface-variant)]">Đang đợi partner vào phòng...</span>
           </div>
        )}
      </div>

      <div className="text-sm font-medium text-[var(--color-on-surface-variant)]">
        {partnerJoined ? "Bạn sẽ vào sảnh để trao đổi trước khi camera AI bắt đầu." : "Gửi mã mời cho bạn bè để bắt đầu."}
      </div>
      <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] flex justify-center">
        <button
          onClick={handleLeaveRoom}
          className="w-full py-2.5 rounded-xl text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all active:scale-95 animate-fade-in"
        >
          {isCreator ? "Hủy phòng" : "Rời phòng"}
        </button>
      </div>
    </div>
  );
  const getStatusLabel = (status: AIStatus) => {
    const labels: Record<AIStatus, string> = {
      "Camera Off": "Tắt camera",
      Detecting: "Đang nhận diện",
      Focused: "Đang tập trung",
      "Reading/Writing": "Đọc / ghi chép",
      "Looking Away": "Nhìn ra ngoài",
      "Head Down": "Cúi đầu",
      Away: "Rời chỗ",
      "Low Confidence": "Tín hiệu yếu"
    };
    return labels[status] || status;
  };

  const renderAICoachStats = (isOverlay = false) => {
    const cardClass = isOverlay
      ? "p-5 rounded-2xl bg-white/5 border border-white/10 text-white shadow-xl"
      : "p-5 rounded-2xl bg-[var(--color-surface-container)] border border-[var(--border-subtle)] shadow-lg overflow-y-auto max-h-[52vh]";

    const headingClass = isOverlay
      ? "font-black text-xs text-white/50 mb-4 uppercase tracking-[0.2em]"
      : "font-black text-xs text-[var(--color-on-surface-variant)] mb-6 uppercase tracking-[0.2em]";

    const textClass = isOverlay ? "text-white" : "text-[var(--color-on-surface)]";
    const primaryTextClass = isOverlay ? "text-white" : "text-[var(--color-primary)]";
    const fillBgClass = isOverlay ? "bg-white/10" : "bg-[var(--color-surface-container-high)]";
    const fillPrimaryGradient = isOverlay 
      ? "bg-gradient-to-r from-emerald-400 to-blue-400" 
      : "bg-gradient-to-r from-[var(--color-primary)] to-blue-400";

    const itemBgClass = (type: "red" | "yellow" | "orange") => {
      if (type === "red") {
        return isOverlay ? "bg-red-500/10 border-red-500/20 text-red-200" : "bg-red-500/5 border-red-500/10 text-red-500";
      }
      if (type === "yellow") {
        return isOverlay ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-200" : "bg-yellow-500/5 border-yellow-500/10 text-yellow-500";
      }
      return isOverlay ? "bg-orange-500/10 border-orange-500/20 text-orange-200" : "bg-orange-500/5 border-orange-500/10 text-orange-500";
    };

    return (
      <div className={cardClass}>
        <h3 className={headingClass}>AI Coach</h3>

        <div className="space-y-6">
          <div className="relative">
            <div className="flex justify-between items-end mb-2">
              <span className={`text-sm font-bold uppercase tracking-wider ${isOverlay ? "text-white/70" : "opacity-80"}`}>Điểm tập trung</span>
              <span className={`text-3xl font-black ${primaryTextClass}`}>{focusScore}%</span>
            </div>
            <div className={`w-full h-4 ${fillBgClass} rounded-full overflow-hidden p-1 shadow-inner`}>
              <div className={`h-full ${fillPrimaryGradient} rounded-full transition-all duration-1000 ease-out`} style={{ width: `${focusScore}%` }}></div>
            </div>
            {focusScore < 70 && <p className="text-[10px] text-red-400 font-bold mt-2 animate-pulse">Mức độ tập trung đang thấp!</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-end mb-1">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${isOverlay ? "text-white/50" : "opacity-70"}`}>Hiện diện</span>
                <span className="text-sm font-black">{presenceScore}%</span>
              </div>
              <div className={`w-full h-1.5 ${fillBgClass} rounded-full overflow-hidden shadow-inner`}>
                <div className="h-full bg-blue-400 transition-all duration-1000" style={{ width: `${presenceScore}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-end mb-1">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${isOverlay ? "text-white/50" : "opacity-70"}`}>Chú ý</span>
                <span className="text-sm font-black">{attentionScore}%</span>
              </div>
              <div className={`w-full h-1.5 ${fillBgClass} rounded-full overflow-hidden shadow-inner`}>
                <div className="h-full bg-green-400 transition-all duration-1000" style={{ width: `${attentionScore}%` }}></div>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className={`flex justify-between items-center p-3 rounded-2xl border ${itemBgClass("red")}`}>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Rời chỗ</span>
              <span className="text-xl font-black">{awayCount}</span>
            </div>
            <div className={`flex justify-between items-center p-3 rounded-2xl border ${itemBgClass("yellow")}`}>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Nhìn ra ngoài</span>
              <span className="text-xl font-black">{lookingAwayCount}</span>
            </div>
            <div className={`flex justify-between items-center p-3 rounded-2xl border ${itemBgClass("orange")}`}>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Cúi đầu</span>
              <span className="text-xl font-black">{headDownCount}</span>
            </div>
          </div>

          <div>
             <div className="flex justify-between items-end mb-1">
              <span className={`text-[10px] font-bold uppercase tracking-widest ${isOverlay ? "text-white/50" : "opacity-70"}`}>Độ tin cậy AI</span>
              <span className="text-sm font-black">{aiConfidence}%</span>
            </div>
            <div className={`w-full h-1.5 ${fillBgClass} rounded-full overflow-hidden shadow-inner`}>
              <div className="h-full bg-indigo-400 transition-all duration-1000" style={{ width: `${aiConfidence}%` }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPartnerStats = (isOverlay = false) => {
    const cardClass = isOverlay
      ? "p-5 rounded-2xl bg-white/5 border border-white/10 text-white shadow-xl flex flex-col gap-4"
      : "p-5 rounded-2xl bg-[var(--color-surface-container)] border border-[var(--border-subtle)] shadow-lg flex flex-col gap-4 max-h-[52vh]";

    const headingClass = isOverlay
      ? "font-black text-xs text-white/50 uppercase tracking-[0.2em]"
      : "font-black text-xs text-[var(--color-on-surface-variant)] mb-4 uppercase tracking-[0.2em]";

    const itemBg = isOverlay
      ? "bg-white/5 border border-white/10"
      : "bg-[var(--color-surface)] border border-[var(--border-subtle)]";

    const labelClass = isOverlay
      ? "text-[9px] font-bold text-white/50 uppercase mb-1"
      : "text-[9px] font-bold text-[var(--color-on-surface-variant)] uppercase mb-1";

    return (
      <div className={cardClass}>
        <div>
          <h3 className={headingClass}>Camera partner</h3>
          <div className={`flex items-center gap-4 p-3 rounded-2xl ${itemBg} mt-3 mb-4`}>
            <div className="w-14 h-14 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-blue-500/20 shrink-0">
              {partnerFrame ? (
                <img src={partnerFrame} alt="Partner preview" className="h-full w-full object-cover scale-x-[-1]" />
              ) : (
                "P"
              )}
            </div>
            <div className="overflow-hidden w-full">
              <div className="font-bold truncate text-lg">Partner</div>
              <div className={`text-[10px] font-black flex items-center gap-1 uppercase tracking-tighter ${
                partnerStatus === "Camera Off" ? (isOverlay ? "text-white/40" : "text-gray-500") : 
                partnerStatus === "Away" ? "text-red-500" : 
                partnerStatus === "Focused" || partnerStatus === "Reading/Writing" ? "text-green-500" : "text-yellow-500"}`}>
                <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                  partnerStatus === "Camera Off" ? (isOverlay ? "bg-white/40" : "bg-gray-500") : 
                  partnerStatus === "Away" ? "bg-red-500" : 
                  partnerStatus === "Focused" || partnerStatus === "Reading/Writing" ? "bg-green-500" : "bg-yellow-500"}`}></div>
                {partnerFrame ? getStatusLabel(partnerStatus) : "Đang chờ camera"}
              </div>
            </div>
          </div>

          {/* Partner Stats Overlay/Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className={`${itemBg} rounded-xl p-2 text-center`}>
              <div className={labelClass}>Tập trung</div>
              <div className={`text-sm font-black ${partnerFocusScore >= 80 ? "text-green-500" : partnerFocusScore >= 50 ? "text-yellow-500" : "text-red-500"}`}>{partnerFocusScore}%</div>
            </div>
            <div className={`${itemBg} rounded-xl p-2 text-center`}>
              <div className={labelClass}>Hiện diện</div>
              <div className="text-sm font-black text-blue-500">{partnerPresenceScore}%</div>
            </div>
            <div className={`${itemBg} rounded-xl p-2 text-center`}>
              <div className={labelClass}>Rời chỗ</div>
              <div className="text-sm font-black text-red-500">{partnerAwayCount}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const getDisplayMessage = (message: string) => {
    if (!message) return "";
    if (message.includes('đã đặt mục tiêu: ""')) return "";
    if (message.includes('?? tham gia') || (message.includes('Partner') && message.includes('tham gia ph'))) {
      return "Partner đã tham gia phòng. Hãy trao đổi mục tiêu trước khi bắt đầu phiên.";
    }
    return message;
  };

  const renderChatBox = (isOverlay = false) => {
    const containerClass = isOverlay
      ? "h-[300px] flex flex-col bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-inner shrink-0"
      : "h-[240px] flex flex-col bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden shadow-inner shrink-0";

    const headerClass = isOverlay
      ? "bg-white/5 px-4 py-2 border-b border-white/10 flex items-center justify-between cursor-pointer text-white"
      : "bg-[var(--color-surface-container-high)] px-4 py-2 border-b border-[var(--border-subtle)] flex items-center justify-between cursor-pointer text-[var(--color-on-surface)]";

    const titleClass = isOverlay
      ? "text-xs font-bold uppercase tracking-wider text-white/70"
      : "text-xs font-bold uppercase tracking-wider text-[var(--color-on-surface-variant)]";

    const chatBg = isOverlay
      ? "flex-1 overflow-y-auto p-3 space-y-3 bg-black/45"
      : "flex-1 overflow-y-auto p-3 space-y-3 bg-[var(--color-surface)]/50";

    const inputFormClass = isOverlay
      ? "p-2 border-t border-white/10 bg-white/5 flex items-center gap-2"
      : "p-2 border-t border-[var(--border-subtle)] bg-[var(--color-surface-container)] flex items-center gap-2";

    const inputClass = isOverlay
      ? "flex-1 bg-black/40 text-white placeholder-white/40 text-sm px-3 py-2 rounded-xl outline-none border border-white/10 focus:border-[var(--color-primary)] transition-all"
      : "flex-1 bg-[var(--color-surface)] text-sm px-3 py-2 rounded-xl outline-none border border-[var(--border-subtle)] focus:border-[var(--color-primary)] transition-all";

    const systemMsgClass = isOverlay
      ? "text-[10px] px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full font-bold shadow-sm"
      : "text-[10px] px-3 py-1 bg-yellow-500/10 text-yellow-600 rounded-full font-bold shadow-sm";

    const userMsgClass = isOverlay
      ? "bg-white/10 px-3 py-2 rounded-2xl rounded-tl-sm max-w-[90%] shadow-sm border border-white/5 text-white"
      : "bg-[var(--color-surface-container-high)] px-3 py-2 rounded-2xl rounded-tl-sm max-w-[90%] shadow-sm border border-[var(--border-subtle)]";

    const senderNameClass = isOverlay
      ? "text-[9px] font-black text-white/50 mb-0.5"
      : "text-[9px] font-black text-[var(--color-on-surface-variant)] mb-0.5";

    return (
      <div className={containerClass}>
        <div 
          className={headerClass}
          onClick={() => {
             setIsChatOpen(!isChatOpen);
             if (!isChatOpen) setUnreadCount(0);
          }}
        >
          <span className={titleClass}>Trò chuyện</span>
          <div className="flex items-center gap-2">
            {!isChatOpen && unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>
            )}
            <span className="text-xs opacity-50">{isChatOpen ? '▼' : '▲'}</span>
          </div>
        </div>
        
        {isChatOpen && (
          <>
            <div ref={chatScrollRef} className={chatBg}>
              {messages.length === 0 ? (
                <div className={`text-center text-xs italic mt-4 ${isOverlay ? 'text-white/45' : 'text-[var(--color-on-surface-variant)]'}`}>Chưa có tin nhắn nào.</div>
              ) : (
                messages.map(msg => {
                  const displayMessage = getDisplayMessage(msg.message);
                  if (!displayMessage) return null;

                  return (
                    <div key={msg.id} className={`flex flex-col ${msg.type === 'SYSTEM' ? 'items-center' : 'items-start'}`}>
                      {msg.type === 'SYSTEM' ? (
                        <span className={systemMsgClass}>{displayMessage}</span>
                      ) : (
                        <div className={userMsgClass}>
                          <div className={senderNameClass}>{msg.senderName || 'Unknown'}</div>
                          <div className="text-sm leading-snug">{displayMessage}</div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            <form onSubmit={handleSendChat} className={inputFormClass}>
              <input 
                type="text" 
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Nhập tin nhắn..."
                maxLength={200}
                className={inputClass}
              />
              <button 
                type="submit" 
                disabled={!chatInput.trim()}
                className="p-2 bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded-xl disabled:opacity-50 transition-all hover:bg-[var(--color-primary)]/90"
              >
                <ArrowRight size={16} />
              </button>
            </form>
          </>
        )}
      </div>
    );
  };

  const renderLobby = () => {
    return (
      <div className="max-w-[1200px] mx-auto mt-6 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
          <div className="p-8 rounded-3xl bg-[var(--color-surface-container)] border border-[var(--border-subtle)] shadow-2xl relative">
            {showTimeoutWarning && (
              <div className="absolute inset-0 bg-[var(--color-surface-container)]/95 backdrop-blur-md rounded-3xl z-50 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
                <div className="p-4 bg-yellow-500/10 text-yellow-500 rounded-full mb-4 animate-bounce">
                  <Clock size={40} />
                </div>
                <h3 className="text-xl font-bold mb-2 text-yellow-500">Chờ hơi lâu rồi</h3>
                <p className="text-sm text-[var(--color-on-surface-variant)] mb-6 max-w-sm">
                  Bạn đã ở sảnh hơn 2 phút. Hãy nhắn partner chuẩn bị hoặc rời phòng nếu cần tạo phiên khác.
                </p>
                <div className="flex gap-4 w-full max-w-xs">
                  <button onClick={() => { setReadyCheckStartTime(Date.now()); setShowTimeoutWarning(false); }} className="flex-1 py-3 bg-[var(--color-surface-container-high)] border border-[var(--border-subtle)] text-sm font-bold rounded-2xl hover:bg-[var(--color-surface-container-highest)] transition-all active:scale-95">
                    Tiếp tục chờ
                  </button>
                  <button onClick={handleLeaveRoom} className="flex-1 py-3 bg-red-500 text-white text-sm font-bold rounded-2xl hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 active:scale-95">
                    Rời phòng
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6 pb-6 border-b border-[var(--border-subtle)]">
              <div>
                <h2 className="text-2xl font-black mb-1">Sảnh trao đổi trước phiên</h2>
                <p className="text-sm text-[var(--color-on-surface-variant)] max-w-2xl">
                  Cả hai đã vào phòng. Hãy thống nhất mục tiêu, chuẩn bị tài liệu và chỉ bấm xác nhận khi đã hiểu rằng camera AI sẽ bắt đầu sau bước này.
                </p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-surface-container-high)] border border-[var(--border-subtle)] rounded-2xl text-xs font-bold shrink-0">
                <Users size={14} className="text-[var(--color-primary)]" />
                <span>2/2 người tham gia</span>
              </div>
            </div>

            <div className="mb-8 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 text-blue-500">
              <div className="flex items-start gap-3">
                <Info size={20} className="shrink-0 mt-0.5" />
                <div>
                  <div className="font-black text-sm">Thông báo bắt đầu phiên</div>
                  <p className="text-sm mt-1 leading-relaxed">Khi cả hai bấm “Tôi đã hiểu và sẵn sàng”, hệ thống mới đếm ngược và bật camera AI. Trước đó hai bạn có thể trao đổi thoải mái trong chat.</p>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-xs font-black uppercase tracking-widest text-[var(--color-on-surface-variant)] mb-4">Checklist gợi ý</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {["Thống nhất mục tiêu của phiên", "Chuẩn bị tài liệu học tập hoặc công việc", "Đặt điện thoại ở chế độ im lặng", "Kiểm tra ánh sáng và vị trí camera"].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-2xl bg-[var(--color-surface)] border border-[var(--border-subtle)]">
                    <div className="w-5 h-5 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">✓</div>
                    <span className="text-xs font-medium leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6 mb-8 p-6 bg-[var(--color-surface)] rounded-2xl border border-[var(--border-subtle)]">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[var(--color-on-surface-variant)] mb-2">Mục tiêu phiên của bạn</label>
                <input
                  type="text"
                  maxLength={100}
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--color-surface-container-high)] text-sm font-semibold outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all"
                  placeholder="Ví dụ: Hoàn thành US-31 hoặc học React 25 phút"
                  value={localGoal}
                  onFocus={() => {
                    isGoalInputFocusedRef.current = true;
                  }}
                  onChange={(e) => setLocalGoal(e.target.value)}
                  onBlur={() => {
                    void handleUpdateGoal(localGoal).finally(() => {
                      isGoalInputFocusedRef.current = false;
                    });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.currentTarget.blur();
                    }
                  }}
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[var(--color-on-surface-variant)] mb-2">Mục tiêu của {partnerName || "Partner"}</label>
                <div className="px-4 py-3 rounded-xl bg-[var(--color-surface-container-high)] text-sm font-semibold text-[var(--color-on-surface-variant)] italic border border-[var(--border-subtle)]">{partnerGoal ? '"' + partnerGoal + '"' : "Partner chưa nhập mục tiêu."}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className={`p-4 rounded-2xl border text-center ${localReady ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-[var(--color-surface)] border-[var(--border-subtle)]'}`}>
                <div className="text-[10px] font-black uppercase tracking-wider opacity-60">Bạn</div>
                <div className="text-sm font-bold mt-1">{localReady ? "Đã xác nhận" : "Đang trao đổi"}</div>
              </div>
              <div className={`p-4 rounded-2xl border text-center ${partnerReady ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-[var(--color-surface)] border-[var(--border-subtle)]'}`}>
                <div className="text-[10px] font-black uppercase tracking-wider opacity-60">{partnerName || "Partner"}</div>
                <div className="text-sm font-bold mt-1">{partnerReady ? "Đã xác nhận" : "Đang trao đổi"}</div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4">
              <button onClick={handleToggleReady} className={`w-full py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2 shadow-xl ${localReady ? 'bg-amber-500 text-white shadow-amber-500/25 hover:opacity-90 active:scale-95' : 'bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-[var(--color-primary)]/25 hover:opacity-90 active:scale-95'}`}>
                {localReady ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                {localReady ? "Đã xác nhận, đang chờ partner" : "Tôi đã hiểu và sẵn sàng"}
              </button>
              <div className="text-xs font-bold text-center">
                {!localReady && !partnerReady && <span className="text-[var(--color-on-surface-variant)]">Hãy trao đổi mục tiêu trước. Camera AI chưa chạy ở bước này.</span>}
                {localReady && !partnerReady && <span className="text-green-500">Bạn đã xác nhận. Đang chờ partner xác nhận đã hiểu...</span>}
                {!localReady && partnerReady && <span className="text-amber-500 animate-pulse">Partner đã xác nhận. Hãy bấm xác nhận nếu bạn cũng đã chuẩn bị xong.</span>}
                {localReady && partnerReady && <span className="text-green-500 animate-bounce">Cả hai đã xác nhận. Phiên sẽ bắt đầu sau ít giây...</span>}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-[var(--border-subtle)] flex justify-end">
              <button onClick={handleLeaveRoom} className="px-5 py-2.5 rounded-xl text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all">Rời phòng</button>
            </div>
          </div>

          <div className="space-y-4 xl:sticky xl:top-4 self-start">
            <div className="p-4 rounded-2xl bg-[var(--color-surface-container-high)] border border-[var(--border-subtle)] shadow">
              <h3 className="text-xs font-black uppercase tracking-widest text-[var(--color-on-surface-variant)] mb-2">Thông tin phòng</h3>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between gap-3"><span className="opacity-60">Phòng:</span><span className="font-bold text-right">{title}</span></div>
                <div className="flex justify-between"><span className="opacity-60">Chế độ:</span><span className="font-bold text-[var(--color-primary)]">{mode}</span></div>
                <div className="flex justify-between"><span className="opacity-60">Thời lượng:</span><span className="font-bold">{duration} phút</span></div>
              </div>
            </div>
            {renderChatBox(false)}
          </div>
        </div>
      </div>
    );
  };
  const renderActive = () => (
    <div className="max-w-[1360px] mx-auto mt-2 p-3 md:p-5">
      {countdown !== null ? (
        <div className="flex flex-col items-center justify-center h-[70vh]">
          <div className="relative">
             <div className="absolute inset-0 bg-[var(--color-primary)] rounded-full blur-3xl opacity-20 animate-pulse"></div>
             <div className="relative text-[12rem] font-black text-[var(--color-primary)] drop-shadow-2xl">{countdown}</div>
          </div>
          <h2 className="text-3xl font-bold text-[var(--color-on-surface-variant)] mt-8 animate-bounce">Tập trung nào!</h2>
        </div>
      ) : (
        <div className={`grid grid-cols-1 gap-5 ${isMaximized ? '' : 'xl:grid-cols-[minmax(0,1fr)_320px]'}`}>
          <div className={`${isMaximized ? 'w-full' : ''} space-y-4`}>
            {/* Header Card */}
            {!isMaximized && (
              <div className="p-4 md:p-5 rounded-2xl bg-[var(--color-surface-container)] border border-[var(--border-subtle)] shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[var(--color-primary-container)] rounded-2xl">
                    <Target size={28} className="text-[var(--color-primary)]" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold">{title}</h2>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold rounded-md uppercase tracking-wider">{mode}</span>
                      <span className="text-xs px-2 py-0.5 bg-blue-500/10 text-blue-500 font-bold rounded-md uppercase tracking-wider">AI đang theo dõi</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-4xl md:text-5xl font-mono font-black tracking-tighter text-[var(--color-primary)]">
                    {formatTime(timeLeft)}
                  </div>
                  <span className="text-[10px] font-bold text-[var(--color-on-surface-variant)] uppercase tracking-[0.2em] mt-1 mr-1">Thời gian còn lại</span>
                </div>
              </div>
            )}

            {!isMaximized && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--color-surface-container)] p-4">
                  <div className="text-[10px] font-black uppercase tracking-widest text-[var(--color-on-surface-variant)]">Trạng thái</div>
                  <div className="mt-1 text-sm font-black text-[var(--color-primary)]">{getStatusLabel(cameraStatus)}</div>
                </div>
                <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--color-surface-container)] p-4">
                  <div className="text-[10px] font-black uppercase tracking-widest text-[var(--color-on-surface-variant)]">Tập trung</div>
                  <div className="mt-1 text-2xl font-black">{focusScore}%</div>
                </div>
                <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--color-surface-container)] p-4">
                  <div className="text-[10px] font-black uppercase tracking-widest text-[var(--color-on-surface-variant)]">Partner</div>
                  <div className="mt-1 text-sm font-black">{partnerFrame ? getStatusLabel(partnerStatus) : "Đang chờ"}</div>
                </div>
                <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--color-surface-container)] p-4">
                  <div className="text-[10px] font-black uppercase tracking-widest text-[var(--color-on-surface-variant)]">Cảnh báo</div>
                  <div className="mt-1 text-2xl font-black text-red-500">{awayCount + lookingAwayCount + headDownCount}</div>
                </div>
              </div>
            )}

            {/* Camera View */}
            <div className={`overflow-hidden bg-black transition-all duration-300 flex items-center justify-center
              ${isMaximized 
                ? 'fixed inset-0 z-[100] w-screen h-screen rounded-none border-none' 
                : 'relative rounded-3xl aspect-video border-2 border-[var(--border-subtle)] shadow-xl'
              }`}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover scale-x-[-1] ${cameraError ? 'hidden' : 'block'}`}
              />

              {/* Maximize toggle button when NOT maximized */}
              {!isMaximized && (
                <button
                  onClick={() => {
                    setIsMaximized(true);
                    setIsSidebarOpen(true);
                  }}
                  className="absolute top-6 right-6 z-50 p-2.5 bg-black/50 hover:bg-black/75 backdrop-blur-md border border-white/10 text-white rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center"
                  title="Phóng to màn hình"
                >
                  <Maximize2 size={18} />
                </button>
              )}

              {/* Timer & Room Title Overlay when Maximized */}
              {isMaximized && (
                <div className="absolute top-6 left-6 z-50 flex items-center gap-4 bg-black/60 backdrop-blur-md px-5 py-2.5 rounded-3xl border border-white/20 text-white shadow-2xl animate-fade-in">
                  <div className="p-2 bg-[var(--color-primary)]/20 rounded-xl">
                    <Target size={18} className="text-[var(--color-primary)]" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-xs truncate max-w-[120px]">{title}</div>
                    <div className="text-[9px] opacity-65 font-bold uppercase tracking-wider">{mode}</div>
                  </div>
                  <div className="h-6 w-[1px] bg-white/20"></div>
                  <div className="text-2xl font-mono font-black text-[var(--color-primary)]">
                    {formatTime(timeLeft)}
                  </div>
                  <div className="h-6 w-[1px] bg-white/20"></div>
                  <button
                    onClick={() => setIsMaximized(false)}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-all text-white/80 hover:text-white flex items-center justify-center cursor-pointer"
                    title="Thu nhỏ"
                  >
                    <Minimize2 size={16} />
                  </button>
                </div>
              )}

              {/* Sidebar toggle tab when maximized and sidebar is closed */}
              {isMaximized && !isSidebarOpen && (
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-[55] p-3 bg-black/60 hover:bg-black/80 backdrop-blur-md border-y border-l border-white/20 text-white rounded-l-2xl transition-all shadow-2xl flex items-center justify-center animate-pulse"
                  title="Mở thanh thông số"
                >
                  <ChevronLeft size={20} />
                </button>
              )}

              {/* Maximized Overlay Sidebar */}
              {isMaximized && (
                <div 
                  className={`absolute right-4 top-4 bottom-4 w-[360px] z-50 flex flex-col gap-4 overflow-y-auto p-4 rounded-3xl bg-black/70 border border-white/10 text-white backdrop-blur-md transition-all duration-300 shadow-2xl custom-scrollbar
                    ${isSidebarOpen ? 'translate-x-0 opacity-100' : 'translate-x-[400px] opacity-0 pointer-events-none'}`}
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-white/60">Bảng điều khiển</span>
                    <button
                      onClick={() => setIsSidebarOpen(false)}
                      className="p-1.5 hover:bg-white/10 rounded-lg transition-all text-white/60 hover:text-white flex items-center justify-center cursor-pointer"
                      title="Thu gọn"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                  <div className="flex-1 space-y-4 overflow-y-auto pr-1 custom-scrollbar">
                    {renderChatBox(true)}
                    {renderAICoachStats(true)}
                    {renderPartnerStats(true)}
                  </div>
                  <button
                    onClick={handleEndSession}
                    disabled={isActionLoading}
                    className="w-full py-3.5 rounded-2xl font-black text-sm bg-red-500/20 hover:bg-red-500 text-red-200 hover:text-white border border-red-500/30 hover:border-red-500 transition-all shadow-lg active:scale-95"
                  >
                    {isActionLoading ? <Loader2 size={18} className="animate-spin mx-auto" /> : "Kết thúc sớm"}
                  </button>
                </div>
              )}

              {/* Smart Alert Notification */}
              {activeAlert && (
                <div className={`absolute ${isMaximized ? 'top-28' : 'top-20'} left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce border-2 backdrop-blur-md
                  ${activeAlert.severity === 'strong' ? 'bg-red-500/90 text-white border-red-400' : 'bg-yellow-500/90 text-black border-yellow-400'}`}
                >
                  <Zap size={24} className={activeAlert.severity === 'strong' ? 'text-white' : 'text-black'} />
                  <span className="font-bold">{activeAlert.message}</span>
                </div>
              )}

              {/* Manual Checkpoint Overlay */}
              {checkpoint && (
                <div className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
                  <div className="bg-[var(--color-surface)] p-8 rounded-[2.5rem] border-2 border-[var(--color-primary)] shadow-2xl max-w-sm w-full text-center">
                    <div className="w-16 h-16 bg-[var(--color-primary-container)] rounded-full flex items-center justify-center mx-auto mb-6">
                      <Brain size={32} className="text-[var(--color-primary)]" />
                    </div>
                    <h3 className="text-xl font-bold mb-6">{checkpoint.question}</h3>
                    <div className="grid grid-cols-1 gap-3">
                      {checkpoint.options.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => {
                            addTimelineEvent("Manual Checkpoint", `User selected: ${opt}`);
                            manualCheckpointCountRef.current++;
                            if (opt === "Đang học bài" || opt === "Đang đọc sách" || opt === "Đang tập trung") {
                              checkpointBypassTimerRef.current = Date.now() + 180000; // 3 min bypass
                            }
                            setCheckpoint(null);
                          }}
                          className="py-3 px-4 bg-[var(--color-surface-container-high)] hover:bg-[var(--color-primary)] hover:text-[var(--color-on-primary)] rounded-2xl font-bold transition-all"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {isCameraLoading && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black">
                  <Loader2 size={64} className="animate-spin text-[var(--color-primary)] mb-4" />
                  <p className="text-white font-medium">Đang khởi động camera...</p>
                </div>
              )}

              {cameraError && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black p-8 text-center">
                  <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
                    <CameraOff size={40} className="text-red-500" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Lỗi camera</h3>
                  <p className="text-white/60 text-sm mb-6">{cameraError}</p>
                  <button onClick={startTracking} className="px-6 py-2 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors">Thử lại</button>
                </div>
              )}

              {/* Status HUD */}
              <div className={`absolute ${isMaximized ? 'top-28 left-6' : 'top-6 left-6'} flex flex-col gap-3 z-50 transition-all duration-300`}>
                <div className={`px-5 py-2 rounded-2xl text-sm font-black backdrop-blur-xl flex flex-col gap-1 border-2 transition-all duration-300
                  ${cameraStatus === 'Focused' ? 'bg-green-500/20 text-green-400 border-green-500/40 shadow-lg shadow-green-500/20' :
                    cameraStatus === 'Reading/Writing' ? 'bg-blue-500/20 text-blue-400 border-blue-500/40 shadow-lg shadow-blue-500/20' :
                    cameraStatus === 'Away' ? 'bg-red-500/40 text-red-200 border-red-500/60 shadow-2xl shadow-red-500/40 scale-110' :
                    cameraStatus === 'Looking Away' || cameraStatus === 'Head Down' ? 'bg-yellow-500/30 text-yellow-200 border-yellow-500/60 shadow-xl' :
                    cameraStatus === 'Detecting' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40' :
                    cameraStatus === 'Low Confidence' ? 'bg-orange-500/20 text-orange-400 border-orange-500/40' :
                    'bg-gray-500/20 text-gray-400 border-gray-500/40'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      cameraStatus === 'Focused' || cameraStatus === 'Reading/Writing' ? 'bg-green-400' : 
                      cameraStatus === 'Away' ? 'bg-red-400' : 
                      cameraStatus === 'Detecting' || cameraStatus === 'Looking Away' || cameraStatus === 'Head Down' ? 'bg-yellow-400' : 
                      cameraStatus === 'Low Confidence' ? 'bg-orange-400' :
                      'bg-gray-400'} animate-pulse`}></div>
                    <span className="uppercase tracking-widest">{getStatusLabel(cameraStatus)}</span>
                  </div>
                  {cameraStatus === 'Reading/Writing' && <span className="text-[10px] opacity-80 font-medium">Đang đọc hoặc ghi chép hợp lệ</span>}
                  {cameraStatus === 'Low Confidence' && <span className="text-[10px] opacity-80 font-medium">Hãy điều chỉnh ánh sáng</span>}
                </div>

                {cameraStatus === 'Away' && (
                  <div className="bg-red-500 text-white px-4 py-1.5 rounded-xl text-xs font-bold animate-bounce shadow-xl">Hãy quay lại làm việc</div>
                )}
                {(cameraStatus === 'Looking Away' || cameraStatus === 'Head Down') && (
                  <div className="bg-yellow-500 text-black px-4 py-1.5 rounded-xl text-xs font-bold animate-pulse shadow-xl">Hãy tập trung lại nào</div>
                )}
              </div>

              {/* Partner mini overlay */}
              <div className={`absolute bottom-6 aspect-video bg-black/40 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden shadow-2xl transition-all duration-300
                ${isMaximized 
                  ? (isSidebarOpen ? 'right-[392px] w-48' : 'right-6 w-48') 
                  : 'right-6 w-32 md:w-48'
                }`}
              >
                 {partnerFrame ? (
                   <img src={partnerFrame} alt="Partner camera" className="h-full w-full object-cover scale-x-[-1]" />
                 ) : (
                   <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-white/35">
                     <Users size={32} />
                     <span className="px-2 text-center text-[9px] font-bold uppercase leading-tight">Đang chờ camera partner</span>
                   </div>
                 )}
                 <div className="absolute bottom-2 left-2 flex flex-col gap-0.5">
                   <div className="flex items-center gap-1">
                     <div className={`w-2 h-2 rounded-full animate-pulse ${
                       partnerStatus === "Camera Off" ? "bg-gray-400" : 
                       partnerStatus === "Away" ? "bg-red-500" : 
                       partnerStatus === "Focused" || partnerStatus === "Reading/Writing" ? "bg-green-500" : "bg-yellow-500"}`}></div>
                     <span className="text-[10px] font-bold text-white uppercase tracking-tighter">
                        {getStatusLabel(partnerStatus)}
                     </span>
                   </div>
                   {partnerStatus !== "Camera Off" && (
                     <div className="flex items-center gap-1">
                       <span className="text-[8px] font-black text-white/60 uppercase">Tập trung:</span>
                       <span className={`text-[9px] font-black ${partnerFocusScore >= 80 ? "text-green-400" : partnerFocusScore >= 50 ? "text-yellow-400" : "text-red-400"}`}>{partnerFocusScore}%</span>
                     </div>
                   )}
                 </div>
              </div>
            </div>

            {!isMaximized && (
              <div className="flex items-start gap-4 p-5 bg-blue-500/10 text-blue-400 rounded-3xl border border-blue-500/20 text-sm shadow-inner">
                <div className="p-2 bg-blue-500/20 rounded-xl">
                  <Info size={20} className="shrink-0" />
                </div>
                <p className="leading-relaxed font-medium">Camera AI chỉ xử lý dữ liệu tại chỗ để nhắc bạn tập trung. Không có video nào được ghi lại hoặc gửi đi.</p>
              </div>
            )}
          </div>

          {!isMaximized && (
            <div className="space-y-4 xl:sticky xl:top-4 self-start">
              {renderChatBox(false)}
              {renderAICoachStats(false)}
              {renderPartnerStats(false)}
              <button
                onClick={handleEndSession}
                disabled={isActionLoading}
                className="w-full py-3 rounded-2xl font-black text-sm bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 hover:border-red-500 transition-all shadow-lg shadow-red-500/5 active:scale-95"
              >
                {isActionLoading ? <Loader2 size={24} className="animate-spin" /> : "Kết thúc sớm"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderReport = () => {
    const localXp = (() => {
      let xp = 30;
      if (focusScore >= 90) xp = 200;
      else if (focusScore >= 80) xp = 160;
      else if (focusScore >= 70) xp = 120;
      else if (focusScore >= 50) xp = 80;

      if (presenceScore >= 90 && attentionScore >= 80) xp += 30;
      if (awayCount === 0) xp += 20;
      return Math.min(xp, 250);
    })();

    const localAiInsight = (() => {
      if (focusScore >= 90) {
        return "Tuyệt vời! Bạn đã duy trì sự tập trung cực kỳ ấn tượng. Phong độ đỉnh cao!";
      }
      if (presenceScore < 70) {
        return "Mức độ hiện diện của bạn khá thấp. Sự hiện diện liên tục trước camera giúp AI hỗ trợ bạn duy trì kỷ luật tốt hơn.";
      }
      if (focusScore >= 70) {
        return "Khá ổn! Bạn có một vài lần mất tập trung nhỏ, nhưng tổng thể vẫn rất hiệu quả. Tiếp tục phát huy nhé!";
      } else if (focusScore >= 50) {
        return "Phiên làm việc có khá nhiều xao nhãng. Hãy thử dọn dẹp không gian và chọn phiên ngắn hơn để rèn luyện sự tập trung.";
      } else {
        return "Mức độ tập trung khá thấp. Đừng quá khắt khe với bản thân, hãy nghỉ ngơi một chút và thử lại với tâm thế thoải mái hơn nhé.";
      }
    })();

    const report: SessionReport = serverReport || {
      xp_earned: localXp,
      focus_score: focusScoreRef.current,
      presence_score: presenceScoreRef.current,
      attention_score: attentionScoreRef.current,
      away_count: awayCountStateRef.current,
      looking_away_count: lookingAwayCountRef.current,
      head_down_count: headDownCountRef.current,
      duration_seconds: totalSeconds,
      ai_insight: localAiInsight,
      ai_confidence: aiConfidenceRef.current,
      reading_writing_time: totalReadingWritingSecondsRef.current,
      total_away_time: totalAwaySecondsRef.current,
      metadata: {
        timeline: timelineEventsRef.current,
        total_focused_time: totalFocusedSecondsRef.current,
        total_reading_writing_time: totalReadingWritingSecondsRef.current,
        total_looking_away_time: totalLookingAwaySecondsRef.current,
        total_head_down_time: totalHeadDownSecondsRef.current,
        total_away_time: totalAwaySecondsRef.current,
        low_confidence_time: lowConfidenceSecondsRef.current,
        manual_checkpoint_count: manualCheckpointCountRef.current,
        mode: modeRef.current
      }
    };

    const t = report.duration_seconds;
    const mins = Math.floor(t / 60);
    const secs = (t % 60).toString().padStart(2, '0');
    const focusedPct = t > 0 ? Math.round(((report.metadata?.total_focused_time || 0) + (report.metadata?.total_reading_writing_time || 0)) / t * 100) : 0;

    // Strengths & Improvements
    const strengths: string[] = [];
    const improvements: string[] = [];

    // Focus Score Rules
    if (report.focus_score >= 90) {
      strengths.push(`Duy trì hiệu suất tập trung xuất sắc ({report.focus_score}%)`);
    } else if (report.focus_score >= 75) {
      strengths.push(`Duy trì sự tập trung khá tốt ({report.focus_score}%)`);
    } else {
      improvements.push(`Tập trung chưa liên tục ({report.focus_score}%) - Hãy thử loại bỏ điện thoại khỏi tầm mắt`);
    }

    // Attention Score Rules
    if (report.attention_score >= 85) {
      strengths.push(`Khả năng chú ý cao (${report.attention_score}%), rất ít bị phân tâm xung quanh`);
    } else {
      improvements.push(`Hay nhìn ra ngoài (${report.attention_score}% chú ý) - Cố gắng ngồi ở góc yên tĩnh hơn`);
    }

    // Presence Score Rules
    if (report.presence_score >= 90) {
      strengths.push(`Hiện diện đầy đủ trước màn hình (${report.presence_score}% thời gian)`);
    } else {
      improvements.push(`Rời khỏi camera khá nhiều (${report.presence_score}% hiện diện) - Hạn chế đi lại tự do`);
    }

    // Away Count Rules
    if (report.away_count === 0) {
      strengths.push("Không rời bàn làm việc một lần nào trong suốt phiên");
    } else if (report.away_count <= 2) {
      improvements.push(`Rời bàn ${report.away_count} lần - Chuẩn bị sẵn nước uống và dụng cụ trước khi học`);
    } else {
      improvements.push(`Rời bàn quá nhiều (${report.away_count} lần) - Dễ làm gián đoạn luồng tư duy sâu`);
    }

    // Head Down Rules
    const headDownTime = report.metadata?.total_head_down_time || 0;
    if (headDownTime > 30) {
      improvements.push(`Cúi đầu thấp hoặc che mặt (${headDownTime}s) - Giữ tư thế ngồi thẳng để AI nhận diện tốt hơn`);
    } else if (headDownTime > 0 && headDownTime <= 30) {
      strengths.push("Tư thế ngồi chuẩn, ít cúi đầu che khuất khuôn mặt");
    }

    // Reading / Writing Rules
    const readWriteTime = report.metadata?.total_reading_writing_time || 0;
    if (readWriteTime > 0) {
      strengths.push(`Đã ghi chép / đọc sách học tập tích cực trong ${readWriteTime}s`);
    }

    // Backup if empty
    if (strengths.length === 0) {
      strengths.push("Đã hoàn thành phiên học tập và nỗ lực hết mình");
    }
    if (improvements.length === 0) {
      improvements.push("Không có điểm yếu đáng kể - Phiên học hoàn hảo!");
    }

    // Partner comparison
    const hasPartner = reportPartnerFocusScore !== null;
    const myScore = report.focus_score;
    const partnerScore = reportPartnerFocusScore ?? 0;
    const myWins = myScore > partnerScore;
    const tied = myScore === partnerScore;
    const clampPercent = (value: number) => Math.max(0, Math.min(100, Math.round(value || 0)));

    return (
      <div className="max-w-5xl mx-auto mt-4 space-y-4 pb-12">
        <style>{`
          .rscroll::-webkit-scrollbar { width: 4px; }
          .rscroll::-webkit-scrollbar-track { background: transparent; }
          .rscroll::-webkit-scrollbar-thumb { background: var(--border-subtle); border-radius: 10px; }
        `}</style>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* CỘT TRÁI (6/12): Tóm tắt chung, Phân bổ thời gian, AI Coach, Nút bấm */}
          <div className="lg:col-span-6 space-y-4">
            
            {/* Hero Card */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--color-primary)] via-violet-600 to-blue-600 p-5 text-white shadow-xl">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 60%)' }} />
              
              <div className="relative flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0 shadow-inner">
                    <Award size={24} className="text-yellow-300" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-tight leading-tight">Phiên hoàn thành!</h2>
                    <div className="flex items-center gap-2 mt-1 text-xs text-white/80">
                      <span className="font-bold text-yellow-300">+{report.xp_earned} XP</span>
                      <span>•</span>
                      <span>{mins}p {secs}s</span>
                      <span>•</span>
                      <span className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase">{report.metadata?.mode}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-4xl font-black tracking-tighter leading-none">{report.focus_score}%</div>
                  <div className="text-[9px] font-black uppercase tracking-widest opacity-60 mt-0.5">Focus Score</div>
                </div>
              </div>

              <div className="relative grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/15 text-center">
                {[
                  { label: 'Sự hiện diện', val: `${report.presence_score}%`, c: 'text-cyan-200' },
                  { label: 'Sự chú ý', val: `${report.attention_score}%`, c: 'text-emerald-200' },
                  { label: 'Tỷ lệ tập trung', val: `${focusedPct}%`, c: 'text-white' },
                ].map(m => (
                  <div key={m.label} className="bg-white/5 py-1.5 rounded-xl border border-white/5">
                    <div className={`text-base font-black ${m.c}`}>{m.val}</div>
                    <div className="text-[8px] font-black uppercase opacity-60 tracking-wider mt-0.5">{m.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Time Breakdown (stacked bar) */}
            <div className="rounded-2xl bg-[var(--color-surface-container)] border border-[var(--border-subtle)] p-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-wider text-[var(--color-on-surface-variant)] mb-3">Phân bổ thời gian</p>
              <div className="flex gap-0.5 h-5 rounded-lg overflow-hidden mb-3 bg-[var(--border-subtle)]">
                {[
                  { val: report.metadata?.total_focused_time || 0, color: 'bg-green-500' },
                  { val: report.metadata?.total_reading_writing_time || 0, color: 'bg-blue-500' },
                  { val: report.metadata?.total_looking_away_time || 0, color: 'bg-yellow-400' },
                  { val: report.metadata?.total_head_down_time || 0, color: 'bg-orange-400' },
                  { val: report.metadata?.total_away_time || 0, color: 'bg-red-500' },
                ].filter(i => i.val > 0).map((item, idx) => (
                  <div key={idx} className={`${item.color} h-full transition-all`} style={{ flex: item.val }} />
                ))}
                {t === 0 && <div className="bg-gray-300 h-full flex-1" />}
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { label: 'Tập trung', val: report.metadata?.total_focused_time || 0, dot: 'bg-green-500' },
                  { label: 'Đọc / Ghi chép', val: report.metadata?.total_reading_writing_time || 0, dot: 'bg-blue-500' },
                  { label: 'Nhìn xung quanh', val: report.metadata?.total_looking_away_time || 0, dot: 'bg-yellow-400' },
                  { label: 'Cúi đầu / Lơ đãng', val: report.metadata?.total_head_down_time || 0, dot: 'bg-orange-400' },
                  { label: 'Vắng mặt', val: report.metadata?.total_away_time || 0, dot: 'bg-red-500' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-1.5 py-1 px-2 rounded-xl bg-[var(--color-surface)] border border-[var(--border-subtle)]">
                    <div className={`w-2 h-2 rounded-full ${item.dot} shrink-0`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] text-[var(--color-on-surface-variant)] truncate leading-none">{item.label}</p>
                      <p className="text-xs font-black mt-0.5 leading-none">{item.val}s</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Coach Insight */}
            <div className="rounded-2xl bg-[var(--color-primary-container)]/10 border border-[var(--color-primary)]/15 p-4 flex gap-3 items-start shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-[var(--color-primary-container)]/50 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                <Brain size={18} className="text-[var(--color-primary)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--color-primary)] mb-1">AI Coach Insights</p>
                <p className="text-xs font-medium leading-relaxed text-[var(--color-on-surface)] italic">
                  "{report.ai_insight || "Bạn đã duy trì được tinh thần học tập khá nghiêm túc trong phiên này. Hãy tiếp tục phát huy!"}"
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={resetRoom}
                className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-sm bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:opacity-95 transition-all shadow-md shadow-[var(--color-primary)]/20 active:scale-95"
              >
                Tạo phòng mới
              </button>
              <button
                onClick={() => navigate("/")}
                className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-sm bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] border border-[var(--border-subtle)] hover:bg-[var(--color-surface-container-highest)] transition-all active:scale-95"
              >
                Về Dashboard
              </button>
            </div>

          </div>

          {/* CỘT PHẢI (6/12): Phân tích chi tiết hành vi, So sánh đối phương, Timeline */}
          <div className="lg:col-span-6 space-y-4">
            
            {/* Phân tích hành vi */}
            <div className="rounded-2xl bg-[var(--color-surface-container)] border border-[var(--border-subtle)] p-4 shadow-sm space-y-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-[var(--color-on-surface-variant)]">Đánh giá hành vi chi tiết</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Làm tốt */}
                <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/15 p-3">
                  <div className="flex items-center gap-1.5 mb-2 text-emerald-600">
                    <Check size={14} className="stroke-[3]" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Làm tốt</span>
                  </div>
                  <ul className="space-y-1.5">
                    {strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <span className="text-[11px] text-[var(--color-on-surface-variant)] leading-tight">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Cần cải thiện */}
                <div className="rounded-xl bg-amber-500/5 border border-amber-500/15 p-3">
                  <div className="flex items-center gap-1.5 mb-2 text-amber-600">
                    <Target size={14} className="stroke-[3]" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Cần cải thiện</span>
                  </div>
                  <ul className="space-y-1.5">
                    {improvements.map((s, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                        <span className="text-[11px] text-[var(--color-on-surface-variant)] leading-tight">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Partner Comparison */}
            {hasPartner && (
              <div className="rounded-2xl bg-[var(--color-surface-container)] border border-[var(--border-subtle)] p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-[var(--color-primary)]" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-on-surface-variant)]">So sánh với {reportPartnerName || "Partner"}</span>
                  </div>
                  
                  {tied ? (
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 flex items-center gap-1">🤝 Hòa nhau</span>
                  ) : myWins ? (
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center gap-1">🏆 Bạn thắng</span>
                  ) : (
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 flex items-center gap-1">🥈 {reportPartnerName || 'Partner'} thắng</span>
                  )}
                </div>

                {/* Goals Side-by-Side */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--border-subtle)]">
                    <p className="text-[8px] font-black uppercase tracking-wider text-[var(--color-on-surface-variant)] mb-1">Mục tiêu của bạn</p>
                    <p className="text-xs font-semibold text-[var(--color-on-surface)] line-clamp-2">{localGoal || "Không đặt mục tiêu"}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--border-subtle)]">
                    <p className="text-[8px] font-black uppercase tracking-wider text-[var(--color-on-surface-variant)] mb-1">Mục tiêu của {reportPartnerName || "Partner"}</p>
                    <p className="text-xs font-semibold text-[var(--color-on-surface)] line-clamp-2">{reportPartnerGoal || "Không đặt mục tiêu"}</p>
                  </div>
                </div>

                {/* Metrics Bars */}
                <div className="space-y-3 pt-1">
                  
                  {/* Focus Score Comparison */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-[var(--color-on-surface-variant)]">Focus Score</span>
                      <div>
                        <span className="text-violet-500 font-black">Bạn: {myScore}%</span>
                        <span className="text-[var(--color-on-surface-variant)] mx-1">vs</span>
                        <span className="text-blue-500 font-black">{reportPartnerName || "Partner"}: {partnerScore}%</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="h-2 rounded-full bg-[var(--border-subtle)] overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500" style={{ width: `${clampPercent(myScore)}%` }} />
                      </div>
                      <div className="h-2 rounded-full bg-[var(--border-subtle)] overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600" style={{ width: `${clampPercent(partnerScore)}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Presence Score Comparison */}
                  {reportPartnerPresenceScore !== null && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-[var(--color-on-surface-variant)]">Sự Hiện diện</span>
                        <div>
                          <span className="text-violet-500 font-black">Bạn: {report.presence_score}%</span>
                          <span className="text-[var(--color-on-surface-variant)] mx-1">vs</span>
                          <span className="text-blue-500 font-black">{reportPartnerName || "Partner"}: {reportPartnerPresenceScore}%</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="h-2 rounded-full bg-[var(--border-subtle)] overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500" style={{ width: `${clampPercent(report.presence_score)}%` }} />
                        </div>
                        <div className="h-2 rounded-full bg-[var(--border-subtle)] overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600" style={{ width: `${clampPercent(reportPartnerPresenceScore)}%` }} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Away Count Comparison */}
                  {reportPartnerAwayCount !== null && (
                    <div className="flex items-center justify-between text-[10px] font-bold py-2 bg-[var(--color-surface)] border border-[var(--border-subtle)] px-2.5 rounded-xl">
                      <span className="text-[var(--color-on-surface-variant)]">Số lần rời camera</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.5 rounded font-black ${report.away_count === 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                          Bạn: {report.away_count} lần
                        </span>
                        <span className="text-[var(--color-on-surface-variant)]">vs</span>
                        <span className={`px-1.5 py-0.5 rounded font-black ${reportPartnerAwayCount === 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                          {reportPartnerName || "Partner"}: {reportPartnerAwayCount} lần
                        </span>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="rounded-2xl bg-[var(--color-surface-container)] border border-[var(--border-subtle)] p-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-wider text-[var(--color-on-surface-variant)] mb-2">Dòng thời gian phiên</p>
              <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar rscroll pr-1 text-xs">
                {(report.metadata?.timeline || []).map((ev: any, idx: number) => {
                  const dateStr = ev.startTime ? new Date(ev.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';
                  return (
                    <div key={idx} className="flex items-start gap-2 text-[var(--color-on-surface-variant)]">
                      <span className="text-[9px] opacity-50 font-mono mt-0.5 shrink-0">{dateStr}</span>
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        ev.type === 'Focused' ? 'bg-green-500' :
                        ev.type === 'Reading/Writing' ? 'bg-blue-500' :
                        ev.type === 'Away' ? 'bg-red-500' :
                        ev.type === 'Manual Checkpoint' ? 'bg-purple-500' : 'bg-yellow-500'
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-[var(--color-on-surface)] truncate">{ev.type}</span>
                        {ev.note && <span className="text-[10px] opacity-70 italic ml-1.5">({ev.note})</span>}
                      </div>
                      {ev.durationSeconds !== undefined && <span className="text-[10px] font-mono opacity-60 shrink-0">{ev.durationSeconds}s</span>}
                    </div>
                  );
                })}
                {(report.metadata?.timeline || []).length === 0 && (
                  <p className="text-xs opacity-50 italic text-center py-2">Không có sự kiện ghi nhận.</p>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface)] text-[var(--color-on-surface)] pb-20">
      <div className="max-w-7xl mx-auto px-4 py-8 md:p-6">
        {phase === "CREATE" && (
          <>
            {renderCreate()}
            {renderWaitingRoomList()}
          </>
        )}
        {phase === "WAITING" && renderWaiting()}
        {phase === "LOBBY" && renderLobby()}
        {phase === "ACTIVE" && renderActive()}
        {phase === "REPORT" && renderReport()}
      </div>
    </div>
  );
}


