import React from "react";

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-surface rounded-xl shadow-soft overflow-hidden flex flex-col ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`p-6 sm:p-8 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={`text-lg font-bold leading-6 text-primary ${className}`}>
      {children}
    </h3>
  );
}

export function CardContent({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`p-6 sm:p-8 flex-1 ${className}`}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-surface-soft p-6 sm:p-8 ${className}`}>
      {children}
    </div>
  );
}
