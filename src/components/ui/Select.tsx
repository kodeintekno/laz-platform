import React from "react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ children, className = "", error = false, disabled, ...props }, ref) => {
    const baseStyle =
      "block w-full rounded-xl border border-border/40 py-2.5 px-4 text-primary bg-surface placeholder:text-muted-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:pointer-events-none transition duration-150 sm:text-sm sm:leading-6 cursor-pointer";

    const stateStyle = error
      ? "shadow-sm focus:border-destructive focus:ring-destructive/30"
      : "shadow-sm focus:border-primary focus:ring-primary/30";

    return (
      <select
        ref={ref}
        disabled={disabled}
        aria-invalid={error ? "true" : "false"}
        className={`${baseStyle} ${stateStyle} ${className}`}
        {...props}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = "Select";
