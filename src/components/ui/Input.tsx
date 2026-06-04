// src/components/ui/Input.tsx
import React, { InputHTMLAttributes, forwardRef } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  id?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, id, type = "text", ...props }, ref) => {
    return (
      <div style={{ width: "100%", marginBottom: "16px" }}>
        {label && (
          <label
            htmlFor={id}
            style={{
              display: "block",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              color: "var(--color-on-surface-variant)",
              marginBottom: "6px",
            }}
          >
            {label}
          </label>
        )}
        <div style={{ position: "relative" }}>
          <input
            id={id}
            ref={ref}
            type={type}
            className={`m-input ${className}`}
            style={
              error
                ? {
                    borderColor: "var(--color-error)",
                  }
                : {}
            }
            {...props}
          />
        </div>
        {error && (
          <p
            style={{
              marginTop: "5px",
              fontSize: "11px",
              fontWeight: 500,
              color: "var(--color-error)",
            }}
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
