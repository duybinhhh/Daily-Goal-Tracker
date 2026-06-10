import React, { useState, useEffect, useRef } from "react";
import { Camera, CameraOff, Users, Clock, Zap, Target, Award, Copy, Check, Info, Brain, Loader2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";
import api from "../services/api";

type Phase = "CREATE" | "WAITING" | "ACTIVE" | "REPORT";
type Mode = "Study" | "Deep Work";

interface SessionReport {
  duration_seconds: number;
  presence_score: number;
  focus_score: number;
  away_count: number;
  xp_earned: number;
  ai_insight: string;
}

export function DisciplineRoomPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("CREATE");

  // Create/Join Room State
  const [roomId, setRoomId] = useState("");
  const [title, setTitle] = useState("");
  const [mode, setMode] = useState<Mode>("Study");
  const [duration, setDuration] = useState<number>(15);
  const [inviteCodeInput, setInviteCodeInput] = useState("");
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Waiting Room State
  const [inviteCode, setInviteCode] = useState("");
  const [partnerJoined, setPartnerJoined] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isCreator, setIsCreator] = useState(false);

  // Active Session State
  const [countdown, setCountdown] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [cameraStatus, setCameraStatus] = useState<"Camera Off" | "Detecting" | "Focused" | "Away">("Detecting");
  const [focusScore, setFocusScore] = useState(100);
  const [presenceScore, setPresenceScore] = useState(100);
  const [awayCount, setAwayCount] = useState(0);
  const [isDetectorLoading, setIsDetectorLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Partner State (via server relay)
  const [partnerFrame, setPartnerFrame] = useState<string | null>(null);
  const [partnerStatus, setPartnerStatus] = useState<"Camera Off" | "Detecting" | "Focused" | "Away">("Detecting");

  // Report State
  const [serverReport, setServerReport] = useState<SessionReport | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const partnerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const detectorRef = useRef<FaceDetector | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const frameBroadcastIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const partnerPollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cameraStatusRef = useRef<"Camera Off" | "Detecting" | "Focused" | "Away">("Detecting");
  // Unique per browser tab — lets the server distinguish two tabs of the same account
  const clientIdRef = useRef(`tab-${Date.now()}-${Math.random().toString(36).slice(2)}`);

  // Stats tracking refs
  const totalTicksRef = useRef(0);
  const faceDetectedTicksRef = useRef(0);
  const lastFaceTickRef = useRef(0);
  const isCurrentlyAwayRef = useRef(false);

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
      } catch {
        // Silently ignore network errors during polling
      }
    };

    partnerPollIntervalRef.current = setInterval(pollPartner, 1200);
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
      detectorRef.current = await FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`,
          delegate: "GPU"
        },
        runningMode: "IMAGE"
      });
    } catch (err) {
      console.error("Failed to initialize face detector", err);
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
        durationMinutes: duration
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

  const handleJoinRoom = async () => {
    if (!inviteCodeInput) return;
    setIsActionLoading(true);
    setError(null);
    try {
      const response = await api.post("/api/discipline-room/join", {
        inviteCode: inviteCodeInput.toUpperCase()
      });
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

  const startHeartbeat = (id: string) => {
    if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
    heartbeatIntervalRef.current = setInterval(async () => {
      try {
        const response = await api.post(`/api/discipline-room/${id}/heartbeat`);
        const status = response.data.status;

        const roomResp = await api.get(`/api/discipline-room/${id}`);
        const room = roomResp.data.room;
        if (room.participants.length >= 2) {
          setPartnerJoined(true);
        }

        if (status === "ACTIVE") {
          setPhase("ACTIVE");
          if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
          setCountdown(3);
        }
      } catch (err) {
        console.error("Heartbeat failed", err);
      }
    }, 3000);
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
    setFocusScore(100);
    setPresenceScore(100);
    setAwayCount(0);
    setCameraStatus("Detecting");
    cameraStatusRef.current = "Detecting";
    setCameraError(null);
    setIsCameraLoading(true);

    totalTicksRef.current = 0;
    faceDetectedTicksRef.current = 0;
    lastFaceTickRef.current = 0;
    isCurrentlyAwayRef.current = false;
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
      clientId: clientIdRef.current,
    }).catch(() => {});
  };

  // ─── Face detection ──────────────────────────────────────────────────────────
  const runDetection = () => {
    if (!detectorRef.current || !videoRef.current || videoRef.current.readyState < 2) return;

    try {
      totalTicksRef.current++;

      const detections = detectorRef.current.detect(videoRef.current);
      const hasFace = detections.detections.length > 0;

      if (hasFace) {
        faceDetectedTicksRef.current++;
        lastFaceTickRef.current = totalTicksRef.current;

        if (isCurrentlyAwayRef.current || cameraStatusRef.current !== "Focused") {
          isCurrentlyAwayRef.current = false;
          cameraStatusRef.current = "Focused";
          setCameraStatus("Focused");
        }
      } else {
        const ticksSinceLastFace = totalTicksRef.current - lastFaceTickRef.current;

        if (ticksSinceLastFace >= 5 && !isCurrentlyAwayRef.current) {
          isCurrentlyAwayRef.current = true;
          cameraStatusRef.current = "Away";
          setCameraStatus("Away");
          setAwayCount(prev => prev + 1);
        }
      }

      const presence = totalTicksRef.current > 0
        ? Math.round((faceDetectedTicksRef.current / totalTicksRef.current) * 100)
        : 100;
      setPresenceScore(presence);

      setAwayCount(currentAwayCount => {
        const focus = Math.max(0, presence - currentAwayCount * 5);
        setFocusScore(focus);
        return currentAwayCount;
      });
    } catch (err) {
      console.warn("Face detection skipped:", err);
    }
  };

  // ─── End session ─────────────────────────────────────────────────────────────
  const handleEndSession = async () => {
    cleanupSession();
    setIsActionLoading(true);
    try {
      const timeSpent = duration * 60 - timeLeft;
      const response = await api.post(`/api/discipline-room/${roomId}/end`, {
        durationSeconds: timeSpent,
        presenceScore,
        focusScore,
        awayCount
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
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // ─── UI Rendering ─────────────────────────────────────────────────────────────
  const renderCreate = () => (
    <div className="max-w-4xl mx-auto mt-10 grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
      {/* Create Section */}
      <div className="p-8 rounded-3xl bg-[var(--color-surface-container)] border border-[var(--border-subtle)] shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-[var(--color-primary-container)] rounded-2xl shadow-inner">
            {isDetectorLoading ? <Loader2 className="animate-spin text-[var(--color-primary)]" size={40} /> : <Camera size={40} className="text-[var(--color-primary)]" />}
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center mb-2">Tạo phòng mới</h2>
        <p className="text-center text-[var(--color-on-surface-variant)] mb-8 text-sm">
          Bắt đầu phiên tập trung của riêng bạn
        </p>

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
            <div className="grid grid-cols-3 gap-3">
              {[5, 15, 25].map(d => (
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

          <button
            onClick={handleCreateRoom}
            disabled={!title || isDetectorLoading || isActionLoading}
            className={`w-full py-4 mt-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 text-lg ${title && !isDetectorLoading && !isActionLoading ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:opacity-95 shadow-xl shadow-[var(--color-primary)]/30 active:scale-95' : 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] cursor-not-allowed opacity-50'}`}
          >
            {isActionLoading ? <Loader2 size={24} className="animate-spin" /> : <Zap size={24} />}
            {isActionLoading ? "Đang tạo..." : "Tạo phòng"}
          </button>
        </div>
      </div>

      {/* Join Section */}
      <div className="p-8 rounded-3xl bg-[var(--color-surface-container)] border border-[var(--border-subtle)] shadow-2xl flex flex-col">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-green-500/10 rounded-2xl shadow-inner">
            <Users size={40} className="text-green-500" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center mb-2">Tham gia phòng</h2>
        <p className="text-center text-[var(--color-on-surface-variant)] mb-8 text-sm">
          Nhập mã mời để cùng tập trung với partner
        </p>

        <div className="space-y-6 mt-auto mb-auto">
          <div>
            <label className="block text-sm font-semibold mb-2 ml-1">Mã mời (Invite Code)</label>
            <input
              type="text"
              className="w-full px-5 py-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--color-surface)] text-[var(--color-on-surface)] outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-center text-3xl font-mono font-black tracking-widest"
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
            onClick={handleJoinRoom}
            disabled={!inviteCodeInput || isActionLoading}
            className={`w-full py-4 mt-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 text-lg ${inviteCodeInput && !isActionLoading ? 'bg-green-500 text-white hover:opacity-95 shadow-xl shadow-green-500/30 active:scale-95' : 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] cursor-not-allowed opacity-50'}`}
          >
            {isActionLoading ? <Loader2 size={24} className="animate-spin" /> : <ArrowRight size={24} />}
            {isActionLoading ? "Đang kiểm tra..." : "Vào phòng"}
          </button>
        </div>
      </div>
    </div>
  );

  const renderWaiting = () => (
    <div className="max-w-md mx-auto mt-10 p-8 rounded-3xl bg-[var(--color-surface-container)] border border-[var(--border-subtle)] text-center shadow-2xl shadow-black/10">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1">{title || "Chưa đặt tên"}</h2>
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

      <div className={`flex items-center justify-center gap-4 mb-10 p-5 rounded-2xl transition-all border ${partnerJoined ? "bg-green-500/10 border-green-500/30 text-green-500" : "bg-[var(--color-surface-container-highest)] border-[var(--border-subtle)]"}`}>
        {partnerJoined ? (
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg shadow-green-500/30">
               <Users size={20} />
             </div>
             <span className="font-bold">Partner đã sẵn sàng!</span>
           </div>
        ) : (
           <div className="flex items-center gap-3">
             <Loader2 size={24} className="animate-spin text-[var(--color-on-surface-variant)]" />
             <span className="font-medium text-[var(--color-on-surface-variant)]">Đang đợi partner vào phòng...</span>
           </div>
        )}
      </div>

      {isCreator ? (
        <button
          onClick={startRealSession}
          disabled={!partnerJoined || isActionLoading}
          className={`w-full py-4 rounded-2xl font-black text-lg transition-all ${partnerJoined && !isActionLoading ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:opacity-95 shadow-xl shadow-[var(--color-primary)]/40 active:scale-95' : 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] cursor-not-allowed opacity-50'}`}
        >
          {isActionLoading ? <Loader2 size={24} className="animate-spin" /> : "BẮT ĐẦU PHIÊN"}
        </button>
      ) : (
        <div className="text-sm font-medium text-[var(--color-on-surface-variant)] animate-pulse">
          Đang chờ creator bắt đầu phiên...
        </div>
      )}
    </div>
  );

  const renderActive = () => (
    <div className="max-w-6xl mx-auto mt-4 p-4 md:p-6">
      {countdown !== null ? (
        <div className="flex flex-col items-center justify-center h-[70vh]">
          <div className="relative">
             <div className="absolute inset-0 bg-[var(--color-primary)] rounded-full blur-3xl opacity-20 animate-pulse"></div>
             <div className="relative text-[12rem] font-black text-[var(--color-primary)] drop-shadow-2xl">{countdown}</div>
          </div>
          <h2 className="text-3xl font-bold text-[var(--color-on-surface-variant)] mt-8 animate-bounce">Tập trung nào!</h2>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-6">
            {/* Header Card */}
            <div className="p-6 rounded-3xl bg-[var(--color-surface-container)] border border-[var(--border-subtle)] shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[var(--color-primary-container)] rounded-2xl">
                  <Target size={32} className="text-[var(--color-primary)]" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{title}</h2>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold rounded-md uppercase tracking-wider">{mode}</span>
                    <span className="text-xs px-2 py-0.5 bg-blue-500/10 text-blue-500 font-bold rounded-md uppercase tracking-wider">AI Coach Active</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="text-6xl font-mono font-black tracking-tighter text-[var(--color-primary)]">
                  {formatTime(timeLeft)}
                </div>
                <span className="text-[10px] font-bold text-[var(--color-on-surface-variant)] uppercase tracking-[0.2em] mt-1 mr-1">Time Remaining</span>
              </div>
            </div>

            {/* Camera View */}
            <div className="relative rounded-[2.5rem] overflow-hidden bg-black aspect-video border-4 border-[var(--border-subtle)] shadow-2xl flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover scale-x-[-1] ${cameraError ? 'hidden' : 'block'}`}
              />

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
                  <h3 className="text-xl font-bold text-white mb-2">Lỗi Camera</h3>
                  <p className="text-white/60 text-sm mb-6">{cameraError}</p>
                  <button onClick={startTracking} className="px-6 py-2 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors">Thử lại</button>
                </div>
              )}

              {/* Status HUD */}
              <div className="absolute top-6 left-6 flex flex-col gap-3">
                <div className={`px-5 py-2 rounded-2xl text-sm font-black backdrop-blur-xl flex items-center gap-3 border-2 transition-all duration-300
                  ${cameraStatus === 'Focused' ? 'bg-green-500/20 text-green-400 border-green-500/40 shadow-lg shadow-green-500/20' :
                    cameraStatus === 'Away' ? 'bg-red-500/40 text-red-200 border-red-500/60 shadow-2xl shadow-red-500/40 scale-110' :
                    cameraStatus === 'Detecting' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40' :
                    'bg-gray-500/20 text-gray-400 border-gray-500/40'}`}
                >
                  <div className={`w-3 h-3 rounded-full ${cameraStatus === 'Focused' ? 'bg-green-400' : cameraStatus === 'Away' ? 'bg-red-400' : cameraStatus === 'Detecting' ? 'bg-yellow-400' : 'bg-gray-400'} animate-pulse`}></div>
                  <span className="uppercase tracking-widest">{cameraStatus}</span>
                </div>

                {cameraStatus === 'Away' && (
                  <div className="bg-red-500 text-white px-4 py-1.5 rounded-xl text-xs font-bold animate-bounce shadow-xl">
                    ⚠️ HÃY QUAY LẠI LÀM VIỆC!
                  </div>
                )}
              </div>

              {/* Partner mini overlay */}
              <div className="absolute bottom-6 right-6 w-32 md:w-48 aspect-video bg-black/40 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden shadow-2xl">
                 {partnerFrame ? (
                   <img src={partnerFrame} alt="Partner camera" className="h-full w-full object-cover scale-x-[-1]" />
                 ) : (
                   <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-white/35">
                     <Users size={32} />
                     <span className="px-2 text-center text-[9px] font-bold uppercase leading-tight">Đang chờ camera partner</span>
                   </div>
                 )}
                 <div className="absolute bottom-2 left-2 flex items-center gap-1">
                   <div className={`w-2 h-2 rounded-full animate-pulse ${partnerStatus === "Camera Off" ? "bg-gray-400" : partnerStatus === "Away" ? "bg-red-500" : "bg-green-500"}`}></div>
                   <span className="text-[10px] font-bold text-white uppercase tracking-tighter">
                     {partnerStatus === "Camera Off" ? "Partner Offline" : partnerStatus === "Away" ? "Partner Away" : "Partner Focused"}
                   </span>
                 </div>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5 bg-blue-500/10 text-blue-400 rounded-3xl border border-blue-500/20 text-sm shadow-inner">
              <div className="p-2 bg-blue-500/20 rounded-xl">
                <Info size={20} className="shrink-0" />
              </div>
              <p className="leading-relaxed font-medium">Camera AI chỉ xử lý dữ liệu tại chỗ để nhắc nhở bạn tập trung. Không có video nào được ghi lại hoặc gửi đi.</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Stats Sidebar */}
            <div className="p-6 rounded-[2rem] bg-[var(--color-surface-container)] border border-[var(--border-subtle)] shadow-xl">
              <h3 className="font-black text-xs text-[var(--color-on-surface-variant)] mb-6 uppercase tracking-[0.2em]">AI Coach Intelligence</h3>

              <div className="space-y-8">
                <div className="relative">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-bold opacity-80 uppercase tracking-wider">Focus Score</span>
                    <span className="text-3xl font-black text-[var(--color-primary)]">{focusScore}%</span>
                  </div>
                  <div className="w-full h-4 bg-[var(--color-surface-container-high)] rounded-full overflow-hidden p-1 shadow-inner">
                    <div className="h-full bg-gradient-to-r from-[var(--color-primary)] to-blue-400 rounded-full transition-all duration-1000 ease-out" style={{ width: `${focusScore}%` }}></div>
                  </div>
                  {focusScore < 70 && <p className="text-[10px] text-red-400 font-bold mt-2 animate-pulse">Mức độ tập trung đang thấp!</p>}
                </div>

                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-bold opacity-80 uppercase tracking-wider">Presence</span>
                    <span className="text-2xl font-black text-blue-400">{presenceScore}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-[var(--color-surface-container-high)] rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-blue-400 transition-all duration-1000" style={{ width: `${presenceScore}%` }}></div>
                  </div>
                </div>

                <div className="flex justify-between items-center p-4 bg-red-500/5 rounded-2xl border border-red-500/10 transition-all">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Lần rời đi</span>
                    <span className="text-xs text-[var(--color-on-surface-variant)] font-medium mt-0.5">Away count</span>
                  </div>
                  <span className={`text-4xl font-black ${awayCount > 0 ? 'text-red-500' : 'text-gray-400'}`}>{awayCount}</span>
                </div>
              </div>
            </div>

            {/* Partner Sidebar */}
            <div className="p-6 rounded-[2rem] bg-[var(--color-surface-container)] border border-[var(--border-subtle)] shadow-xl">
              <h3 className="font-black text-xs text-[var(--color-on-surface-variant)] mb-4 uppercase tracking-[0.2em]">Partner Room</h3>
              <div className="flex items-center gap-4 p-3 bg-[var(--color-surface)] rounded-2xl border border-[var(--border-subtle)]">
                <div className="w-14 h-14 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-blue-500/20">
                  {partnerFrame ? (
                    <img src={partnerFrame} alt="Partner preview" className="h-full w-full object-cover scale-x-[-1]" />
                  ) : (
                    "P"
                  )}
                </div>
                <div className="overflow-hidden">
                  <div className="font-bold truncate text-lg">Partner</div>
                  <div className={`text-[10px] font-black flex items-center gap-1 uppercase tracking-tighter ${partnerStatus === "Camera Off" ? "text-gray-500" : partnerStatus === "Away" ? "text-red-500" : "text-green-500"}`}>
                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${partnerStatus === "Camera Off" ? "bg-gray-500" : partnerStatus === "Away" ? "bg-red-500" : "bg-green-500"}`}></div>
                    {partnerFrame ? partnerStatus : "Waiting for camera"}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleEndSession}
              disabled={isActionLoading}
              className="w-full py-4 rounded-2xl font-black text-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border-2 border-red-500/20 hover:border-red-500 transition-all shadow-lg shadow-red-500/5 active:scale-95"
            >
              {isActionLoading ? <Loader2 size={24} className="animate-spin" /> : "Kết thúc sớm"}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderReport = () => {
    const report = serverReport || {
      xp_earned: 30,
      focus_score: focusScore,
      presence_score: presenceScore,
      away_count: awayCount,
      duration_seconds: duration * 60 - timeLeft,
      ai_insight: "Dữ liệu báo cáo local (Server fallback)."
    };

    const timeSpent = report.duration_seconds;
    const sessionDurationText = `${Math.floor(timeSpent / 60)} phút ${(timeSpent % 60).toString().padStart(2, '0')} giây`;

    return (
      <div className="max-w-2xl mx-auto mt-6 md:mt-10 p-8 md:p-10 rounded-[3rem] bg-[var(--color-surface-container)] border border-[var(--border-subtle)] shadow-2xl shadow-black/20">
        <div className="text-center mb-10">
          <div className="relative inline-flex mb-6">
            <div className="absolute inset-0 bg-[var(--color-primary)] rounded-3xl blur-2xl opacity-30 animate-pulse"></div>
            <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-[var(--color-primary)] to-blue-500 text-white shadow-2xl">
              <Award size={48} />
            </div>
          </div>
          <h2 className="text-4xl font-black mb-2 tracking-tight">Session Complete!</h2>
          <p className="text-[var(--color-on-surface-variant)] font-medium text-lg">{title}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="p-6 rounded-3xl bg-[var(--color-surface)] border border-[var(--border-subtle)] flex flex-col items-center justify-center text-center shadow-sm">
            <div className="p-3 bg-gray-500/10 rounded-2xl mb-3">
              <Clock size={28} className="text-[var(--color-on-surface-variant)]" />
            </div>
            <span className="text-3xl font-black tracking-tighter">{sessionDurationText}</span>
            <span className="text-[10px] font-bold text-[var(--color-on-surface-variant)] uppercase tracking-[0.2em] mt-2">Duration</span>
          </div>
          <div className="p-6 rounded-3xl bg-[var(--color-surface)] border border-[var(--border-subtle)] flex flex-col items-center justify-center text-center shadow-sm">
            <div className="p-3 bg-yellow-500/10 rounded-2xl mb-3">
              <Zap size={28} className="text-yellow-500" />
            </div>
            <span className="text-3xl font-black text-yellow-500 tracking-tighter">+{report.xp_earned} XP</span>
            <span className="text-[10px] font-bold text-[var(--color-on-surface-variant)] uppercase tracking-[0.2em] mt-2">Exp Earned</span>
          </div>
          <div className="p-6 rounded-3xl bg-[var(--color-surface)] border border-[var(--border-subtle)] flex flex-col items-center justify-center text-center shadow-sm">
            <div className="p-3 bg-[var(--color-primary)]/10 rounded-2xl mb-3">
              <Target size={28} className="text-[var(--color-primary)]" />
            </div>
            <span className="text-4xl font-black text-[var(--color-primary)] tracking-tighter">{report.focus_score}%</span>
            <span className="text-[10px] font-bold text-[var(--color-on-surface-variant)] uppercase tracking-[0.2em] mt-2">Avg Focus Score</span>
          </div>
          <div className="p-6 rounded-3xl bg-[var(--color-surface)] border border-[var(--border-subtle)] flex flex-col items-center justify-center text-center shadow-sm">
            <div className="p-3 bg-red-500/10 rounded-2xl mb-3">
              <Users size={28} className="text-red-400" />
            </div>
            <span className="text-4xl font-black text-red-400 tracking-tighter">{report.away_count}</span>
            <span className="text-[10px] font-bold text-[var(--color-on-surface-variant)] uppercase tracking-[0.2em] mt-2">Times Away</span>
          </div>
        </div>

        <div className="p-8 rounded-[2rem] border bg-[var(--color-primary-container)]/30 border-[var(--color-primary)]/20 mb-10 shadow-inner">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-[var(--color-primary-container)]/50">
               <Brain size={32} className="text-[var(--color-primary)]" />
            </div>
            <div>
              <h4 className="font-black uppercase tracking-[0.2em] text-xs mb-2 text-[var(--color-primary)]">AI Coach Insight</h4>
              <p className="text-lg font-medium leading-relaxed text-[var(--color-on-surface)]">{report.ai_insight}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={resetRoom}
            className="w-full py-5 rounded-[1.5rem] font-black text-lg bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:opacity-95 transition-all shadow-xl shadow-[var(--color-primary)]/30 active:scale-95"
          >
            Tạo phòng mới
          </button>
          <button
            onClick={() => navigate("/")}
            className="w-full py-5 rounded-[1.5rem] font-black text-lg bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-highest)] transition-all active:scale-95"
          >
            Về Dashboard
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface)] text-[var(--color-on-surface)] pb-20">
      <div className="max-w-7xl mx-auto px-4 py-8 md:p-6">
        {phase === "CREATE" && renderCreate()}
        {phase === "WAITING" && renderWaiting()}
        {phase === "ACTIVE" && renderActive()}
        {phase === "REPORT" && renderReport()}
      </div>
    </div>
  );
}
