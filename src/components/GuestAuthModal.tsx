import React from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Sparkles, Users, ShieldCheck, Unlock } from "lucide-react";
import type { GuestAuthTrigger } from "../store/goalStore";

interface GuestAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinueAsGuest?: () => void;
  trigger: GuestAuthTrigger;
}

const fullAccess = {
  icon: <Unlock size={24} />,
  title: "Mở khoá trải nghiệm đầy đủ",
  description:
    "Tính năng này yêu cầu tài khoản. Đăng nhập để truy cập AI Coach, thống kê chi tiết, bạn bè và đồng bộ dữ liệu.",
  loginLabel: "Đăng nhập",
  registerLabel: "Đăng ký - miễn phí",
};

const contentByTrigger: Record<
  GuestAuthTrigger,
  {
    icon: React.ReactNode;
    title: string;
    description: string;
    loginLabel: string;
    registerLabel: string;
    allowGuest?: boolean;
  }
> = {
  create_goal: {
    icon: (
      <div className="flex items-center gap-1">
        <Lock size={22} />
        <Sparkles size={18} />
      </div>
    ),
    title: "Lưu mục tiêu của bạn mãi mãi",
    description:
      "Đăng nhập để sao lưu mục tiêu lên đám mây, theo dõi tiến độ mọi lúc mọi nơi và không bao giờ mất dữ liệu.",
    loginLabel: "Đăng nhập",
    registerLabel: "Tạo tài khoản miễn phí",
    allowGuest: true,
  },
  groups: {
    icon: <Users size={24} />,
    title: "Cùng chinh phục mục tiêu với bạn bè",
    description: "Tham gia nhóm, chia sẻ tiến độ và tạo động lực cho nhau - tính năng này cần tài khoản.",
    loginLabel: "Đăng nhập ngay",
    registerLabel: "Đăng ký - miễn phí",
  },
  discipline_room: {
    icon: <ShieldCheck size={24} />,
    title: "Phòng Kỷ Luật dành cho người nghiêm túc",
    description:
      "Học cùng người lạ, AI giám sát, không có chỗ cho sự trì hoãn. Tạo tài khoản để vào phòng.",
    loginLabel: "Đăng nhập",
    registerLabel: "Đăng ký - miễn phí",
  },
  friends: fullAccess,
  stats: fullAccess,
  ai_coach: fullAccess,
  sync: fullAccess,
};

export const GuestAuthModal: React.FC<GuestAuthModalProps> = ({
  isOpen,
  onClose,
  onContinueAsGuest,
  trigger,
}) => {
  const navigate = useNavigate();
  const content = contentByTrigger[trigger];

  if (!isOpen) return null;

  const goAuth = (tab: "login" | "register") => {
    onClose();
    navigate(`/login?tab=${tab}`);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center px-0 py-0 animate-[guestAuthFade_160ms_ease-out] sm:items-center sm:px-4 sm:py-6"
      style={{ background: "rgba(15, 18, 32, 0.42)", backdropFilter: "blur(10px)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-auth-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-[420px] rounded-t-3xl border p-5 shadow-2xl sm:rounded-2xl"
        style={{
          background: "var(--color-surface-container)",
          borderColor: "var(--border-subtle)",
          color: "var(--color-on-surface)",
        }}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
            style={{
              background: "var(--color-primary-container)",
              color: "var(--color-primary)",
            }}
          >
            {content.icon}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-2 py-1 text-xl leading-none opacity-60 transition hover:opacity-100"
            aria-label="Đóng"
          >
            ×
          </button>
        </div>

        <h2 id="guest-auth-title" className="text-xl font-black tracking-tight">
          {content.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-on-surface-variant)" }}>
          {content.description}
        </p>

        <div className="mt-5 grid gap-3">
          <button
            type="button"
            onClick={() => goAuth("login")}
            className="w-full rounded-xl px-4 py-3 text-sm font-bold transition active:scale-[0.98]"
            style={{
              background: "var(--color-primary)",
              color: "var(--color-on-primary)",
            }}
          >
            {content.loginLabel}
          </button>
          <button
            type="button"
            onClick={() => goAuth("register")}
            className="w-full rounded-xl border px-4 py-3 text-sm font-bold transition active:scale-[0.98]"
            style={{
              borderColor: "var(--border-subtle)",
              color: "var(--color-primary)",
              background: "var(--color-surface)",
            }}
          >
            {content.registerLabel}
          </button>
          {content.allowGuest && onContinueAsGuest && (
            <button
              type="button"
              onClick={onContinueAsGuest}
              className="w-full px-4 py-2 text-sm font-semibold transition hover:opacity-80"
              style={{ color: "var(--color-on-surface-variant)" }}
            >
              Tiếp tục không lưu trên thiết bị này
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes guestAuthFade {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default GuestAuthModal;
