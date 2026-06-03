// src/components/ui/Card.tsx
import React, { HTMLAttributes, forwardRef } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", children, hoverable = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`bg-slate-900 border border-slate-800/80 rounded-xl p-6 transition-all duration-300 ${
          hoverable ? "hover:border-slate-700/80 hover:translate-y-[-2px] hover:shadow-lg hover:shadow-black/25" : ""
        } ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export default Card;
