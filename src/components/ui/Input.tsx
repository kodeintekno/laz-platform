import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", error = false, disabled, ...props }, ref) => {
    const baseStyle =
      "block w-full rounded-xl border py-2.5 px-4 text-foreground bg-surface placeholder:text-muted-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:pointer-events-none transition duration-150 sm:text-sm sm:leading-6";

    const stateStyle = error
      ? "border-destructive focus:border-destructive focus:ring-destructive/30"
      : "border-border focus:border-primary focus:ring-primary/30";

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
