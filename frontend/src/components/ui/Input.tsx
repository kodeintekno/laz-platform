"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { DatePicker } from "./DatePicker";

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

    if (type === "date") {
      const { value, defaultValue, onChange, placeholder, ...rest } = props;
      
      const [internalDate, setInternalDate] = React.useState<Date | null>(() => {
        const initialVal = value ?? defaultValue;
        if (typeof initialVal === "string" && initialVal.trim() !== "") {
          const parts = initialVal.split("-");
          if (parts.length === 3) {
            return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
          }
          return new Date(initialVal);
        }
        return null;
      });

      React.useEffect(() => {
        if (value !== undefined) {
          if (typeof value === "string" && value.trim() !== "") {
            const parts = value.split("-");
            if (parts.length === 3) {
              setInternalDate(new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)));
            } else {
              setInternalDate(new Date(value));
            }
          } else {
            setInternalDate(null);
          }
        }
      }, [value]);

      const handleDateChange = (date: Date | null) => {
        if (value === undefined) {
          setInternalDate(date);
        }
        if (onChange) {
          const isoStr = date 
            ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
            : "";
          const e = {
            target: { name: rest.name, value: isoStr },
            currentTarget: { name: rest.name, value: isoStr }
          } as React.ChangeEvent<HTMLInputElement>;
          onChange(e);
        }
      };

      return (
        <DatePicker
          {...(rest as any)}
          value={internalDate}
          onChange={handleDateChange}
          error={error}
          disabled={disabled}
          className={className}
        />
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
