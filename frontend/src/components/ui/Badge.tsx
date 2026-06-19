import React from "react";

export interface BadgeProps {
  children: React.ReactNode;
  intent?: "success" | "warning" | "destructive" | "info" | "muted";
  className?: string;
}

export function Badge({ children, intent = "muted", className = "" }: BadgeProps) {
  const baseStyle = "inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset transition-colors duration-150";

  const intentStyles = {
    success: "bg-success/10 text-success ring-success/20",
    warning: "bg-warning/10 text-warning ring-warning/20",
    destructive: "bg-destructive/10 text-destructive ring-destructive/20",
    info: "bg-info-token/10 text-info-token ring-info-token/20",
    muted: "bg-muted text-secondary ring-border",
  };

  return (
    <span className={`${baseStyle} ${intentStyles[intent]} ${className}`}>
      {children}
    </span>
  );
}
