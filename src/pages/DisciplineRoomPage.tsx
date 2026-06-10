import React, { useState, useEffect, useRef } from "react";
import { Camera, CameraOff, Users, Clock, Zap, Target, Award, Copy, Check, Info, Brain } from "lucide-react";
import { useNavigate } from "react-router-dom";

type Phase = "CREATE" | "WAITING" | "ACTIVE" | "REPORT";
type Mode = "Study" | "Deep Work";

export function DisciplineRoomPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("CREATE");
  
  // Create Room State
  const [title, setTitle] = useState("");
  const [mode, setMode] = useState<Mode>("Study");
  const [duration, setDuration] = useState<number>(15); // minutes
  
  // Waiting Room State
  const [inviteCode, setInviteCode] = useState("");
  const [partnerJoined, setPartnerJoined] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Active Session State
  const [countdown, setCountdown] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [cameraStatus, setCameraStatus] = useState<"Camera Off" | "Detecting" | "Focused" | "Away">("Detecting");
  const [focusScore, setFocusScore] = useState(100);
  const [presenceScore, setPresenceScore] = useState(100);
  const [awayCount, setAwayCount] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const aiIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up function for camera and intervals
  const cleanupSession = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (aiIntervalRef.current) clearInterval(aiIntervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return cleanupSession;
  }, []);

  const handleCreateRoom = () => {
    const code = "DR-" + Math.random().toString(36).substring(2, 6).toUpperCase();
    setInviteCode(code);
    setPhase("WAITING");
    
    // Mock partner join
    setTimeout(() => {
      setPartnerJoined(true);
    }, 3000);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startDemoSession = () => {
    setPhase("ACTIVE");
    setCountdown(3);
  };

  // Active Session Logic
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

  const startTracking = async () => {
    setTimeLeft(duration * 60);
    setFocusScore(100);
    setPresenceScore(100);
    setAwayCount(0);
    setCameraStatus("Detecting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraStatus("Focused");
    } catch (err) {
      console.error("Camera access denied", err);
      setCameraStatus("Camera Off");
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleEndSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    aiIntervalRef.current = setInterval(() => {
      if (streamRef.current) {
        const isAway = Math.random() < 0.2; // 20% chance to be away
        if (isAway) {
          setCameraStatus("Away");
          setAwayCount(prev => prev + 1);
          setFocusScore(prev => Math.max(0, prev - 5));
          setPresenceScore(prev => Math.max(0, prev - 2));
        } else {
          setCameraStatus("Focused");
          // slightly recover
          setFocusScore(prev => Math.min(100, prev + 1));
        }
      }
    }, 10000);
  };

  const handleEndSession = () => {
    cleanupSession();
    setPhase("REPORT");
  };

  const resetRoom = () => {
    setPhase("CREATE");
    setTitle("");
    setPartnerJoined(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // UI Rendering
  const renderCreate = () => (
    <div className="max-w-md mx-auto mt-10 p-6 rounded-2xl bg-[var(--color-surface-container)] border border-[var(--border-subtle)]">
      <div className="flex justify-center mb-4">
        <div className="p-3 bg-[var(--color-primary-container)] rounded-full">
          <Camera size={32} className="text-[var(--color-primary)]" />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-center mb-2">Discipline Room</h2>
      <p className="text-center text-[var(--color-on-surface-variant)] mb-6 text-sm">
        Phòng cam kết tập trung có AI Camera Coach
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Mục tiêu / Session Title</label>
          <input
            type="text"
            className="w-full px-4 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--color-surface)] text-[var(--color-on-surface)] outline-none focus:border-[var(--color-primary)]"
            placeholder="Ví dụ: Học ReactJS..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Chế độ</label>
          <div className="grid grid-cols-2 gap-2">
            {(["Study", "Deep Work"] as Mode[]).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`py-2 rounded-xl text-sm font-medium border ${mode === m ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] border-[var(--color-primary)]' : 'bg-transparent border-[var(--border-subtle)] text-[var(--color-on-surface-variant)]'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Thời gian</label>
          <div className="grid grid-cols-3 gap-2">
            {[5, 15, 25].map(d => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`py-2 rounded-xl text-sm font-medium border ${duration === d ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] border-[var(--color-primary)]' : 'bg-transparent border-[var(--border-subtle)] text-[var(--color-on-surface-variant)]'}`}
              >
                {d} phút
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleCreateRoom}
          disabled={!title}
          className={`w-full py-3 mt-4 rounded-xl font-bold transition-all ${title ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:opacity-90' : 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] cursor-not-allowed opacity-50'}`}
        >
          Tạo phòng
        </button>
      </div>
    </div>
  );

  const renderWaiting = () => (
    <div className="max-w-md mx-auto mt-10 p-6 rounded-2xl bg-[var(--color-surface-container)] border border-[var(--border-subtle)] text-center">
      <h2 className="text-xl font-bold mb-1">{title || "Chưa đặt tên"}</h2>
      <p className="text-[var(--color-on-surface-variant)] text-sm mb-6">{mode} • {duration} phút</p>
      
      <div className="p-6 bg-[var(--color-surface)] rounded-xl border border-[var(--border-subtle)] mb-6">
        <p className="text-sm font-medium text-[var(--color-on-surface-variant)] mb-2">Mã mời (Invite Code)</p>
        <div className="flex items-center justify-center gap-3">
          <span className="text-3xl font-mono font-bold tracking-widest text-[var(--color-primary)]">{inviteCode}</span>
          <button onClick={copyToClipboard} className="p-2 bg-[var(--color-surface-container-high)] rounded-lg hover:bg-[var(--color-primary-container)] transition-colors">
            {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 mb-8 p-4 rounded-xl bg-[var(--color-surface-container-highest)]">
        <Users size={24} className={partnerJoined ? "text-green-500" : "text-[var(--color-on-surface-variant)]"} />
        <span className="font-medium">
          {partnerJoined ? "Partner đã tham gia" : "Đang chờ partner..."}
        </span>
      </div>

      <button
        onClick={startDemoSession}
        disabled={!partnerJoined}
        className={`w-full py-3 rounded-xl font-bold transition-all ${partnerJoined ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:opacity-90 shadow-lg shadow-[var(--color-primary)]/30' : 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] cursor-not-allowed opacity-50'}`}
      >
        Start Demo Session
      </button>
    </div>
  );

  const renderActive = () => (
    <div className="max-w-4xl mx-auto mt-4 p-4">
      {countdown !== null ? (
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <h2 className="text-2xl font-bold text-[var(--color-on-surface-variant)] mb-4">Chuẩn bị...</h2>
          <div className="text-8xl font-bold text-[var(--color-primary)] animate-pulse">{countdown}</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="p-4 rounded-2xl bg-[var(--color-surface-container)] border border-[var(--border-subtle)] flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{title}</h2>
                <span className="text-sm px-2 py-1 bg-[var(--color-surface-container-high)] rounded-md text-[var(--color-on-surface-variant)]">{mode}</span>
              </div>
              <div className="text-4xl font-mono font-bold tracking-tight text-[var(--color-primary)]">
                {formatTime(timeLeft)}
              </div>
            </div>

            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video border border-[var(--border-subtle)] flex items-center justify-center">
              {cameraStatus === "Camera Off" ? (
                <div className="text-center text-white/50">
                  <CameraOff size={48} className="mx-auto mb-2 opacity-50" />
                  <p>Camera bị tắt hoặc không có quyền truy cập</p>
                </div>
              ) : (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              )}
              
              <div className="absolute top-4 left-4 flex gap-2">
                <div className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md flex items-center gap-1 border
                  ${cameraStatus === 'Focused' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 
                    cameraStatus === 'Away' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 
                    cameraStatus === 'Detecting' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 
                    'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}
                >
                  <div className={`w-2 h-2 rounded-full ${cameraStatus === 'Focused' ? 'bg-green-400' : cameraStatus === 'Away' ? 'bg-red-400' : cameraStatus === 'Detecting' ? 'bg-yellow-400' : 'bg-gray-400'} ${cameraStatus === 'Focused' || cameraStatus === 'Away' ? 'animate-pulse' : ''}`}></div>
                  {cameraStatus}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20 text-xs">
              <Info size={16} className="shrink-0 mt-0.5" />
              <p>Camera chỉ dùng để phân tích sự hiện diện trong phiên demo. Video không được lưu trữ hoặc gửi lên server.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[var(--color-surface-container)] border border-[var(--border-subtle)]">
              <h3 className="font-semibold text-sm text-[var(--color-on-surface-variant)] mb-4 uppercase tracking-wider">AI Coach Stats</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Focus Score</span>
                    <span className="font-bold">{focusScore}%</span>
                  </div>
                  <div className="w-full h-2 bg-[var(--color-surface-container-high)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--color-primary)] transition-all duration-500" style={{ width: `${focusScore}%` }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Presence</span>
                    <span className="font-bold">{presenceScore}%</span>
                  </div>
                  <div className="w-full h-2 bg-[var(--color-surface-container-high)] rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${presenceScore}%` }}></div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-[var(--border-subtle)]">
                  <span className="text-sm text-[var(--color-on-surface-variant)]">Away Count</span>
                  <span className="font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded-md">{awayCount}</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--color-surface-container)] border border-[var(--border-subtle)]">
              <h3 className="font-semibold text-sm text-[var(--color-on-surface-variant)] mb-3 uppercase tracking-wider">Partner</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-surface-container-high)] flex items-center justify-center font-bold">P</div>
                <div>
                  <div className="font-medium">Partner Demo</div>
                  <div className="text-xs text-green-500 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Online & Focused
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleEndSession}
              className="w-full py-3 rounded-xl font-bold bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 transition-colors mt-8"
            >
              Kết thúc phiên
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderReport = () => {
    let xpEarned = 30;
    if (focusScore >= 90) xpEarned = 180;
    else if (focusScore >= 70) xpEarned = 120;
    else if (focusScore >= 50) xpEarned = 80;

    let aiInsight = "Phiên làm việc có khá nhiều xao nhãng. Hãy thử dọn dẹp không gian và chọn phiên ngắn hơn nhé!";
    if (focusScore >= 90) aiInsight = "Tuyệt vời! Bạn đã duy trì sự tập trung cực kỳ ấn tượng trong suốt phiên.";
    else if (focusScore >= 70) aiInsight = "Khá ổn! Bạn có một vài lần mất tập trung nhỏ, nhưng tổng thể vẫn rất tốt.";

    const actualTimeLeft = isNaN(timeLeft) ? 0 : timeLeft;
    const timeSpent = Math.max(0, duration * 60 - actualTimeLeft);
    const sessionDurationText = `${Math.floor(timeSpent / 60)} phút ${(timeSpent % 60).toString().padStart(2, '0')} giây`;

    return (
      <div className="max-w-xl mx-auto mt-10 p-6 rounded-3xl bg-[var(--color-surface-container)] border border-[var(--border-subtle)] shadow-xl shadow-black/5">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--color-primary-container)] text-[var(--color-primary)] mb-4">
            <Award size={32} />
          </div>
          <h2 className="text-3xl font-bold mb-2">Session Complete!</h2>
          <p className="text-[var(--color-on-surface-variant)]">{title}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--border-subtle)] flex flex-col items-center justify-center text-center">
            <Clock size={20} className="text-[var(--color-on-surface-variant)] mb-2" />
            <span className="text-2xl font-bold">{sessionDurationText}</span>
            <span className="text-xs text-[var(--color-on-surface-variant)] uppercase tracking-wider mt-1">Duration</span>
          </div>
          <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--border-subtle)] flex flex-col items-center justify-center text-center">
            <Zap size={20} className="text-yellow-500 mb-2" />
            <span className="text-2xl font-bold text-yellow-500">+{xpEarned} XP</span>
            <span className="text-xs text-[var(--color-on-surface-variant)] uppercase tracking-wider mt-1">Earned</span>
          </div>
          <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--border-subtle)] flex flex-col items-center justify-center text-center">
            <Target size={20} className="text-[var(--color-primary)] mb-2" />
            <span className="text-2xl font-bold">{focusScore}%</span>
            <span className="text-xs text-[var(--color-on-surface-variant)] uppercase tracking-wider mt-1">Focus Score</span>
          </div>
          <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--border-subtle)] flex flex-col items-center justify-center text-center">
            <Users size={20} className="text-blue-400 mb-2" />
            <span className="text-2xl font-bold text-red-400">{awayCount}</span>
            <span className="text-xs text-[var(--color-on-surface-variant)] uppercase tracking-wider mt-1">Away Count</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--color-primary-container)]/30 border border-[var(--color-primary)]/20 mb-8">
          <div className="flex items-start gap-3">
            <Brain size={24} className="text-[var(--color-primary)] shrink-0" />
            <div>
              <h4 className="font-bold text-[var(--color-primary)] text-sm mb-1">AI Coach Insight</h4>
              <p className="text-sm leading-relaxed text-[var(--color-on-surface)]">{aiInsight}</p>
            </div>
          </div>
        </div>

        <button
          onClick={resetRoom}
          className="w-full py-4 rounded-xl font-bold bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:opacity-90 transition-all shadow-lg shadow-[var(--color-primary)]/30"
        >
          Tạo phòng mới
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-full pb-20">
      <header className="px-6 py-4 flex items-center justify-between sticky top-0 z-10 bg-[var(--color-background)]/80 backdrop-blur-md border-b border-[var(--border-subtle)]">
        <h1 className="text-xl font-bold flex items-center gap-2">
          Discipline Room 
          <span className="text-[10px] uppercase bg-[var(--color-primary)] text-white px-2 py-0.5 rounded-full">Demo</span>
        </h1>
      </header>
      
      <div className="p-4 md:p-6">
        {phase === "CREATE" && renderCreate()}
        {phase === "WAITING" && renderWaiting()}
        {phase === "ACTIVE" && renderActive()}
        {phase === "REPORT" && renderReport()}
      </div>
    </div>
  );
}
