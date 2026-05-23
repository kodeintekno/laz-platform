import React from "react";
import { CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";

export interface AlertProps {
  children: React.ReactNode;
  intent?: "success" | "error" | "warning" | "info";
  title?: string;
  className?: string;
}

export function Alert({ children, intent = "info", title, className = "" }: AlertProps) {
  const iconMap = {
    success: <CheckCircle className="h-5 w-5 text-emerald-500" />,
    error: <AlertCircle className="h-5 w-5 text-red-500" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
  };

  const bgMap = {
    success: "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/20 dark:border-emerald-800/30 dark:text-emerald-300",
    error: "bg-red-50 border-red-200 text-red-900 dark:bg-red-950/20 dark:border-red-800/30 dark:text-red-300",
    warning: "bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/20 dark:border-amber-800/30 dark:text-amber-300",
    info: "bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950/20 dark:border-blue-800/30 dark:text-blue-300",
  };

  return (
    <div
      role="alert"
      className={`flex gap-3 p-4 rounded-xl border transition-all duration-150 ${bgMap[intent]} ${className}`}
    >
      <div className="flex-shrink-0 mt-0.5">{iconMap[intent]}</div>
      <div className="flex-1 space-y-1">
        {title && <h5 className="font-bold text-sm leading-none">{title}</h5>}
        <div className="text-sm">{children}</div>
      </div>
    </div>
  );
}
