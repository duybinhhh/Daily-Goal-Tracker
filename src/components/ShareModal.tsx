// src/components/ShareModal.tsx
import React, { useRef, useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "badge" | "heatmap";
  data: {
    title: string;
    description: string;
    streakCount?: number;
    goalTitle?: string;
    heatmapData?: { date: string; count: number }[];
  };
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, type, data }) => {
  const { user } = useAuthStore();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [canShare, setCanShare] = useState<boolean>(false);

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.share && navigator.canShare) {
      setCanShare(true);
    }
  }, []);

  // Draw card on canvas whenever data/type/isOpen changes
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear and draw background gradient (modern dark space background)
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, "#0b0b1e"); // Deep purple-black
    grad.addColorStop(0.5, "#0f172a"); // Dark slate
    grad.addColorStop(1, "#020617"); // Midnight black
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw glowing circles (accent glows behind the card)
    ctx.save();
    const glowGrad1 = ctx.createRadialGradient(200, 200, 10, 200, 200, 300);
    glowGrad1.addColorStop(0, "rgba(99, 102, 241, 0.15)"); // Indigo glow
    glowGrad1.addColorStop(1, "rgba(99, 102, 241, 0)");
    ctx.fillStyle = glowGrad1;
    ctx.beginPath();
    ctx.arc(200, 200, 300, 0, Math.PI * 2);
    ctx.fill();

    const glowGrad2 = ctx.createRadialGradient(1000, 430, 10, 1000, 430, 250);
    glowGrad2.addColorStop(0, "rgba(78, 222, 163, 0.12)"); // Emerald glow
    glowGrad2.addColorStop(1, "rgba(78, 222, 163, 0)");
    ctx.fillStyle = glowGrad2;
    ctx.beginPath();
    ctx.arc(1000, 430, 250, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw card container (Glassmorphic card layout)
    const cardX = 100;
    const cardY = 80;
    const cardWidth = 1000;
    const cardHeight = 470;
    const radius = 24;

    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 15;

    // Translucent white glass background
    ctx.fillStyle = "rgba(255, 255, 255, 0.035)";
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(cardX, cardY, cardWidth, cardHeight, radius) : ctx.rect(cardX, cardY, cardWidth, cardHeight);
    ctx.fill();

    // Translucent border highlight
    const borderGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardWidth, cardY + cardHeight);
    borderGrad.addColorStop(0, "rgba(255, 255, 255, 0.15)");
    borderGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.03)");
    borderGrad.addColorStop(1, "rgba(99, 102, 241, 0.25)");
    ctx.strokeStyle = borderGrad;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // Draw App Logo: Lightning Bolt & "DailyGoal"
    ctx.fillStyle = "#6366f1"; // Indigo
    ctx.beginPath();
    // Simple lightning path
    ctx.moveTo(150, 140);
    ctx.lineTo(165, 140);
    ctx.lineTo(158, 155);
    ctx.lineTo(170, 155);
    ctx.lineTo(152, 180);
    ctx.lineTo(157, 160);
    ctx.lineTo(148, 160);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px system-ui, -apple-system, sans-serif";
    ctx.fillText("DailyGoal", 185, 153);
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.font = "semibold 12px system-ui, sans-serif";
    ctx.fillText("TRACKER", 185, 172);

    // Draw user info tag on top-right
    const userName = user?.name || "Achiever";
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(800, 130, 250, 44, 22) : ctx.rect(800, 130, 250, 44);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 15px system-ui, sans-serif";
    ctx.fillText(userName, 825, 157);
    ctx.fillStyle = "#6366f1";
    ctx.font = "bold 10px system-ui, sans-serif";
    ctx.fillText("PRO MEMBER", 955, 156);

    // Render Badge Mode Card Content
    if (type === "badge") {
      // Draw Badge Icon (Trophy or Fire)
      const isStreak = data.title.toLowerCase().includes("streak");
      const badgeEmoji = isStreak ? "🔥" : "🏆";

      ctx.save();
      // Neon glow behind emoji
      ctx.shadowColor = isStreak ? "rgba(249, 115, 22, 0.4)" : "rgba(234, 179, 8, 0.4)";
      ctx.shadowBlur = 40;
      ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
      ctx.beginPath();
      ctx.arc(300, 320, 95, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.stroke();
      ctx.restore();

      ctx.font = "105px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(badgeEmoji, 300, 315);

      // Reset align
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";

      // Draw texts
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "bold 36px system-ui, sans-serif";
      ctx.fillText(data.title, 440, 280);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "18px system-ui, sans-serif";
      // Wrap description text into lines
      const descWords = data.description.split(" ");
      let line = "";
      let lineY = 325;
      const maxWidth = 580;
      for (let n = 0; n < descWords.length; n++) {
        const testLine = line + descWords[n] + " ";
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          ctx.fillText(line, 440, lineY);
          line = descWords[n] + " ";
          lineY += 28;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, 440, lineY);

      // Streak badge tag if applicable
      if (data.streakCount && data.streakCount > 0) {
        ctx.fillStyle = "rgba(249, 115, 22, 0.12)";
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(440, lineY + 25, 180, 38, 10) : ctx.rect(440, lineY + 25, 180, 38);
        ctx.fill();
        ctx.strokeStyle = "rgba(249, 115, 22, 0.3)";
        ctx.stroke();

        ctx.fillStyle = "#fb923c";
        ctx.font = "bold 14px system-ui, sans-serif";
        ctx.fillText(`🔥 ${data.streakCount}-Day Streak Active`, 458, lineY + 49);
      }
    } else {
      // Render Heatmap Mode Card Content
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "bold 28px system-ui, sans-serif";
      ctx.fillText("Consistency Heatmap", 150, 240);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "16px system-ui, sans-serif";
      ctx.fillText("Discipline is choosing between what you want now and what you want most.", 150, 275);

      // Render a mini 24-week heatmap grid (168 days)
      const gridX = 150;
      const gridY = 320;
      const cellSize = 18;
      const gap = 5;
      const rows = 7;
      const cols = 24;

      const heatmapCells = data.heatmapData || [];

      // If we don't have enough data, generate mock consistent items for visual look
      const displayData: number[] = [];
      const totalCells = rows * cols;
      const offset = Math.max(0, heatmapCells.length - totalCells);

      for (let i = 0; i < totalCells; i++) {
        const idx = offset + i;
        if (idx < heatmapCells.length) {
          displayData.push(heatmapCells[idx].count);
        } else {
          // Generate realistic routine pattern for placeholder preview
          displayData.push(Math.random() > 0.45 ? (Math.random() > 0.7 ? 3 : 1) : 0);
        }
      }

      ctx.save();
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const count = displayData[c * rows + r];
          let color = "#1e293b"; // Empty cell (slate-800)
          
          if (count === 1) color = "#065f46"; // green-800
          else if (count === 2) color = "#047857"; // green-700
          else if (count >= 3) color = "#10b981"; // green-500 (bright emerald)

          ctx.fillStyle = color;
          
          const x = gridX + c * (cellSize + gap);
          const y = gridY + r * (cellSize + gap);
          
          ctx.beginPath();
          ctx.roundRect ? ctx.roundRect(x, y, cellSize, cellSize, 4) : ctx.rect(x, y, cellSize, cellSize);
          ctx.fill();
        }
      }
      ctx.restore();

      // Draw Legend
      ctx.fillStyle = "#94a3b8";
      ctx.font = "semibold 12px system-ui, sans-serif";
      ctx.fillText("Less", gridX, gridY + rows * (cellSize + gap) + 25);

      const legX = gridX + 45;
      const legY = gridY + rows * (cellSize + gap) + 14;
      const legColors = ["#1e293b", "#065f46", "#047857", "#10b981"];
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = legColors[i];
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(legX + i * 20, legY, 14, 14, 3) : ctx.rect(legX + i * 20, legY, 14, 14);
        ctx.fill();
      }
      ctx.fillStyle = "#94a3b8";
      ctx.fillText("More", legX + 85, gridY + rows * (cellSize + gap) + 25);
    }

    // Convert to Image URL
    try {
      const url = canvas.toDataURL("image/png");
      setImageUrl(url);
    } catch (e) {
      console.error("Canvas toDataURL failed:", e);
    }
  }, [isOpen, type, data, user]);

  if (!isOpen) return null;

  const downloadImage = () => {
    if (!imageUrl) return;
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `dailygoal_badge_${type}_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyShareText = () => {
    const text = `🔥 Check out my achievement on Daily Goal Tracker! I completed "${data.title}": ${data.description}. Join me in building healthy daily habits!`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareNative = async () => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], "achievement.png", { type: "image/png" });
        const shareData = {
          title: "My Daily Goal Achievement",
          text: `🔥 I completed my habit target "${data.title}" on DailyGoal Tracker!`,
          files: [file]
        };
        if (navigator.canShare && navigator.canShare(shareData)) {
          await navigator.share(shareData);
        } else {
          // Fallback text share
          await navigator.share({
            title: "My Daily Goal Achievement",
            text: `🔥 I completed my habit target "${data.title}" on DailyGoal Tracker: ${data.description}!`,
            url: window.location.origin
          });
        }
      });
    } catch (err) {
      console.error("Native share failed:", err);
    }
  };

  // Redirection URLs
  const shareText = `🔥 Check out my consistency achievement on DailyGoal Tracker: "${data.title}"! ${data.description} #discipline #goals`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(shareText)}&u=${encodeURIComponent(window.location.origin)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-opacity">
      <div 
        className="relative w-full max-w-4xl p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col md:flex-row gap-6 overflow-hidden"
        style={{
          background: "rgba(15, 23, 42, 0.85)",
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)"
        }}
      >
        {/* Render Canvas Hidden - we render the image url in the DOM for scaling */}
        <canvas 
          ref={canvasRef} 
          width={1200} 
          height={630} 
          style={{ display: "none" }}
        />

        {/* Card Image Preview Column */}
        <div className="flex-1 flex flex-col items-center justify-center bg-black/20 rounded-2xl p-4 border border-white/5">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">Shareable Card Preview</p>
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt="Share preview" 
              className="w-full aspect-[1200/630] rounded-xl object-contain shadow-lg hover:scale-[1.01] transition-transform duration-300 border border-white/10"
            />
          ) : (
            <div className="w-full aspect-[1200/630] flex items-center justify-center">
              <div className="animate-spin h-6 w-6 border-t-2 border-primary border-transparent rounded-full" />
            </div>
          )}
          <p className="text-[10px] text-slate-500 mt-3 text-center">Perfect size for Twitter Cards & Facebook feed posts (1200x630px)</p>
        </div>

        {/* Action Controls Column */}
        <div className="w-full md:w-80 flex flex-col justify-between py-2">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-on-surface">Share Achievement</h3>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-on-surface border-none cursor-pointer"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>close</span>
              </button>
            </div>
            
            <p className="text-sm text-on-surface-variant mb-5">
              Congratulations! Show off your consistency badge and inspire friends to build daily discipline.
            </p>

            <div className="space-y-2.5">
              <button 
                onClick={downloadImage}
                className="btn-primary w-full py-2.5 rounded-xl text-xs font-bold"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>download</span>
                Download High-Res PNG
              </button>

              {canShare && (
                <button 
                  onClick={shareNative}
                  className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 text-xs font-bold transition-all cursor-pointer"
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>share</span>
                  Share via Devices
                </button>
              )}

              <button 
                onClick={copyShareText}
                className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 text-xs font-bold transition-all cursor-pointer"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                  {copied ? "check" : "content_copy"}
                </span>
                {copied ? "Copied text!" : "Copy Share Message"}
              </button>
            </div>

            <div className="my-6 border-t border-white/10" />

            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Quick Social Links</p>
            <div className="flex gap-2">
              <a 
                href={twitterUrl} 
                target="_blank" 
                rel="noreferrer"
                className="flex-1 py-2.5 bg-[#1da1f2]/10 hover:bg-[#1da1f2]/20 text-[#1da1f2] border border-[#1da1f2]/20 rounded-xl text-xs font-bold text-center text-decoration-none transition-all"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "15px" }}>ios_share</span>
                Twitter
              </a>
              <a 
                href={facebookUrl} 
                target="_blank" 
                rel="noreferrer"
                className="flex-1 py-2.5 bg-[#1877f2]/10 hover:bg-[#1877f2]/20 text-[#1877f2] border border-[#1877f2]/20 rounded-xl text-xs font-bold text-center text-decoration-none transition-all"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "15px" }}>share</span>
                Facebook
              </a>
            </div>
          </div>
          
          <div className="mt-6 md:mt-0">
            <p className="text-[10px] text-slate-500 text-center font-semibold">
              Discipline is the bridge between goals and accomplishment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
