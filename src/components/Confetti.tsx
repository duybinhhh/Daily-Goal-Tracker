import React, { useEffect, useState } from "react";

interface Particle {
  id: number;
  left: string;
  color: string;
  size: string;
  delay: string;
  duration: string;
  transform: string;
}

export const Confetti: React.FC = () => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const colors = [
      "var(--color-primary)",
      "var(--color-secondary)",
      "var(--color-tertiary)",
    ];

    const initialParticles: Particle[] = Array.from({ length: 45 }).map((_, i) => {
      const left = `${Math.random() * 100}%`;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = `${Math.random() * 8 + 6}px`; // 6px to 14px
      const delay = `${Math.random() * 1.5}s`;
      const duration = `${Math.random() * 2.5 + 1.5}s`; // 1.5s to 4s
      const transform = `rotate(${Math.random() * 360}deg)`;
      return { id: i, left, color, size, delay, duration, transform };
    });

    setParticles(initialParticles);

    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 9999,
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(105vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            top: "-20px",
            left: p.left,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? "50%" : "3px",
            opacity: 0.8,
            animationName: "confetti-fall",
            animationDuration: p.duration,
            animationDelay: p.delay,
            animationTimingFunction: "linear",
            animationIterationCount: 1,
            animationFillMode: "forwards",
            transform: p.transform,
          }}
        />
      ))}
    </div>
  );
};

export default Confetti;
