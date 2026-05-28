import React from "react";
import { LoadingSpinner } from "./LoadingSpinner";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  intent?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = "",
      intent = "primary",
      size = "md",
      isLoading = false,
      disabled,
      type = "button",
      ...props
    },
    ref
  ) => {
    const baseStyle = "inline-flex items-center justify-center font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none rounded-xl cursor-pointer";

    const intentStyles = {
      primary: "bg-primary hover:bg-primary/90 text-white focus:ring-primary/20",
      secondary: "bg-surface hover:bg-surface-muted text-primary focus:ring-primary/20",
      outline: "border border-primary text-primary hover:bg-surface-muted focus:ring-primary/20",
      ghost: "text-primary hover:bg-surface-muted focus:ring-primary/20",
      destructive: "bg-destructive hover:bg-destructive/90 text-white focus:ring-destructive/20",
    };

    const sizeStyles = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2.5 text-sm",
      lg: "px-6 py-3.5 text-base",
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={`${baseStyle} ${intentStyles[intent]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading && <LoadingSpinner size="sm" className="mr-2 border-t-white" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
