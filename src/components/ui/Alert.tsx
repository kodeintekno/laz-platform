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
    success: <CheckCircle className="h-5 w-5 text-success" />,
    error: <AlertCircle className="h-5 w-5 text-destructive" />,
    warning: <AlertTriangle className="h-5 w-5 text-warning" />,
    info: <Info className="h-5 w-5 text-info-token" />,
  };

  const bgMap = {
    success: "bg-success/10 border-success/20 text-text-primary",
    error: "bg-destructive/10 border-destructive/20 text-text-primary",
    warning: "bg-warning/10 border-warning/20 text-text-primary",
    info: "bg-info-token/10 border-info-token/20 text-text-primary",
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
