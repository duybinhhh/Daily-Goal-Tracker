import React, { useEffect } from 'react';
import { useXPStore } from '../store/xpStore';
import { LEVELS } from '../lib/xpSystem';
import Confetti from './Confetti'; // Component đã có từ US-15

export default function LevelUpModal() {
  const { pendingLevelUp, clearLevelUp } = useXPStore();

  // Auto-dismiss sau 5 giây
  useEffect(() => {
    if (!pendingLevelUp) return;
    const timer = setTimeout(clearLevelUp, 5000);
    return () => clearTimeout(timer);
  }, [pendingLevelUp, clearLevelUp]);

  if (!pendingLevelUp) return null;

  const clampedLevel = Math.min(Math.max(pendingLevelUp.toLevel, 1), LEVELS.length);
  const newLevelData = LEVELS[clampedLevel - 1];

  return (
    <>
      <Confetti />
      {/* Full-screen overlay */}
      <div
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
        onClick={clearLevelUp}
      >
        {/* Card */}
        <div
          className="flex flex-col items-center gap-4 p-8 rounded-3xl text-center"
          style={{
            background: 'var(--color-surface-container)',
            border: '2px solid var(--color-primary)',
            maxWidth: '340px',
            width: '90vw',
            boxShadow: '0 0 60px color-mix(in srgb, var(--color-primary) 40%, transparent)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Icon level mới */}
          <span style={{ fontSize: '72px', lineHeight: 1 }}>{newLevelData.icon}</span>

          {/* Title */}
          <div>
            <p
              className="font-black tracking-widest uppercase"
              style={{ fontSize: '28px', color: 'var(--color-primary)' }}
            >
              LEVEL UP!
            </p>
            <p style={{ fontSize: '14px', color: 'var(--color-on-surface-variant)', marginTop: '4px' }}>
              Bạn đã đạt cấp độ mới!
            </p>
          </div>

          {/* Level info */}
          <div
            className="px-6 py-3 rounded-2xl w-full"
            style={{ background: 'var(--color-primary-container)' }}
          >
            <p
              className="font-bold"
              style={{ fontSize: '20px', color: 'var(--color-on-primary-container)' }}
            >
              Level {newLevelData.level} — {newLevelData.name}
            </p>
            <p style={{ fontSize: '12px', color: 'var(--color-on-primary-container)', opacity: 0.7, marginTop: '2px' }}>
              Từ Level {pendingLevelUp.fromLevel} → Level {pendingLevelUp.toLevel}
            </p>
          </div>

          {/* CTA */}
          <button
            onClick={clearLevelUp}
            className="btn-primary w-full"
            style={{ marginTop: '4px' }}
          >
            Tuyệt vời! 🎉
          </button>
          <p style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)' }}>
            Tự động đóng sau 5 giây
          </p>
        </div>
      </div>
    </>
  );
}
