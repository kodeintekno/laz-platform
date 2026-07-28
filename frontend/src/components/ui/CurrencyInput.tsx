"use client";

import React from "react";
import { useThousandsInput } from "@/hooks/useThousandsInput";

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> {
  value: number | null | undefined;
  onChange: (value: number) => void;
  error?: boolean;
  prefix?: string;
}

/** Text input that displays "1.000.000"-style formatting but reports/accepts plain numbers. */
export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, error = false, disabled, prefix, className = "", ...props }, forwardedRef) => {
    const { displayValue, handleChange, inputRef } = useThousandsInput(value ?? 0, onChange);

    React.useImperativeHandle(forwardedRef, () => inputRef.current as HTMLInputElement);

    const baseStyle =
      "block w-full rounded-xl border border-border/40 shadow-sm py-2.5 px-4 text-primary bg-surface placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:pointer-events-none transition duration-150 sm:text-sm sm:leading-6";
    const stateStyle = error
      ? "shadow-sm focus:border-destructive focus:ring-destructive/30"
      : "shadow-sm focus:border-primary focus:ring-primary/30";

    const input = (
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        disabled={disabled}
        aria-invalid={error ? "true" : "false"}
        value={displayValue}
        onChange={handleChange}
        className={`${baseStyle} ${stateStyle} ${prefix ? "pl-12" : ""} ${className}`}
        {...props}
      />
    );

    if (!prefix) return input;

    return (
      <div className="relative w-full">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 z-10">
          <span className="text-secondary font-medium sm:text-sm">{prefix}</span>
        </div>
        {input}
      </div>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";
