// src/components/ui/Button.tsx
import React, { ButtonHTMLAttributes, forwardRef } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      isLoading,
      children,
      disabled,
      style,
      ...props
    },
    ref
  ) => {
    const sizeStyles: Record<string, React.CSSProperties> = {
      sm: { padding: "6px 14px", fontSize: "11px" },
      md: { padding: "9px 20px", fontSize: "13px" },
      lg: { padding: "12px 28px", fontSize: "15px" },
    };

    const variantClass: Record<string, string> = {
      primary: "btn-primary",
      secondary: "btn-ghost",
      danger: "btn-danger-ghost",
      ghost: "btn-ghost",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${variantClass[variant]} ${className}`}
        style={{
          ...sizeStyles[size],
          opacity: disabled || isLoading ? 0.5 : 1,
          cursor: disabled || isLoading ? "not-allowed" : "pointer",
          ...style,
        }}
        {...props}
      >
        {isLoading && (
          <div
            className="spinner"
            style={{ width: "14px", height: "14px", marginRight: "6px" }}
          />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
