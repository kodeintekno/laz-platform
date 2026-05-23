import React from "react";

export interface BadgeProps {
  children: React.ReactNode;
  intent?: "success" | "warning" | "destructive" | "info" | "muted";
  className?: string;
}

export function Badge({ children, intent = "muted", className = "" }: BadgeProps) {
  const baseStyle = "inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset transition-colors duration-150";

  const intentStyles = {
    success: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-500/20",
    warning: "bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-950/30 dark:text-amber-400 dark:ring-amber-500/20",
    destructive: "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-950/30 dark:text-red-400 dark:ring-red-500/20",
    info: "bg-blue-50 text-blue-700 ring-blue-700/10 dark:bg-blue-950/30 dark:text-blue-400 dark:ring-blue-500/20",
    muted: "bg-gray-50 text-gray-600 ring-gray-500/10 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
  };

  return (
    <span className={`${baseStyle} ${intentStyles[intent]} ${className}`}>
      {children}
    </span>
  );
}
