import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", error = false, disabled, ...props }, ref) => {
    const baseStyle =
      "block w-full rounded-xl border border-border/40 shadow-sm py-2.5 px-4 text-primary bg-surface placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:pointer-events-none transition duration-150 sm:text-sm sm:leading-6";

    const stateStyle = error
      ? "shadow-sm focus:border-destructive focus:ring-destructive/30"
      : "shadow-sm focus:border-primary focus:ring-primary/30";

    return (
      <input
        ref={ref}
        disabled={disabled}
        aria-invalid={error ? "true" : "false"}
        className={`${baseStyle} ${stateStyle} ${className}`}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
