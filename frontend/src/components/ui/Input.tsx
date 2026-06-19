"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", error = false, disabled, type = "text", ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    const baseStyle =
      "block w-full rounded-xl border border-border/40 shadow-sm py-2.5 px-4 text-primary bg-surface placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:pointer-events-none transition duration-150 sm:text-sm sm:leading-6";

    const stateStyle = error
      ? "shadow-sm focus:border-destructive focus:ring-destructive/30"
      : "shadow-sm focus:border-primary focus:ring-primary/30";

    const isPassword = type === "password";
    const currentType = isPassword ? (showPassword ? "text" : "password") : type;

    if (isPassword) {
      return (
        <div className="relative w-full">
          <input
            ref={ref}
            disabled={disabled}
            type={currentType}
            aria-invalid={error ? "true" : "false"}
            className={`${baseStyle} ${stateStyle} pr-11 ${className}`}
            {...props}
          />
          <button
            type="button"
            disabled={disabled}
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-secondary hover:text-primary transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
      );
    }

    return (
      <input
        ref={ref}
        disabled={disabled}
        type={type}
        aria-invalid={error ? "true" : "false"}
        className={`${baseStyle} ${stateStyle} ${className}`}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
