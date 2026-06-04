// src/components/ui/Card.tsx
import React, { HTMLAttributes, forwardRef } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", children, hoverable = false, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`glass-card ${hoverable ? "glass-card-glow" : ""} ${className}`}
        style={{ padding: "20px", ...style }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export default Card;
