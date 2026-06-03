// src/components/ui/ProgressBar.tsx
import React from "react";
import { motion } from "motion/react";

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  size?: "sm" | "md" | "lg";
  showPercent?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max,
  label,
  size = "md",
  showPercent = true,
}) => {
  const percentage = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  const heightClass = {
    sm: "h-1.5",
    md: "h-3",
    lg: "h-4",
  }[size];

  let progressColor = "bg-sky-500";
  if (percentage >= 100) {
    progressColor = "bg-gradient-to-r from-emerald-500 to-teal-400";
  } else if (percentage >= 50) {
    progressColor = "bg-gradient-to-r from-emerald-600 to-sky-500";
  } else if (percentage > 0) {
    progressColor = "bg-amber-500";
  } else {
    progressColor = "bg-slate-800";
  }

  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-400">
          {label && <span className="line-clamp-1 truncate">{label}</span>}
          {showPercent && (
            <span
              className={
                percentage >= 100 ? "text-emerald-400 font-semibold" : "text-slate-400"
              }
            >
              {percentage}% ({value}/{max})
            </span>
          )}
        </div>
      )}
      <div className={`w-full overflow-hidden rounded-full bg-slate-900 border border-slate-800/80 p-[2px] ${heightClass}`}>
        <motion.div
          className={`h-full rounded-full ${progressColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
