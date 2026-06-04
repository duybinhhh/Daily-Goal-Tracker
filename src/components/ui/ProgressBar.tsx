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

  const heightMap = { sm: "4px", md: "6px", lg: "8px" };
  const height = heightMap[size];

  let fillColor = "var(--color-primary)";
  if (percentage >= 100) {
    fillColor = "var(--color-secondary)";
  } else if (percentage >= 50) {
    fillColor = "var(--color-primary)";
  } else if (percentage > 0) {
    fillColor = "var(--color-tertiary)";
  } else {
    fillColor = "var(--color-surface-container-high)";
  }

  return (
    <div style={{ width: "100%" }}>
      {(label || showPercent) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "8px",
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--color-on-surface-variant)",
          }}
        >
          {label && (
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </span>
          )}
          {showPercent && (
            <span
              style={{
                color:
                  percentage >= 100
                    ? "var(--color-secondary)"
                    : "var(--color-on-surface-variant)",
              }}
            >
              {percentage}% ({value}/{max})
            </span>
          )}
        </div>
      )}
      <div
        style={{
          width: "100%",
          height,
          background: "var(--color-surface-container-high)",
          borderRadius: "9999px",
          overflow: "hidden",
        }}
      >
        <motion.div
          style={{
            height: "100%",
            borderRadius: "9999px",
            background: fillColor,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
